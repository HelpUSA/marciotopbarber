import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BriefcaseBusiness,
  CheckCircle2,
  LoaderCircle,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Scissors,
  Search,
  ShieldAlert,
  UserRound,
  UsersRound,
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

function blankForm() {
  return {
    name: "",
    email: "",
    phone: "",
    job_title: "",
    user_id: "",
    barber_id: "",
    active: true,
  };
}

export default function AdminEmployees() {
  const {
    request,
    hasPermission,
  } = useAdminAuth();

  const [employees, setEmployees] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [barbers, setBarbers] =
    useState([]);

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

  const [
    selectedEmployee,
    setSelectedEmployee,
  ] = useState(null);

  const [form, setForm] =
    useState(blankForm);

  const canManage = hasPermission(
    "employees.manage"
  );

  const canReadUsers = hasPermission(
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
      const employeeRequest = request(
        "/api/v1/admin/identity/employees"
      );

      const barberRequest = request(
        "/api/v1/barbers"
      );

      const userRequest = canReadUsers
        ? request(
            "/api/v1/admin/identity/users"
          )
        : Promise.resolve([]);

      const [
        employeeResponse,
        barberResponse,
        userResponse,
      ] = await Promise.all([
        employeeRequest,
        barberRequest,
        userRequest,
      ]);

      setEmployees(employeeResponse);
      setBarbers(barberResponse);
      setUsers(userResponse);
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível carregar os funcionários."
      );
    } finally {
      setLoading(false);
    }
  }, [
    canManage,
    canReadUsers,
    request,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const userMap = useMemo(
    () => new Map(
      users.map(
        (item) => [
          item.id,
          item,
        ]
      )
    ),
    [users]
  );

  const barberMap = useMemo(
    () => new Map(
      barbers.map(
        (item) => [
          item.id,
          item,
        ]
      )
    ),
    [barbers]
  );

  const filteredEmployees = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase();

    if (!term) {
      return employees;
    }

    return employees.filter((item) => {
      const userName =
        userMap.get(item.user_id)?.name || "";

      const barberName =
        barberMap.get(item.barber_id)?.name || "";

      return [
        item.name,
        item.email,
        item.phone,
        item.job_title,
        userName,
        barberName,
      ].some((value) => (
        value
          ?.toLowerCase()
          .includes(term)
      ));
    });
  }, [
    employees,
    search,
    userMap,
    barberMap,
  ]);

  function closeModal() {
    if (saving) {
      return;
    }

    setModalMode(null);
    setSelectedEmployee(null);
    setError("");
  }

  function openCreate() {
    setForm(blankForm());
    setSelectedEmployee(null);
    setModalMode("create");
    setError("");
    setSuccess("");
  }

  function openEdit(item) {
    setSelectedEmployee(item);

    setForm({
      name: item.name || "",
      email: item.email || "",
      phone: item.phone || "",
      job_title: item.job_title || "",
      user_id: item.user_id || "",
      barber_id: item.barber_id || "",
      active: item.active,
    });

    setModalMode("edit");
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      job_title:
        form.job_title.trim() || null,
      user_id: form.user_id || null,
      barber_id: form.barber_id || null,
      active: form.active,
    };

    try {
      if (modalMode === "create") {
        await request(
          "/api/v1/admin/identity/employees",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

        setSuccess(
          "Funcionário criado com sucesso."
        );
      } else {
        await request(
          (
            "/api/v1/admin/identity/employees/" +
            selectedEmployee.id
          ),
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        );

        setSuccess(
          "Funcionário atualizado com sucesso."
        );
      }

      setModalMode(null);
      setSelectedEmployee(null);

      await loadData();
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível salvar o funcionário."
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
          Gestão de funcionários indisponível
        </h1>

        <p className="mt-3 text-neutral-300">
          Sua conta não possui a permissão
          <span className="mx-1 font-mono text-red-200">
            employees.manage
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
            Equipe
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Funcionários
          </h1>

          <p className="mt-2 max-w-2xl text-neutral-400">
            Organize a equipe e vincule cada
            funcionário a uma conta de acesso
            e a um barbeiro da agenda.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-black transition hover:opacity-90"
        >
          <Plus size={19} />
          Novo funcionário
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

      {!canReadUsers && (
        <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-100">
          Sua conta pode gerenciar funcionários,
          mas não pode consultar usuários. O vínculo
          com contas de acesso ficará indisponível.
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
            placeholder="Buscar funcionário, cargo ou barbeiro"
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
            Carregando funcionários...
          </div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="mt-7 rounded-3xl border border-dashed border-white/15 bg-neutral-900/60 p-10 text-center">
          <UsersRound
            size={42}
            className="mx-auto text-neutral-600"
          />

          <h2 className="mt-4 text-xl font-bold">
            Nenhum funcionário encontrado
          </h2>

          <p className="mt-2 text-neutral-500">
            Cadastre integrantes da equipe e
            faça seus vínculos operacionais.
          </p>
        </div>
      ) : (
        <div className="mt-7 grid gap-4 xl:grid-cols-2">
          {filteredEmployees.map((item) => {
            const linkedUser =
              userMap.get(item.user_id);

            const linkedBarber =
              barberMap.get(item.barber_id);

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-white/10 bg-neutral-900 p-5"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold">
                        {item.name}
                      </h2>

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

                    <p className="mt-2 flex items-center gap-2 text-sm text-neutral-400">
                      <BriefcaseBusiness size={15} />
                      {item.job_title ||
                        "Cargo não informado"}
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

                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="flex items-center gap-2 text-neutral-500">
                      <Mail size={15} />
                      E-mail
                    </p>

                    <p className="mt-1 break-all text-neutral-300">
                      {item.email ||
                        "Não informado"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="flex items-center gap-2 text-neutral-500">
                      <Phone size={15} />
                      Telefone
                    </p>

                    <p className="mt-1 text-neutral-300">
                      {item.phone ||
                        "Não informado"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="flex items-center gap-2 text-neutral-500">
                      <UserRound size={15} />
                      Conta vinculada
                    </p>

                    <p className="mt-1 text-neutral-300">
                      {linkedUser?.name ||
                        (
                          item.user_id
                            ? "Conta vinculada"
                            : "Nenhuma"
                        )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="flex items-center gap-2 text-neutral-500">
                      <Scissors size={15} />
                      Barbeiro vinculado
                    </p>

                    <p className="mt-1 text-neutral-300">
                      {linkedBarber?.name ||
                        "Nenhum"}
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
            ? "Novo funcionário"
            : "Editar funcionário"
        }
        description={
          "Cadastre os dados e configure os vínculos da equipe."
        }
        onClose={closeModal}
        wide
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
              form="admin-employee-form"
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
                ? "Criar funcionário"
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
          id="admin-employee-form"
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
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
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Telefone
              </span>

              <input
                type="tel"
                value={form.phone}
                onChange={(event) => (
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                )}
                className={inputClass}
                maxLength={32}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Cargo
              </span>

              <input
                type="text"
                value={form.job_title}
                onChange={(event) => (
                  setForm((current) => ({
                    ...current,
                    job_title:
                      event.target.value,
                  }))
                )}
                className={inputClass}
                maxLength={120}
                placeholder="Ex.: Barbeiro, recepcionista"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Conta de usuário
              </span>

              <select
                value={form.user_id}
                disabled={!canReadUsers}
                onChange={(event) => (
                  setForm((current) => ({
                    ...current,
                    user_id:
                      event.target.value,
                  }))
                )}
                className={inputClass}
              >
                <option value="">
                  Nenhuma conta
                </option>

                {users.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name} — {item.email}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Barbeiro da agenda
              </span>

              <select
                value={form.barber_id}
                onChange={(event) => (
                  setForm((current) => ({
                    ...current,
                    barber_id:
                      event.target.value,
                  }))
                )}
                className={inputClass}
              >
                <option value="">
                  Nenhum barbeiro
                </option>

                {barbers.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <input
              type="checkbox"
              checked={form.active}
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
                Funcionário ativo
              </p>

              <p className="mt-1 text-sm text-neutral-400">
                Funcionários inativos permanecem no
                histórico, mas não participam das
                operações atuais.
              </p>
            </div>
          </label>
        </form>
      </AdminModal>
    </div>
  );
}
