import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRound,
  XCircle,
} from "lucide-react";

import AdminModal from "../components/AdminModal";

import {
  useAdminAuth,
} from "../auth/AdminAuthContext";

const inputClass = [
  "w-full rounded-xl border border-white/15",
  "bg-black/25 px-4 py-3 text-white",
  "outline-none transition",
  "placeholder:text-neutral-600",
  "focus:border-accent",
  "focus:ring-2 focus:ring-accent/20",
].join(" ");

function createBlankForm(defaultRole) {
  return {
    name: "",
    email: "",
    password: "",
    role_slugs: defaultRole
      ? [defaultRole]
      : [],
    active: true,
  };
}

function formatDate(value) {
  if (!value) {
    return "Nunca";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(new Date(value));
}

export default function AdminUsers() {
  const {
    user: currentUser,
    request,
    hasPermission,
  } = useAdminAuth();

  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [modalMode, setModalMode] =
    useState(null);

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [form, setForm] = useState(
    createBlankForm("administrator")
  );

  const canManage = hasPermission(
    "users.manage"
  );

  const loadData = useCallback(async () => {
    if (!canManage) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [
        rolesResponse,
        usersResponse,
      ] = await Promise.all([
        request(
          "/api/v1/admin/identity/roles"
        ),
        request(
          "/api/v1/admin/identity/users"
        ),
      ]);

      setRoles(rolesResponse);
      setUsers(usersResponse);
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível carregar os usuários."
      );
    } finally {
      setLoading(false);
    }
  }, [
    canManage,
    request,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase();

    if (!term) {
      return users;
    }

    return users.filter((item) => {
      const roleText = (
        item.roles || []
      ).join(" ");

      return [
        item.name,
        item.email,
        roleText,
      ].some((value) => (
        value
          ?.toLowerCase()
          .includes(term)
      ));
    });
  }, [
    search,
    users,
  ]);

  function closeModal() {
    if (saving) {
      return;
    }

    setModalMode(null);
    setSelectedUser(null);
    setError("");
  }

  function openCreate() {
    const administratorExists =
      roles.some(
        (role) => (
          role.slug === "administrator"
        )
      );

    const defaultRole = administratorExists
      ? "administrator"
      : roles[0]?.slug;

    setForm(
      createBlankForm(defaultRole)
    );

    setSelectedUser(null);
    setModalMode("create");
    setError("");
    setSuccess("");
  }

  function openEdit(item) {
    setSelectedUser(item);

    setForm({
      name: item.name,
      email: item.email,
      password: "",
      role_slugs: [
        ...(item.roles || []),
      ],
      active: item.active,
    });

    setModalMode("edit");
    setError("");
    setSuccess("");
  }

  function toggleRole(roleSlug) {
    setForm((current) => {
      const selected =
        current.role_slugs.includes(
          roleSlug
        );

      return {
        ...current,
        role_slugs: selected
          ? current.role_slugs.filter(
              (item) => item !== roleSlug
            )
          : [
              ...current.role_slugs,
              roleSlug,
            ],
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (form.role_slugs.length === 0) {
      setError(
        "Selecione ao menos um papel."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role_slugs: form.role_slugs,
      };

      if (modalMode === "create") {
        payload.password = form.password;

        await request(
          "/api/v1/admin/identity/users",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

        setSuccess(
          "Usuário criado com sucesso."
        );
      } else {
        payload.active = form.active;

        if (form.password.trim()) {
          payload.password = form.password;
        }

        await request(
          (
            "/api/v1/admin/identity/users/" +
            selectedUser.id
          ),
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        );

        setSuccess(
          "Usuário atualizado com sucesso."
        );
      }

      setModalMode(null);
      setSelectedUser(null);

      await loadData();
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível salvar o usuário."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!canManage) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-red-400/20 bg-red-950/20 p-8 text-center">
        <ShieldAlert
          size={44}
          className="mx-auto text-red-300"
        />

        <h1 className="mt-5 text-2xl font-bold">
          Gestão de usuários indisponível
        </h1>

        <p className="mt-3 text-neutral-300">
          Sua conta não possui a permissão
          <span className="mx-1 font-mono text-red-200">
            users.manage
          </span>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Identidade
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Usuários e acessos
          </h1>

          <p className="mt-2 max-w-2xl text-neutral-400">
            Crie contas, atribua papéis,
            redefina senhas e controle quais
            usuários podem acessar a plataforma.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-black transition hover:opacity-90"
        >
          <Plus size={19} />
          Novo usuário
        </button>
      </div>

      {success && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm text-green-200">
          <CheckCircle2 size={19} />
          {success}
        </div>
      )}

      {error && !modalMode && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          <XCircle size={19} />
          {error}
        </div>
      )}

      <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-white/10 bg-neutral-900 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => (
              setSearch(event.target.value)
            )}
            placeholder="Buscar por nome, e-mail ou papel"
            className={`${inputClass} pl-11`}
          />
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 font-semibold text-neutral-200 transition hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw
            size={18}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-72 items-center justify-center">
          <div className="flex items-center gap-3 text-neutral-400">
            <LoaderCircle
              size={24}
              className="animate-spin text-accent"
            />
            Carregando usuários...
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="mt-7 rounded-3xl border border-dashed border-white/15 bg-neutral-900/60 p-10 text-center">
          <UserRound
            size={42}
            className="mx-auto text-neutral-600"
          />

          <h2 className="mt-4 text-xl font-bold">
            Nenhum usuário encontrado
          </h2>

          <p className="mt-2 text-neutral-500">
            Ajuste a pesquisa ou cadastre
            uma nova conta administrativa.
          </p>
        </div>
      ) : (
        <div className="mt-7 grid gap-4 xl:grid-cols-2">
          {filteredUsers.map((item) => {
            const isCurrentUser =
              item.id === currentUser?.id;

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-white/10 bg-neutral-900 p-5"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-bold">
                        {item.name}
                      </h2>

                      {isCurrentUser && (
                        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                          Sua conta
                        </span>
                      )}

                      <span
                        className={
                          item.active
                            ? "rounded-full bg-green-400/10 px-2.5 py-1 text-xs font-semibold text-green-300"
                            : "rounded-full bg-red-400/10 px-2.5 py-1 text-xs font-semibold text-red-300"
                        }
                      >
                        {item.active
                          ? "Ativo"
                          : "Inativo"}
                      </span>
                    </div>

                    <p className="mt-2 flex items-center gap-2 truncate text-sm text-neutral-400">
                      <Mail size={15} />
                      {item.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-accent hover:text-accent"
                  >
                    <Pencil size={16} />
                    Editar
                  </button>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Papéis
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.roles?.map((role) => (
                      <span
                        key={role}
                        className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-neutral-300"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-neutral-500">
                      Último acesso
                    </p>

                    <p className="mt-1 text-neutral-300">
                      {formatDate(
                        item.last_login_at
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-neutral-500">
                      Funcionário vinculado
                    </p>

                    <p className="mt-1 text-neutral-300">
                      {item.employee_id
                        ? "Sim"
                        : "Não"}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <AdminModal
        open={Boolean(modalMode)}
        title={
          modalMode === "create"
            ? "Novo usuário"
            : "Editar usuário"
        }
        description={
          modalMode === "create"
            ? "Crie uma conta e atribua seus papéis."
            : "Atualize os dados e permissões da conta."
        }
        onClose={closeModal}
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-neutral-200 transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              form="admin-user-form"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {saving && (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              )}

              {modalMode === "create"
                ? "Criar usuário"
                : "Salvar alterações"}
            </button>
          </div>
        }
      >
        {error && modalMode && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            <XCircle size={19} />
            {error}
          </div>
        )}

        <form
          id="admin-user-form"
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Nome
              </span>

              <input
                type="text"
                value={form.name}
                onChange={(event) => (
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                )}
                className={inputClass}
                minLength={2}
                maxLength={120}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                E-mail
              </span>

              <input
                type="email"
                value={form.email}
                onChange={(event) => (
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                )}
                className={inputClass}
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-200">
              <KeyRound size={16} />

              {modalMode === "create"
                ? "Senha inicial"
                : "Nova senha"}
            </span>

            <input
              type="password"
              value={form.password}
              onChange={(event) => (
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              )}
              className={inputClass}
              minLength={10}
              required={
                modalMode === "create"
              }
              placeholder={
                modalMode === "edit"
                  ? "Deixe vazio para manter a senha"
                  : "Mínimo de 10 caracteres"
              }
              autoComplete="new-password"
            />
          </label>

          <fieldset>
            <legend className="text-sm font-semibold text-neutral-200">
              Papéis da conta
            </legend>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {roles.map((role) => {
                const checked =
                  form.role_slugs.includes(
                    role.slug
                  );

                return (
                  <label
                    key={role.id}
                    className={[
                      "cursor-pointer rounded-2xl",
                      "border p-4 transition",
                      checked
                        ? (
                          "border-accent/50 " +
                          "bg-accent/10"
                        )
                        : (
                          "border-white/10 " +
                          "bg-black/20"
                        ),
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => (
                          toggleRole(role.slug)
                        )}
                        className="mt-1 h-4 w-4 accent-yellow-400"
                      />

                      <div>
                        <p className="font-semibold text-white">
                          {role.name}
                        </p>

                        <p className="mt-1 text-xs text-neutral-500">
                          {role.slug}
                        </p>

                        {role.description && (
                          <p className="mt-2 text-sm text-neutral-400">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {modalMode === "edit" && (
            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <input
                type="checkbox"
                checked={form.active}
                disabled={
                  selectedUser?.id ===
                  currentUser?.id
                }
                onChange={(event) => (
                  setForm((current) => ({
                    ...current,
                    active: event.target.checked,
                  }))
                )}
                className="mt-1 h-4 w-4 accent-yellow-400"
              />

              <div>
                <p className="font-semibold text-white">
                  Conta ativa
                </p>

                <p className="mt-1 text-sm text-neutral-400">
                  Usuários inativos não conseguem
                  autenticar na plataforma.
                </p>

                {selectedUser?.id ===
                  currentUser?.id && (
                  <p className="mt-2 text-xs text-accent">
                    Sua própria conta não pode ser
                    desativada nesta tela.
                  </p>
                )}
              </div>
            </label>
          )}
        </form>
      </AdminModal>
    </div>
  );
}
