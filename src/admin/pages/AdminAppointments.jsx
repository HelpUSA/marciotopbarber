import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Mail,
  Phone,
  RefreshCw,
  Scissors,
  Search,
  ShieldAlert,
  UserRound,
  XCircle,
} from "lucide-react";

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

const statusOptions = [
  {
    value: "",
    label: "Todos os status",
  },
  {
    value: "scheduled",
    label: "Agendado",
  },
  {
    value: "confirmed",
    label: "Confirmado",
  },
  {
    value: "completed",
    label: "Concluído",
  },
  {
    value: "cancelled",
    label: "Cancelado",
  },
  {
    value: "no_show",
    label: "Não compareceu",
  },
];

const statusMeta = {
  scheduled: {
    label: "Agendado",
    className: (
      "border-blue-400/20 bg-blue-400/10 " +
      "text-blue-200"
    ),
  },
  confirmed: {
    label: "Confirmado",
    className: (
      "border-yellow-400/20 bg-yellow-400/10 " +
      "text-yellow-100"
    ),
  },
  completed: {
    label: "Concluído",
    className: (
      "border-green-400/20 bg-green-400/10 " +
      "text-green-200"
    ),
  },
  cancelled: {
    label: "Cancelado",
    className: (
      "border-red-400/20 bg-red-400/10 " +
      "text-red-200"
    ),
  },
  no_show: {
    label: "Não compareceu",
    className: (
      "border-orange-400/20 bg-orange-400/10 " +
      "text-orange-200"
    ),
  },
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateInputValue(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
}

function initialStartDate() {
  return toDateInputValue(new Date());
}

function initialEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return toDateInputValue(date);
}

function formatDateTime(value) {
  if (!value) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "full",
      timeStyle: "short",
    }
  ).format(new Date(value));
}

function formatPrice(priceCents) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(
    (priceCents || 0) / 100
  );
}

export default function AdminAppointments() {
  const {
    request,
    hasPermission,
  } = useAdminAuth();

  const [barbers, setBarbers] =
    useState([]);

  const [appointments, setAppointments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    updatingAppointmentId,
    setUpdatingAppointmentId,
  ] = useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [barberFilter, setBarberFilter] =
    useState("");

  const [startsFrom, setStartsFrom] =
    useState(initialStartDate);

  const [startsTo, setStartsTo] =
    useState(initialEndDate);

  const canManage = hasPermission(
    "appointments.manage"
  );

  const loadAppointments =
    useCallback(async () => {
      if (!canManage) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (statusFilter) {
          params.set(
            "status",
            statusFilter
          );
        }

        if (barberFilter) {
          params.set(
            "barber_id",
            barberFilter
          );
        }

        if (startsFrom) {
          params.set(
            "starts_from",
            new Date(
              `${startsFrom}T00:00:00`
            ).toISOString()
          );
        }

        if (startsTo) {
          params.set(
            "starts_to",
            new Date(
              `${startsTo}T23:59:59`
            ).toISOString()
          );
        }

        const query = params.toString();

        const response = await request(
          (
            "/api/v1/admin/appointments" +
            (query ? `?${query}` : "")
          )
        );

        setAppointments(response);
      } catch (requestError) {
        setError(
          requestError.message ||
          "Não foi possível carregar os agendamentos."
        );
      } finally {
        setLoading(false);
      }
    }, [
      barberFilter,
      canManage,
      request,
      startsFrom,
      startsTo,
      statusFilter,
    ]);

  useEffect(() => {
    if (!canManage) {
      return;
    }

    let active = true;

    async function loadBarbers() {
      try {
        const response = await request(
          "/api/v1/barbers"
        );

        if (active) {
          setBarbers(response);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.message ||
            "Não foi possível carregar os profissionais."
          );
        }
      }
    }

    loadBarbers();

    return () => {
      active = false;
    };
  }, [
    canManage,
    request,
  ]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const filteredAppointments = useMemo(
    () => {
      const term = search
        .trim()
        .toLowerCase();

      if (!term) {
        return appointments;
      }

      return appointments.filter(
        (appointment) => (
          [
            appointment.customer_name,
            appointment.customer_email,
            appointment.customer_phone,
            appointment.barber?.name,
            appointment.service?.name,
            appointment.notes,
          ].some((value) => (
            value
              ?.toLowerCase()
              .includes(term)
          ))
        )
      );
    },
    [
      appointments,
      search,
    ]
  );

  async function updateStatus(
    appointment,
    nextStatus
  ) {
    if (
      !nextStatus ||
      nextStatus === appointment.status
    ) {
      return;
    }

    setUpdatingAppointmentId(
      appointment.id
    );

    setError("");
    setSuccess("");

    try {
      const updated = await request(
        (
          "/api/v1/admin/appointments/" +
          appointment.id +
          "/status"
        ),
        {
          method: "PATCH",
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      setAppointments((current) => (
        current.map((item) => (
          item.id === updated.id
            ? updated
            : item
        ))
      ));

      setSuccess(
        "Status do agendamento atualizado."
      );
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível alterar o status."
      );
    } finally {
      setUpdatingAppointmentId(null);
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
          Agenda indisponível
        </h1>

        <p className="mt-3 text-neutral-300">
          Sua conta não possui a permissão
          <span className="mx-1 font-mono text-red-200">
            appointments.manage
          </span>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Operação
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Agenda administrativa
          </h1>

          <p className="mt-2 max-w-2xl text-neutral-400">
            Consulte os atendimentos, filtre a
            agenda e atualize o andamento de cada
            agendamento.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAppointments}
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
          Atualizar agenda
        </button>
      </div>

      {success && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm text-green-200">
          <CheckCircle2 size={19} />
          {success}
        </div>
      )}

      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          <XCircle size={19} />
          {error}
        </div>
      )}

      <section className="mt-7 rounded-3xl border border-white/10 bg-neutral-900 p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="block xl:col-span-2">
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
                placeholder="Cliente, telefone, serviço..."
                className={`${inputClass} pl-11`}
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Status
            </span>

            <select
              value={statusFilter}
              onChange={(event) => (
                setStatusFilter(
                  event.target.value
                )
              )}
              className={inputClass}
            >
              {statusOptions.map((option) => (
                <option
                  key={
                    option.value || "all"
                  }
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Profissional
            </span>

            <select
              value={barberFilter}
              onChange={(event) => (
                setBarberFilter(
                  event.target.value
                )
              )}
              className={inputClass}
            >
              <option value="">
                Todos
              </option>

              {barbers.map((barber) => (
                <option
                  key={barber.id}
                  value={barber.id}
                >
                  {barber.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3 xl:col-span-1">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                De
              </span>

              <input
                type="date"
                value={startsFrom}
                onChange={(event) => (
                  setStartsFrom(
                    event.target.value
                  )
                )}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Até
              </span>

              <input
                type="date"
                value={startsTo}
                onChange={(event) => (
                  setStartsTo(
                    event.target.value
                  )
                )}
                className={inputClass}
              />
            </label>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-80 items-center justify-center">
          <div className="flex items-center gap-3 text-neutral-400">
            <LoaderCircle
              size={24}
              className="animate-spin text-accent"
            />
            Carregando agenda...
          </div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="mt-7 rounded-3xl border border-dashed border-white/15 bg-neutral-900/60 p-10 text-center">
          <CalendarDays
            size={44}
            className="mx-auto text-neutral-600"
          />

          <h2 className="mt-4 text-xl font-bold">
            Nenhum agendamento encontrado
          </h2>

          <p className="mt-2 text-neutral-500">
            Ajuste os filtros ou selecione outro
            período da agenda.
          </p>
        </div>
      ) : (
        <div className="mt-7 space-y-4">
          {filteredAppointments.map(
            (appointment) => {
              const meta =
                statusMeta[
                  appointment.status
                ] || {
                  label:
                    appointment.status,
                  className: (
                    "border-white/10 " +
                    "bg-white/5 " +
                    "text-neutral-300"
                  ),
                };

              const updating =
                updatingAppointmentId ===
                appointment.id;

              return (
                <article
                  key={appointment.id}
                  className="rounded-3xl border border-white/10 bg-neutral-900 p-5 sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-bold">
                          {
                            appointment
                              .customer_name
                          }
                        </h2>

                        <span
                          className={[
                            "rounded-full border",
                            "px-3 py-1",
                            "text-xs font-semibold",
                            meta.className,
                          ].join(" ")}
                        >
                          {meta.label}
                        </span>
                      </div>

                      <p className="mt-3 flex items-center gap-2 text-sm text-neutral-300">
                        <CalendarDays
                          size={17}
                          className="text-accent"
                        />

                        {formatDateTime(
                          appointment.starts_at
                        )}
                      </p>
                    </div>

                    <label className="w-full lg:w-56">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Alterar status
                      </span>

                      <div className="relative">
                        <select
                          value={
                            appointment.status
                          }
                          disabled={updating}
                          onChange={(event) => (
                            updateStatus(
                              appointment,
                              event.target.value
                            )
                          )}
                          className={inputClass}
                        >
                          {statusOptions
                            .filter(
                              (option) => (
                                option.value
                              )
                            )
                            .map((option) => (
                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {option.label}
                              </option>
                            ))}
                        </select>

                        {updating && (
                          <LoaderCircle
                            size={18}
                            className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 animate-spin text-accent"
                          />
                        )}
                      </div>
                    </label>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-black/20 p-4">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        <UserRound size={15} />
                        Cliente
                      </p>

                      <p className="mt-2 text-sm text-neutral-300">
                        {
                          appointment
                            .customer_name
                        }
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/20 p-4">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        <Phone size={15} />
                        Telefone
                      </p>

                      <p className="mt-2 text-sm text-neutral-300">
                        {
                          appointment
                            .customer_phone
                        }
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/20 p-4">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        <Scissors size={15} />
                        Serviço
                      </p>

                      <p className="mt-2 text-sm text-neutral-300">
                        {
                          appointment
                            .service?.name
                        }
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        {formatPrice(
                          appointment
                            .service
                            ?.price_cents
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/20 p-4">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        <Clock3 size={15} />
                        Profissional
                      </p>

                      <p className="mt-2 text-sm text-neutral-300">
                        {
                          appointment
                            .barber?.name
                        }
                      </p>
                    </div>
                  </div>

                  {appointment.customer_email && (
                    <p className="mt-4 flex items-center gap-2 text-sm text-neutral-400">
                      <Mail size={16} />
                      {
                        appointment
                          .customer_email
                      }
                    </p>
                  )}

                  {appointment.notes && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Observações
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
                        {appointment.notes}
                      </p>
                    </div>
                  )}
                </article>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
