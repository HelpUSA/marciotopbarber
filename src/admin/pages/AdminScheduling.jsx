import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
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

const weekdays = [
  {
    value: 0,
    label: "Segunda-feira",
  },
  {
    value: 1,
    label: "Terça-feira",
  },
  {
    value: 2,
    label: "Quarta-feira",
  },
  {
    value: 3,
    label: "Quinta-feira",
  },
  {
    value: 4,
    label: "Sexta-feira",
  },
  {
    value: 5,
    label: "Sábado",
  },
  {
    value: 6,
    label: "Domingo",
  },
];

function pad(value) {
  return String(value).padStart(2, "0");
}

function toLocalDateTimeInput(date) {
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

function blankScheduleForm() {
  return {
    weekday: 0,
    start_time: "09:00",
    end_time: "18:00",
    active: true,
  };
}

function blankBlockForm() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(12, 0, 0, 0);

  const end = new Date(start);
  end.setHours(13, 0, 0, 0);

  return {
    starts_at:
      toLocalDateTimeInput(start),
    ends_at:
      toLocalDateTimeInput(end),
    reason: "",
  };
}

function formatTime(value) {
  if (!value) {
    return "--:--";
  }

  return value.slice(0, 5);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(new Date(value));
}

export default function AdminScheduling() {
  const {
    request,
    hasPermission,
  } = useAdminAuth();

  const [barbers, setBarbers] =
    useState([]);

  const [
    selectedBarberId,
    setSelectedBarberId,
  ] = useState("");

  const [schedules, setSchedules] =
    useState([]);

  const [blocks, setBlocks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [modalMode, setModalMode] =
    useState(null);

  const [
    scheduleForm,
    setScheduleForm,
  ] = useState(blankScheduleForm);

  const [
    blockForm,
    setBlockForm,
  ] = useState(blankBlockForm);

  const canManage = hasPermission(
    "scheduling.manage"
  );

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadBarbers() {
      setLoading(true);
      setError("");

      try {
        const response = await request(
          "/api/v1/barbers"
        );

        if (!active) {
          return;
        }

        setBarbers(response);

        setSelectedBarberId(
          (current) => (
            current ||
            response[0]?.id ||
            ""
          )
        );
      } catch (requestError) {
        if (active) {
          setError(
            requestError.message ||
            "Não foi possível carregar os profissionais."
          );

          setLoading(false);
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

  const loadManagement =
    useCallback(async () => {
      if (
        !canManage ||
        !selectedBarberId
      ) {
        setSchedules([]);
        setBlocks([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [
          schedulesResponse,
          blocksResponse,
        ] = await Promise.all([
          request(
            (
              "/api/v1/admin/barbers/" +
              selectedBarberId +
              "/schedules"
            )
          ),
          request(
            (
              "/api/v1/admin/barbers/" +
              selectedBarberId +
              "/blocks"
            )
          ),
        ]);

        setSchedules(schedulesResponse);
        setBlocks(blocksResponse);
      } catch (requestError) {
        setError(
          requestError.message ||
          "Não foi possível carregar jornadas e bloqueios."
        );
      } finally {
        setLoading(false);
      }
    }, [
      canManage,
      request,
      selectedBarberId,
    ]);

  useEffect(() => {
    loadManagement();
  }, [loadManagement]);

  const selectedBarber = useMemo(
    () => (
      barbers.find(
        (barber) => (
          barber.id === selectedBarberId
        )
      ) || null
    ),
    [
      barbers,
      selectedBarberId,
    ]
  );

  const schedulesByDay = useMemo(
    () => (
      weekdays.map((weekday) => ({
        ...weekday,
        items: schedules.filter(
          (schedule) => (
            schedule.weekday ===
            weekday.value
          )
        ),
      }))
    ),
    [schedules]
  );

  function openScheduleModal() {
    setScheduleForm(
      blankScheduleForm()
    );

    setModalMode("schedule");
    setError("");
    setSuccess("");
  }

  function openBlockModal() {
    setBlockForm(
      blankBlockForm()
    );

    setModalMode("block");
    setError("");
    setSuccess("");
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalMode(null);
    setError("");
  }

  async function createSchedule(event) {
    event.preventDefault();

    if (!selectedBarberId) {
      setError(
        "Selecione um profissional."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      await request(
        (
          "/api/v1/admin/barbers/" +
          selectedBarberId +
          "/schedules"
        ),
        {
          method: "POST",
          body: JSON.stringify({
            weekday: Number(
              scheduleForm.weekday
            ),
            start_time:
              scheduleForm.start_time,
            end_time:
              scheduleForm.end_time,
            active:
              scheduleForm.active,
          }),
        }
      );

      setModalMode(null);
      setSuccess(
        "Jornada adicionada com sucesso."
      );

      await loadManagement();
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível criar a jornada."
      );
    } finally {
      setSaving(false);
    }
  }

  async function createBlock(event) {
    event.preventDefault();

    if (!selectedBarberId) {
      setError(
        "Selecione um profissional."
      );
      return;
    }

    const startsAt = new Date(
      blockForm.starts_at
    );

    const endsAt = new Date(
      blockForm.ends_at
    );

    if (
      Number.isNaN(startsAt.getTime()) ||
      Number.isNaN(endsAt.getTime())
    ) {
      setError(
        "Informe datas válidas para o bloqueio."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      await request(
        (
          "/api/v1/admin/barbers/" +
          selectedBarberId +
          "/blocks"
        ),
        {
          method: "POST",
          body: JSON.stringify({
            starts_at:
              startsAt.toISOString(),
            ends_at:
              endsAt.toISOString(),
            reason:
              blockForm.reason.trim() ||
              null,
          }),
        }
      );

      setModalMode(null);
      setSuccess(
        "Bloqueio adicionado com sucesso."
      );

      await loadManagement();
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível criar o bloqueio."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteSchedule(schedule) {
    const confirmed = window.confirm(
      (
        "Excluir esta jornada de " +
        formatTime(schedule.start_time) +
        " até " +
        formatTime(schedule.end_time) +
        "?"
      )
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(schedule.id);
    setError("");
    setSuccess("");

    try {
      await request(
        (
          "/api/v1/admin/barbers/" +
          selectedBarberId +
          "/schedules/" +
          schedule.id
        ),
        {
          method: "DELETE",
        }
      );

      setSuccess(
        "Jornada excluída."
      );

      await loadManagement();
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível excluir a jornada."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteBlock(block) {
    const confirmed = window.confirm(
      (
        "Excluir o bloqueio iniciado em " +
        formatDateTime(block.starts_at) +
        "?"
      )
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(block.id);
    setError("");
    setSuccess("");

    try {
      await request(
        (
          "/api/v1/admin/barbers/" +
          selectedBarberId +
          "/blocks/" +
          block.id
        ),
        {
          method: "DELETE",
        }
      );

      setSuccess(
        "Bloqueio excluído."
      );

      await loadManagement();
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível excluir o bloqueio."
      );
    } finally {
      setDeletingId(null);
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
          Jornadas indisponíveis
        </h1>

        <p className="mt-3 text-neutral-300">
          Sua conta não possui a permissão
          <span className="mx-1 font-mono text-red-200">
            scheduling.manage
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
            Disponibilidade
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Jornadas e bloqueios
          </h1>

          <p className="mt-2 max-w-2xl text-neutral-400">
            Defina os horários semanais de cada
            profissional e registre folgas,
            intervalos ou indisponibilidades.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={openScheduleModal}
            disabled={!selectedBarberId}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-black transition hover:opacity-90 disabled:opacity-40"
          >
            <Plus size={18} />
            Nova jornada
          </button>

          <button
            type="button"
            onClick={openBlockModal}
            disabled={!selectedBarberId}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 font-semibold text-neutral-200 transition hover:border-accent hover:text-accent disabled:opacity-40"
          >
            <Ban size={18} />
            Novo bloqueio
          </button>
        </div>
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

      <section className="mt-7 flex flex-col gap-4 rounded-3xl border border-white/10 bg-neutral-900 p-5 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Profissional
          </span>

          <select
            value={selectedBarberId}
            onChange={(event) => (
              setSelectedBarberId(
                event.target.value
              )
            )}
            className={inputClass}
          >
            {barbers.length === 0 && (
              <option value="">
                Nenhum profissional disponível
              </option>
            )}

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

        <button
          type="button"
          onClick={loadManagement}
          disabled={
            loading ||
            !selectedBarberId
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 font-semibold text-neutral-200 transition hover:border-accent hover:text-accent disabled:opacity-40"
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
      </section>

      {selectedBarber && (
        <div className="mt-5 rounded-2xl border border-accent/20 bg-accent/10 px-5 py-4">
          <p className="text-sm text-yellow-100">
            Configurando disponibilidade de
            <strong className="ml-1">
              {selectedBarber.name}
            </strong>
            .
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-80 items-center justify-center">
          <div className="flex items-center gap-3 text-neutral-400">
            <LoaderCircle
              size={24}
              className="animate-spin text-accent"
            />
            Carregando disponibilidade...
          </div>
        </div>
      ) : (
        <div className="mt-7 grid gap-7 xl:grid-cols-[1.2fr_0.8fr]">
          <section>
            <div className="flex items-center gap-3">
              <CalendarClock
                size={24}
                className="text-accent"
              />

              <div>
                <h2 className="text-xl font-bold">
                  Jornada semanal
                </h2>

                <p className="text-sm text-neutral-500">
                  Horários recorrentes de atendimento.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {schedulesByDay.map((day) => (
                <article
                  key={day.value}
                  className="rounded-2xl border border-white/10 bg-neutral-900 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-bold">
                      {day.label}
                    </h3>

                    <span className="text-xs text-neutral-500">
                      {day.items.length}
                      {" "}
                      {day.items.length === 1
                        ? "jornada"
                        : "jornadas"}
                    </span>
                  </div>

                  {day.items.length === 0 ? (
                    <p className="mt-3 text-sm text-neutral-600">
                      Sem horário cadastrado.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {day.items.map(
                        (schedule) => (
                          <div
                            key={schedule.id}
                            className="flex flex-col justify-between gap-3 rounded-xl bg-black/20 p-3 sm:flex-row sm:items-center"
                          >
                            <div className="flex items-center gap-3">
                              <Clock3
                                size={18}
                                className="text-accent"
                              />

                              <div>
                                <p className="font-semibold text-neutral-200">
                                  {formatTime(
                                    schedule
                                      .start_time
                                  )}
                                  {" — "}
                                  {formatTime(
                                    schedule
                                      .end_time
                                  )}
                                </p>

                                <p className="text-xs text-neutral-500">
                                  {schedule.active
                                    ? "Jornada ativa"
                                    : "Jornada inativa"}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => (
                                deleteSchedule(
                                  schedule
                                )
                              )}
                              disabled={
                                deletingId ===
                                schedule.id
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-40"
                            >
                              {deletingId ===
                              schedule.id ? (
                                <LoaderCircle
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={16}
                                />
                              )}
                              Excluir
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3">
              <Ban
                size={24}
                className="text-accent"
              />

              <div>
                <h2 className="text-xl font-bold">
                  Bloqueios e folgas
                </h2>

                <p className="text-sm text-neutral-500">
                  Períodos indisponíveis específicos.
                </p>
              </div>
            </div>

            {blocks.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-neutral-900/60 p-8 text-center">
                <Ban
                  size={38}
                  className="mx-auto text-neutral-600"
                />

                <p className="mt-3 font-semibold">
                  Nenhum bloqueio cadastrado
                </p>

                <p className="mt-1 text-sm text-neutral-500">
                  O profissional não possui
                  indisponibilidades registradas.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {blocks.map((block) => (
                  <article
                    key={block.id}
                    className="rounded-2xl border border-white/10 bg-neutral-900 p-4"
                  >
                    <p className="font-semibold text-neutral-200">
                      {formatDateTime(
                        block.starts_at
                      )}
                    </p>

                    <p className="mt-1 text-sm text-neutral-500">
                      até
                      {" "}
                      {formatDateTime(
                        block.ends_at
                      )}
                    </p>

                    <p className="mt-3 text-sm text-neutral-300">
                      {block.reason ||
                        "Motivo não informado"}
                    </p>

                    <button
                      type="button"
                      onClick={() => (
                        deleteBlock(block)
                      )}
                      disabled={
                        deletingId === block.id
                      }
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-300 transition hover:text-red-200 disabled:opacity-40"
                    >
                      {deletingId ===
                      block.id ? (
                        <LoaderCircle
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Excluir bloqueio
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <AdminModal
        open={modalMode === "schedule"}
        title="Nova jornada"
        description={
          selectedBarber
            ? (
              "Defina um horário recorrente para " +
              selectedBarber.name +
              "."
            )
            : "Defina um horário recorrente."
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
              form="schedule-form"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {saving && (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              )}
              Criar jornada
            </button>
          </div>
        }
      >
        {error && modalMode === "schedule" && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            <XCircle size={19} />
            {error}
          </div>
        )}

        <form
          id="schedule-form"
          onSubmit={createSchedule}
          className="space-y-5"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-neutral-200">
              Dia da semana
            </span>

            <select
              value={scheduleForm.weekday}
              onChange={(event) => (
                setScheduleForm(
                  (current) => ({
                    ...current,
                    weekday:
                      Number(
                        event.target.value
                      ),
                  })
                )
              )}
              className={inputClass}
            >
              {weekdays.map((weekday) => (
                <option
                  key={weekday.value}
                  value={weekday.value}
                >
                  {weekday.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Início
              </span>

              <input
                type="time"
                value={scheduleForm.start_time}
                onChange={(event) => (
                  setScheduleForm(
                    (current) => ({
                      ...current,
                      start_time:
                        event.target.value,
                    })
                  )
                )}
                className={inputClass}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Término
              </span>

              <input
                type="time"
                value={scheduleForm.end_time}
                onChange={(event) => (
                  setScheduleForm(
                    (current) => ({
                      ...current,
                      end_time:
                        event.target.value,
                    })
                  )
                )}
                className={inputClass}
                required
              />
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <input
              type="checkbox"
              checked={scheduleForm.active}
              onChange={(event) => (
                setScheduleForm(
                  (current) => ({
                    ...current,
                    active:
                      event.target.checked,
                  })
                )
              )}
              className="mt-1 h-4 w-4 accent-yellow-400"
            />

            <div>
              <p className="font-semibold">
                Jornada ativa
              </p>

              <p className="mt-1 text-sm text-neutral-400">
                Jornadas ativas participam do
                cálculo de disponibilidade pública.
              </p>
            </div>
          </label>
        </form>
      </AdminModal>

      <AdminModal
        open={modalMode === "block"}
        title="Novo bloqueio"
        description={
          selectedBarber
            ? (
              "Registre uma indisponibilidade para " +
              selectedBarber.name +
              "."
            )
            : "Registre uma indisponibilidade."
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
              form="block-form"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {saving && (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              )}
              Criar bloqueio
            </button>
          </div>
        }
      >
        {error && modalMode === "block" && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            <XCircle size={19} />
            {error}
          </div>
        )}

        <form
          id="block-form"
          onSubmit={createBlock}
          className="space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Início
              </span>

              <input
                type="datetime-local"
                value={blockForm.starts_at}
                onChange={(event) => (
                  setBlockForm(
                    (current) => ({
                      ...current,
                      starts_at:
                        event.target.value,
                    })
                  )
                )}
                className={inputClass}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Término
              </span>

              <input
                type="datetime-local"
                value={blockForm.ends_at}
                onChange={(event) => (
                  setBlockForm(
                    (current) => ({
                      ...current,
                      ends_at:
                        event.target.value,
                    })
                  )
                )}
                className={inputClass}
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-neutral-200">
              Motivo
            </span>

            <textarea
              value={blockForm.reason}
              onChange={(event) => (
                setBlockForm(
                  (current) => ({
                    ...current,
                    reason:
                      event.target.value,
                  })
                )
              )}
              className={`${inputClass} min-h-28 resize-y`}
              maxLength={255}
              placeholder="Ex.: almoço, compromisso, folga..."
            />
          </label>
        </form>
      </AdminModal>
    </div>
  );
}
