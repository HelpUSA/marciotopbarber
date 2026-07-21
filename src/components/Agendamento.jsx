import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Scissors,
  UserRound,
} from "lucide-react";

import {
  apiRequest,
  expectArrayResponse,
} from "../services/api";

const initialCustomer = {
  name: "",
  email: "",
  phone: "",
  notes: "",
};

function dateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMoney(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function formatTime(value, timezone = "America/Fortaleza") {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(new Date(value));
}

function formatAppointmentDate(
  value,
  timezone = "America/Fortaleza"
) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value));
}

const fieldClass =
  "w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 " +
  "text-white outline-none transition placeholder:text-neutral-500 " +
  "focus:border-accent focus:ring-2 focus:ring-accent/20 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export default function Agendamento() {
  const minimumDate = useMemo(
    () => dateInputValue(new Date()),
    []
  );

  const initialDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return dateInputValue(date);
  }, []);

  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);

  const [selectedBarberId, setSelectedBarberId] =
    useState("");

  const [selectedServiceId, setSelectedServiceId] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState(initialDate);

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] =
    useState(null);

  const [customer, setCustomer] =
    useState(initialCustomer);

  const [catalogLoading, setCatalogLoading] =
    useState(true);

  const [availabilityLoading, setAvailabilityLoading] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [confirmation, setConfirmation] =
    useState(null);

  const [
    availabilityVersion,
    setAvailabilityVersion,
  ] = useState(0);

  const selectedBarber = (
    Array.isArray(barbers) ? barbers : []
  ).find(
    (item) => item.id === selectedBarberId
  );

  const selectedService = (
    Array.isArray(services) ? services : []
  ).find(
    (item) => item.id === selectedServiceId
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadCatalog() {
      setCatalogLoading(true);
      setError("");

      try {
        const [barberData, serviceData] =
          await Promise.all([
            apiRequest("/api/v1/barbers", {
              signal: controller.signal,
            }),
            apiRequest("/api/v1/services", {
              signal: controller.signal,
            }),
          ]);

        const barberList = expectArrayResponse(
          barberData,
          "profissionais"
        );

        const serviceList = expectArrayResponse(
          serviceData,
          "serviços"
        );

        setBarbers(barberList);
        setServices(serviceList);

        setSelectedBarberId((current) => (
          current || barberList[0]?.id || ""
        ));

        setSelectedServiceId((current) => (
          current || serviceList[0]?.id || ""
        ));
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(
            "Não foi possível carregar os profissionais " +
            "e serviços disponíveis."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setCatalogLoading(false);
        }
      }
    }

    loadCatalog();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (
      !selectedBarberId ||
      !selectedServiceId ||
      !selectedDate
    ) {
      setSlots([]);
      setSelectedSlot(null);
      return undefined;
    }

    const controller = new AbortController();

    async function loadAvailability() {
      setAvailabilityLoading(true);
      setError("");
      setSelectedSlot(null);

      const params = new URLSearchParams({
        barber_id: selectedBarberId,
        service_id: selectedServiceId,
        date: selectedDate,
      });

      try {
        const data = await apiRequest(
          `/api/v1/availability?${params.toString()}`,
          {
            signal: controller.signal,
          }
        );

        setSlots(
          expectArrayResponse(
            data?.slots ?? data,
            "horários disponíveis"
          )
        );
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setSlots([]);
          setError(
            requestError.message ||
            "Não foi possível consultar os horários."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setAvailabilityLoading(false);
        }
      }
    }

    loadAvailability();

    return () => controller.abort();
  }, [
    selectedBarberId,
    selectedServiceId,
    selectedDate,
    availabilityVersion,
  ]);

  function handleCustomerChange(event) {
    const { name, value } = event.target;

    setCustomer((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedSlot) {
      setError("Selecione um horário disponível.");
      return;
    }

    setSubmitting(true);
    setError("");
    setConfirmation(null);

    try {
      const created = await apiRequest(
        "/api/v1/appointments",
        {
          method: "POST",
          body: JSON.stringify({
            customer_name: customer.name,
            customer_email: customer.email || null,
            customer_phone: customer.phone,
            barber_id: selectedBarberId,
            service_id: selectedServiceId,
            starts_at: selectedSlot.starts_at,
            notes: customer.notes || null,
          }),
        }
      );

      setConfirmation(created);
      setCustomer(initialCustomer);
      setSelectedSlot(null);

      setAvailabilityVersion(
        (current) => current + 1
      );
    } catch (requestError) {
      if (requestError.status === 409) {
        setError(
          "Esse horário acabou de ficar indisponível. " +
          "A lista foi atualizada."
        );

        setAvailabilityVersion(
          (current) => current + 1
        );
      } else {
        setError(
          requestError.message ||
          "Não foi possível concluir o agendamento."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const catalogUnavailable =
    !catalogLoading &&
    (barbers.length === 0 || services.length === 0);

  const canSubmit =
    Boolean(selectedSlot) &&
    customer.name.trim().length >= 2 &&
    customer.phone.trim().length >= 8 &&
    !submitting;

  return (
    <section
      id="agendamento"
      className="scroll-mt-24 bg-neutral-950 px-4 py-20 text-white"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
            <CalendarDays size={17} />
            Agendamento online
          </span>

          <h2 className="mt-5 text-3xl font-bold md:text-4xl">
            Escolha seu horário
          </h2>

          <p className="mt-3 text-neutral-300">
            Selecione o profissional, o serviço e um horário
            disponível. A confirmação é feita imediatamente.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-400/30 bg-red-950/40 px-5 py-4 text-red-200"
          >
            {error}
          </div>
        )}

        {confirmation && (
          <div
            role="status"
            className="mb-8 rounded-2xl border border-green-400/30 bg-green-950/40 p-6"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2
                className="mt-1 shrink-0 text-green-400"
                size={24}
              />

              <div>
                <h3 className="text-lg font-semibold text-green-200">
                  Agendamento realizado
                </h3>

                <p className="mt-1 text-green-100">
                  {confirmation.customer_name}, seu horário com{" "}
                  <strong>
                    {confirmation.barber.name}
                  </strong>{" "}
                  para{" "}
                  <strong>
                    {confirmation.service.name}
                  </strong>{" "}
                  foi reservado.
                </p>

                <p className="mt-2 text-sm text-green-200">
                  {formatAppointmentDate(
                    confirmation.starts_at
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-neutral-900/60 p-6 shadow-xl">
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <Scissors
                size={21}
                className="text-accent"
              />
              Serviço e horário
            </h3>

            {catalogLoading ? (
              <div
                role="status"
                className="flex min-h-48 items-center justify-center gap-3 text-neutral-300"
              >
                <LoaderCircle
                  className="animate-spin"
                  size={22}
                />
                Carregando opções...
              </div>
            ) : catalogUnavailable ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 text-neutral-300">
                Ainda não existem profissionais ou serviços
                disponíveis para agendamento online.
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-neutral-200">
                    Profissional
                  </span>

                  <select
                    value={selectedBarberId}
                    onChange={(event) => {
                      setSelectedBarberId(
                        event.target.value
                      );
                      setConfirmation(null);
                    }}
                    className={fieldClass}
                  >
                    {barbers.map((barber) => (
                      <option
                        key={barber.id}
                        value={barber.id}
                        className="bg-neutral-900"
                      >
                        {barber.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-neutral-200">
                    Serviço
                  </span>

                  <select
                    value={selectedServiceId}
                    onChange={(event) => {
                      setSelectedServiceId(
                        event.target.value
                      );
                      setConfirmation(null);
                    }}
                    className={fieldClass}
                  >
                    {services.map((service) => (
                      <option
                        key={service.id}
                        value={service.id}
                        className="bg-neutral-900"
                      >
                        {service.name} —{" "}
                        {formatMoney(service.price_cents)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-neutral-200">
                    Data
                  </span>

                  <input
                    type="date"
                    value={selectedDate}
                    min={minimumDate}
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                      setConfirmation(null);
                    }}
                    className={fieldClass}
                  />
                </label>

                {selectedService && (
                  <div className="flex flex-wrap gap-3 text-sm text-neutral-300">
                    <span className="rounded-full bg-black/30 px-3 py-1.5">
                      {selectedService.duration_minutes} minutos
                    </span>

                    <span className="rounded-full bg-black/30 px-3 py-1.5">
                      {formatMoney(
                        selectedService.price_cents
                      )}
                    </span>
                  </div>
                )}

                <div>
                  <span className="mb-3 block text-sm font-medium text-neutral-200">
                    Horários disponíveis
                  </span>

                  {availabilityLoading ? (
                    <div
                      role="status"
                      className="flex min-h-24 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/20 text-neutral-300"
                    >
                      <LoaderCircle
                        className="animate-spin"
                        size={21}
                      />
                      Consultando agenda...
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-neutral-300">
                      Nenhum horário disponível nesta data.
                      Escolha outro dia.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {slots.map((slot) => {
                        const selected =
                          selectedSlot?.starts_at ===
                          slot.starts_at;

                        return (
                          <button
                            key={slot.starts_at}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => {
                              setSelectedSlot(slot);
                              setConfirmation(null);
                            }}
                            className={
                              selected
                                ? "rounded-xl border border-accent bg-accent px-3 py-2.5 font-semibold text-black"
                                : "rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 font-medium text-white transition hover:border-accent hover:text-accent"
                            }
                          >
                            {formatTime(slot.starts_at)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-neutral-900/60 p-6 shadow-xl"
          >
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <UserRound
                size={21}
                className="text-accent"
              />
              Seus dados
            </h3>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-neutral-200">
                  Nome
                </span>

                <input
                  type="text"
                  name="name"
                  value={customer.name}
                  onChange={handleCustomerChange}
                  autoComplete="name"
                  minLength={2}
                  maxLength={120}
                  placeholder="Seu nome completo"
                  className={fieldClass}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-200">
                  WhatsApp
                </span>

                <input
                  type="tel"
                  name="phone"
                  value={customer.phone}
                  onChange={handleCustomerChange}
                  autoComplete="tel"
                  inputMode="tel"
                  minLength={8}
                  maxLength={32}
                  placeholder="(83) 99999-9999"
                  className={fieldClass}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-200">
                  E-mail
                </span>

                <input
                  type="email"
                  name="email"
                  value={customer.email}
                  onChange={handleCustomerChange}
                  autoComplete="email"
                  placeholder="email@exemplo.com"
                  className={fieldClass}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-neutral-200">
                  Observações
                </span>

                <textarea
                  name="notes"
                  value={customer.notes}
                  onChange={handleCustomerChange}
                  maxLength={2000}
                  rows={4}
                  placeholder="Alguma preferência ou informação importante?"
                  className={fieldClass}
                />
              </label>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start gap-3">
                <Clock3
                  className="mt-0.5 shrink-0 text-accent"
                  size={20}
                />

                <div className="text-sm">
                  {selectedSlot ? (
                    <>
                      <p className="font-semibold text-white">
                        Horário selecionado
                      </p>

                      <p className="mt-1 text-neutral-300">
                        {selectedBarber?.name} —{" "}
                        {selectedService?.name}
                      </p>

                      <p className="text-neutral-300">
                        {formatAppointmentDate(
                          selectedSlot.starts_at
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="text-neutral-300">
                      Selecione um horário para continuar.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3.5 font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    className="animate-spin"
                    size={20}
                  />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  Confirmar agendamento
                </>
              )}
            </button>

            <p className="mt-3 text-center text-xs text-neutral-500">
              O horário só é reservado após a confirmação
              exibida nesta página.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
