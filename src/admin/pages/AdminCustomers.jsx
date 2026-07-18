import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Cake,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Star,
  UserCheck,
  UserRound,
  UserX,
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

function blankCustomerForm() {
  return {
    name: "",
    email: "",
    phone: "",
    birth_date: "",
    active: true,
    notes: "",
    loyalty_points: "0",
    last_service_at: "",
    return_due_at: "",
  };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateTimeInput(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
}

function toIsoOrNull(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function formatDate(value) {
  if (!value) {
    return "Não informada";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "medium",
    }
  ).format(new Date(`${value}T12:00:00`));
}

function formatDateTime(value) {
  if (!value) {
    return "Não registrado";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(new Date(value));
}

function formatPhone(value) {
  if (!value) {
    return "Não informado";
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length === 11) {
    return (
      `(${digits.slice(0, 2)}) ` +
      `${digits.slice(2, 7)}-` +
      digits.slice(7)
    );
  }

  if (digits.length === 10) {
    return (
      `(${digits.slice(0, 2)}) ` +
      `${digits.slice(2, 6)}-` +
      digits.slice(6)
    );
  }

  return value;
}

export default function AdminCustomers() {
  const {
    request,
    hasPermission,
  } = useAdminAuth();

  const [customers, setCustomers] =
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

  const [activeFilter, setActiveFilter] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingCustomer, setEditingCustomer] =
    useState(null);

  const [form, setForm] =
    useState(blankCustomerForm);

  const canManage = hasPermission(
    "customers.manage"
  );

  const loadCustomers =
    useCallback(async () => {
      if (!canManage) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (activeFilter !== "") {
          params.set(
            "active",
            activeFilter
          );
        }

        const query = params.toString();

        const response = await request(
          (
            "/api/v1/admin/customers" +
            (query ? `?${query}` : "")
          )
        );

        setCustomers(response);
      } catch (requestError) {
        setError(
          requestError.message ||
          "Não foi possível carregar os clientes."
        );
      } finally {
        setLoading(false);
      }
    }, [
      activeFilter,
      canManage,
      request,
    ]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(
    () => {
      const term = search
        .trim()
        .toLowerCase();

      if (!term) {
        return customers;
      }

      return customers.filter(
        (customer) => (
          [
            customer.name,
            customer.email,
            customer.phone,
            customer.notes,
          ].some((value) => (
            value
              ?.toLowerCase()
              .includes(term)
          ))
        )
      );
    },
    [
      customers,
      search,
    ]
  );

  function openCreateModal() {
    setEditingCustomer(null);
    setForm(blankCustomerForm());
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(customer) {
    setEditingCustomer(customer);

    setForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      birth_date:
        customer.birth_date || "",
      active: Boolean(customer.active),
      notes: customer.notes || "",
      loyalty_points: String(
        customer.loyalty_points || 0
      ),
      last_service_at:
        toDateTimeInput(
          customer.last_service_at
        ),
      return_due_at:
        toDateTimeInput(
          customer.return_due_at
        ),
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingCustomer(null);
    setForm(blankCustomerForm());
    setError("");
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submitCustomer(event) {
    event.preventDefault();

    const loyaltyPoints = Number(
      form.loyalty_points
    );

    if (
      !Number.isInteger(loyaltyPoints) ||
      loyaltyPoints < 0
    ) {
      setError(
        "Os pontos de fidelidade devem ser um número inteiro positivo."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      name: form.name.trim(),
      email:
        form.email.trim() || null,
      phone: form.phone.trim(),
      birth_date:
        form.birth_date || null,
      active: form.active,
      notes:
        form.notes.trim() || null,
      loyalty_points: loyaltyPoints,
      last_service_at:
        toIsoOrNull(
          form.last_service_at
        ),
      return_due_at:
        toIsoOrNull(
          form.return_due_at
        ),
    };

    try {
      const endpoint = editingCustomer
        ? (
          "/api/v1/admin/customers/" +
          editingCustomer.id
        )
        : "/api/v1/admin/customers";

      const saved = await request(
        endpoint,
        {
          method: editingCustomer
            ? "PATCH"
            : "POST",
          body: JSON.stringify(payload),
        }
      );

      setCustomers((current) => {
        if (!editingCustomer) {
          return [
            saved,
            ...current,
          ];
        }

        return current.map((item) => (
          item.id === saved.id
            ? saved
            : item
        ));
      });

      setModalOpen(false);
      setEditingCustomer(null);
      setForm(blankCustomerForm());

      setSuccess(
        editingCustomer
          ? "Cliente atualizado com sucesso."
          : "Cliente criado com sucesso."
      );

      await loadCustomers();
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível salvar o cliente."
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
          Clientes indisponíveis
        </h1>

        <p className="mt-3 text-neutral-300">
          Sua conta não possui a permissão
          <span className="mx-1 font-mono text-red-200">
            customers.manage
          </span>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Relacionamento
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Clientes
          </h1>

          <p className="mt-2 max-w-2xl text-neutral-400">
            Gerencie os dados cadastrais,
            histórico resumido, fidelidade e
            previsão de retorno dos clientes.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={loadCustomers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 font-semibold text-neutral-200 transition hover:border-accent hover:text-accent disabled:opacity-50"
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

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-black transition hover:opacity-90"
          >
            <Plus size={18} />
            Novo cliente
          </button>
        </div>
      </div>

      {success && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm text-green-200">
          <CheckCircle2 size={19} />
          {success}
        </div>
      )}

      {error && !modalOpen && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          <XCircle size={19} />
          {error}
        </div>
      )}

      <section className="mt-7 grid gap-4 rounded-3xl border border-white/10 bg-neutral-900 p-5 md:grid-cols-[1fr_220px]">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Pesquisa
          </span>

          <div className="relative">
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
              placeholder="Nome, telefone, e-mail ou observação..."
              className={`${inputClass} pl-11`}
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Situação
          </span>

          <select
            value={activeFilter}
            onChange={(event) => (
              setActiveFilter(
                event.target.value
              )
            )}
            className={inputClass}
          >
            <option value="">
              Todos
            </option>

            <option value="true">
              Ativos
            </option>

            <option value="false">
              Inativos
            </option>
          </select>
        </label>
      </section>

      {loading ? (
        <div className="flex min-h-80 items-center justify-center">
          <div className="flex items-center gap-3 text-neutral-400">
            <LoaderCircle
              size={24}
              className="animate-spin text-accent"
            />
            Carregando clientes...
          </div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="mt-7 rounded-3xl border border-dashed border-white/15 bg-neutral-900/60 p-10 text-center">
          <UsersRound
            size={44}
            className="mx-auto text-neutral-600"
          />

          <h2 className="mt-4 text-xl font-bold">
            Nenhum cliente encontrado
          </h2>

          <p className="mt-2 text-neutral-500">
            Ajuste os filtros ou cadastre um
            novo cliente.
          </p>
        </div>
      ) : (
        <div className="mt-7 grid gap-5 xl:grid-cols-2">
          {filteredCustomers.map(
            (customer) => (
              <article
                key={customer.id}
                className="rounded-3xl border border-white/10 bg-neutral-900 p-5 sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="truncate text-xl font-bold">
                        {customer.name}
                      </h2>

                      <span
                        className={
                          customer.active
                            ? "inline-flex items-center gap-1.5 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-semibold text-green-200"
                            : "inline-flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-200"
                        }
                      >
                        {customer.active ? (
                          <UserCheck size={14} />
                        ) : (
                          <UserX size={14} />
                        )}

                        {customer.active
                          ? "Ativo"
                          : "Inativo"}
                      </span>
                    </div>

                    <p className="mt-3 flex items-center gap-2 text-sm text-neutral-300">
                      <Phone
                        size={16}
                        className="text-accent"
                      />

                      {formatPhone(
                        customer.phone
                      )}
                    </p>

                    {customer.email && (
                      <p className="mt-2 flex items-center gap-2 text-sm text-neutral-400">
                        <Mail size={16} />
                        {customer.email}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => (
                      openEditModal(customer)
                    )}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-accent hover:text-accent"
                  >
                    <Pencil size={16} />
                    Editar
                  </button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-black/20 p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      <Cake size={15} />
                      Nascimento
                    </p>

                    <p className="mt-2 text-sm text-neutral-300">
                      {formatDate(
                        customer.birth_date
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      <Star size={15} />
                      Fidelidade
                    </p>

                    <p className="mt-2 text-sm text-neutral-300">
                      {customer.loyalty_points}
                      {" "}
                      {customer.loyalty_points === 1
                        ? "ponto"
                        : "pontos"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      <CalendarDays size={15} />
                      Agendamentos
                    </p>

                    <p className="mt-2 text-sm text-neutral-300">
                      {customer.appointment_count}
                      {" "}
                      {customer.appointment_count === 1
                        ? "registro"
                        : "registros"}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      Último:
                      {" "}
                      {formatDateTime(
                        customer.last_appointment_at
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      <UserRound size={15} />
                      Próximo retorno
                    </p>

                    <p className="mt-2 text-sm text-neutral-300">
                      {formatDateTime(
                        customer.return_due_at
                      )}
                    </p>
                  </div>
                </div>

                {customer.notes && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Observações
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
                      {customer.notes}
                    </p>
                  </div>
                )}
              </article>
            )
          )}
        </div>
      )}

      <AdminModal
        open={modalOpen}
        title={
          editingCustomer
            ? "Editar cliente"
            : "Novo cliente"
        }
        description={
          editingCustomer
            ? "Atualize os dados cadastrais e de relacionamento."
            : "Cadastre um novo cliente da barbearia."
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
              form="customer-form"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {saving && (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              )}

              {editingCustomer
                ? "Salvar alterações"
                : "Criar cliente"}
            </button>
          </div>
        }
      >
        {error && modalOpen && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            <XCircle size={19} />
            {error}
          </div>
        )}

        <form
          id="customer-form"
          onSubmit={submitCustomer}
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
                  updateForm(
                    "name",
                    event.target.value
                  )
                )}
                className={inputClass}
                minLength={2}
                maxLength={120}
                required
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
                  updateForm(
                    "phone",
                    event.target.value
                  )
                )}
                className={inputClass}
                minLength={8}
                maxLength={32}
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
                  updateForm(
                    "email",
                    event.target.value
                  )
                )}
                className={inputClass}
                maxLength={255}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Data de nascimento
              </span>

              <input
                type="date"
                value={form.birth_date}
                onChange={(event) => (
                  updateForm(
                    "birth_date",
                    event.target.value
                  )
                )}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Pontos de fidelidade
              </span>

              <input
                type="number"
                value={form.loyalty_points}
                onChange={(event) => (
                  updateForm(
                    "loyalty_points",
                    event.target.value
                  )
                )}
                className={inputClass}
                min="0"
                step="1"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Último serviço
              </span>

              <input
                type="datetime-local"
                value={form.last_service_at}
                onChange={(event) => (
                  updateForm(
                    "last_service_at",
                    event.target.value
                  )
                )}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Previsão de retorno
              </span>

              <input
                type="datetime-local"
                value={form.return_due_at}
                onChange={(event) => (
                  updateForm(
                    "return_due_at",
                    event.target.value
                  )
                )}
                className={inputClass}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-neutral-200">
              Observações
            </span>

            <textarea
              value={form.notes}
              onChange={(event) => (
                updateForm(
                  "notes",
                  event.target.value
                )
              )}
              className={`${inputClass} min-h-28 resize-y`}
              maxLength={2000}
              placeholder="Preferências, observações de atendimento..."
            />
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => (
                updateForm(
                  "active",
                  event.target.checked
                )
              )}
              className="mt-1 h-4 w-4 accent-yellow-400"
            />

            <div>
              <p className="font-semibold">
                Cliente ativo
              </p>

              <p className="mt-1 text-sm text-neutral-400">
                Clientes inativos permanecem no
                histórico, mas podem ser filtrados
                da operação diária.
              </p>
            </div>
          </label>
        </form>
      </AdminModal>
    </div>
  );
}
