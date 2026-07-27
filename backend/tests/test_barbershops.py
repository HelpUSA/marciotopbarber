from app.models import BarbershopMembership

from sqlalchemy import select


import pytest

from app.core.security import hash_password
from app.main import app
from app.models import User
from app.schemas.barbershops import (
    BarbershopCreate,
    MembershipCreate,
    MembershipUpdate,
)
from app.services.access_hierarchy_service import (
    assign_role,
    seed_access_hierarchy,
)
from app.services.barbershop_service import (
    BarbershopConflictError,
    BarbershopPermissionError,
    add_or_update_member,
    create_barbershop,
    list_accessible_barbershops,
    list_members,
    update_member,
)
from app.services.identity_service import (
    seed_identity,
)


def prepare_identity(database) -> None:
    seed_identity(database)
    seed_access_hierarchy(database)


def create_user(
    database,
    *,
    name: str,
    email: str,
    role_slug: str,
):
    user = User(
        name=name,
        email=email,
        password_hash=hash_password(
            "Password-123456"
        ),
        active=True,
    )

    database.add(user)
    database.flush()

    assign_role(
        database,
        user_id=user.id,
        role_slug=role_slug,
    )

    database.commit()
    database.refresh(user)

    return user


def create_platform_user(
    database,
    suffix: str,
):
    return create_user(
        database,
        name="Platform Admin",
        email=f"platform-{suffix}@example.com",
        role_slug="platform-superadmin",
    )


def create_customer(
    database,
    *,
    name: str,
    email: str,
):
    return create_user(
        database,
        name=name,
        email=email,
        role_slug="customer",
    )


def test_superadmin_creates_barbershop_with_owner(
    db_session,
):
    prepare_identity(db_session)

    superadmin = create_platform_user(
        db_session,
        "create",
    )

    owner = create_customer(
        db_session,
        name="Proprietário",
        email="owner@example.com",
    )

    barbershop = create_barbershop(
        db_session,
        payload=BarbershopCreate(
            name="Barbearia Central",
            slug="Barbearia Central",
            owner_user_id=owner.id,
            email="central@example.com",
        ),
        actor_user_id=superadmin.id,
    )

    members = list_members(
        db_session,
        barbershop_id=barbershop.id,
        actor_user_id=superadmin.id,
    )

    assert barbershop.slug == "barbearia-central"
    assert len(members) == 1
    assert members[0][0].role == "barbershop-owner"
    assert members[0][1].id == owner.id


def test_owner_adds_administrator(
    db_session,
):
    prepare_identity(db_session)

    superadmin = create_platform_user(
        db_session,
        "owner-admin",
    )

    owner = create_customer(
        db_session,
        name="Proprietário",
        email="owner2@example.com",
    )

    administrator = create_customer(
        db_session,
        name="Administrador Local",
        email="local-admin@example.com",
    )

    barbershop = create_barbershop(
        db_session,
        payload=BarbershopCreate(
            name="Unidade Bessa",
            slug="unidade-bessa",
            owner_user_id=owner.id,
        ),
        actor_user_id=superadmin.id,
    )

    membership = add_or_update_member(
        db_session,
        barbershop_id=barbershop.id,
        payload=MembershipCreate(
            user_id=administrator.id,
            role="barbershop-administrator",
            active=True,
        ),
        actor_user_id=owner.id,
    )

    assert membership.user_id == administrator.id
    assert (
        membership.role
        == "barbershop-administrator"
    )

    accessible = list_accessible_barbershops(
        db_session,
        administrator.id,
    )

    assert len(accessible) == 1
    assert accessible[0][0].id == barbershop.id
    assert (
        accessible[0][1]
        == "barbershop-administrator"
    )


def test_administrator_cannot_assign_owner(
    db_session,
):
    prepare_identity(db_session)

    superadmin = create_platform_user(
        db_session,
        "admin-owner",
    )

    owner = create_customer(
        db_session,
        name="Owner",
        email="owner3@example.com",
    )

    administrator = create_customer(
        db_session,
        name="Admin",
        email="admin3@example.com",
    )

    candidate = create_customer(
        db_session,
        name="Candidate",
        email="candidate@example.com",
    )

    barbershop = create_barbershop(
        db_session,
        payload=BarbershopCreate(
            name="Unidade Norte",
            slug="unidade-norte",
            owner_user_id=owner.id,
        ),
        actor_user_id=superadmin.id,
    )

    add_or_update_member(
        db_session,
        barbershop_id=barbershop.id,
        payload=MembershipCreate(
            user_id=administrator.id,
            role="barbershop-administrator",
        ),
        actor_user_id=owner.id,
    )

    with pytest.raises(
        BarbershopPermissionError
    ):
        add_or_update_member(
            db_session,
            barbershop_id=barbershop.id,
            payload=MembershipCreate(
                user_id=candidate.id,
                role="barbershop-owner",
            ),
            actor_user_id=administrator.id,
        )


def test_operator_cannot_manage_members(
    db_session,
):
    prepare_identity(db_session)

    superadmin = create_platform_user(
        db_session,
        "operator",
    )

    owner = create_customer(
        db_session,
        name="Owner",
        email="owner4@example.com",
    )

    operator = create_customer(
        db_session,
        name="Operador",
        email="operator@example.com",
    )

    employee = create_customer(
        db_session,
        name="Funcionário",
        email="employee@example.com",
    )

    barbershop = create_barbershop(
        db_session,
        payload=BarbershopCreate(
            name="Unidade Sul",
            slug="unidade-sul",
            owner_user_id=owner.id,
        ),
        actor_user_id=superadmin.id,
    )

    add_or_update_member(
        db_session,
        barbershop_id=barbershop.id,
        payload=MembershipCreate(
            user_id=operator.id,
            role="operator",
        ),
        actor_user_id=owner.id,
    )

    with pytest.raises(
        BarbershopPermissionError
    ):
        add_or_update_member(
            db_session,
            barbershop_id=barbershop.id,
            payload=MembershipCreate(
                user_id=employee.id,
                role="employee",
            ),
            actor_user_id=operator.id,
        )


def test_owner_cannot_read_other_barbershop_members(
    db_session,
):
    prepare_identity(db_session)

    superadmin = create_platform_user(
        db_session,
        "isolation",
    )

    owner_a = create_customer(
        db_session,
        name="Owner A",
        email="owner-a@example.com",
    )

    owner_b = create_customer(
        db_session,
        name="Owner B",
        email="owner-b@example.com",
    )

    barbershop_a = create_barbershop(
        db_session,
        payload=BarbershopCreate(
            name="Barbearia A",
            slug="barbearia-a",
            owner_user_id=owner_a.id,
        ),
        actor_user_id=superadmin.id,
    )

    barbershop_b = create_barbershop(
        db_session,
        payload=BarbershopCreate(
            name="Barbearia B",
            slug="barbearia-b",
            owner_user_id=owner_b.id,
        ),
        actor_user_id=superadmin.id,
    )

    assert barbershop_a.id != barbershop_b.id

    with pytest.raises(
        BarbershopPermissionError
    ):
        list_members(
            db_session,
            barbershop_id=barbershop_b.id,
            actor_user_id=owner_a.id,
        )

    accessible = list_accessible_barbershops(
        db_session,
        owner_a.id,
    )

    assert len(accessible) == 1
    assert accessible[0][0].id == barbershop_a.id


def test_last_owner_cannot_be_deactivated(
    db_session,
):
    prepare_identity(db_session)

    superadmin = create_platform_user(
        db_session,
        "last-owner",
    )

    owner = create_customer(
        db_session,
        name="Only Owner",
        email="only-owner@example.com",
    )

    barbershop = create_barbershop(
        db_session,
        payload=BarbershopCreate(
            name="Barbearia Única",
            slug="barbearia-unica",
            owner_user_id=owner.id,
        ),
        actor_user_id=superadmin.id,
    )

    members = list_members(
        db_session,
        barbershop_id=barbershop.id,
        actor_user_id=superadmin.id,
    )

    with pytest.raises(
        BarbershopConflictError
    ):
        update_member(
            db_session,
            barbershop_id=barbershop.id,
            membership_id=members[0][0].id,
            payload=MembershipUpdate(
                active=False,
            ),
            actor_user_id=superadmin.id,
        )


def test_barbershop_routes_registered():
    paths = {
        route.path
        for route in app.routes
    }

    required = {
        "/api/v1/barbershops",
        "/api/v1/platform/barbershops",
        "/api/v1/barbershops/{barbershop_id}",
        (
            "/api/v1/barbershops/"
            "{barbershop_id}/members"
        ),
        (
            "/api/v1/barbershops/"
            "{barbershop_id}/members/"
            "{membership_id}"
        ),
    }

    assert not required - paths



def test_administrator_cannot_demote_owner(
    db_session,
):
    prepare_identity(db_session)
    superadmin = create_platform_user(db_session, "governance-owner")
    owner = create_customer(db_session, name="Owner", email="governance-owner@example.com")
    administrator = create_customer(db_session, name="Administrator", email="governance-admin@example.com")
    barbershop = create_barbershop(
        db_session,
        payload=BarbershopCreate(
            name="Governance One",
            slug="governance-one",
            owner_user_id=owner.id,
        ),
        actor_user_id=superadmin.id,
    )
    add_or_update_member(
        db_session,
        barbershop_id=barbershop.id,
        payload=MembershipCreate(
            user_id=administrator.id,
            role="barbershop-administrator",
        ),
        actor_user_id=owner.id,
    )
    owner_membership = db_session.scalar(
        select(BarbershopMembership).where(
            BarbershopMembership.barbershop_id == barbershop.id,
            BarbershopMembership.user_id == owner.id,
        )
    )
    assert owner_membership is not None
    with pytest.raises(BarbershopPermissionError):
        update_member(
            db_session,
            barbershop_id=barbershop.id,
            membership_id=owner_membership.id,
            payload=MembershipUpdate(role="operator"),
            actor_user_id=administrator.id,
        )


def test_administrator_cannot_disable_another_administrator(
    db_session,
):
    prepare_identity(db_session)
    superadmin = create_platform_user(db_session, "governance-admins")
    owner = create_customer(db_session, name="Owner", email="governance-owner2@example.com")
    first_admin = create_customer(db_session, name="Admin One", email="governance-admin1@example.com")
    second_admin = create_customer(db_session, name="Admin Two", email="governance-admin2@example.com")
    barbershop = create_barbershop(
        db_session,
        payload=BarbershopCreate(
            name="Governance Two",
            slug="governance-two",
            owner_user_id=owner.id,
        ),
        actor_user_id=superadmin.id,
    )
    for user in (first_admin, second_admin):
        add_or_update_member(
            db_session,
            barbershop_id=barbershop.id,
            payload=MembershipCreate(
                user_id=user.id,
                role="barbershop-administrator",
            ),
            actor_user_id=owner.id,
        )
    second_membership = db_session.scalar(
        select(BarbershopMembership).where(
            BarbershopMembership.barbershop_id == barbershop.id,
            BarbershopMembership.user_id == second_admin.id,
        )
    )
    assert second_membership is not None
    with pytest.raises(BarbershopPermissionError):
        update_member(
            db_session,
            barbershop_id=barbershop.id,
            membership_id=second_membership.id,
            payload=MembershipUpdate(active=False),
            actor_user_id=first_admin.id,
        )
