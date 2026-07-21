import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeDollarSign,
  Ban,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Edit3,
  Eye,
  LoaderCircle,
  Package,
  Plus,
  ReceiptText,
  RefreshCw,
  Save,
  Scissors,
  Search,
  ShieldAlert,
  Trash2,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";

import AdminModal from "../components/AdminModal";

import {
  expectArrayResponse,
} from "../../services/api";

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

const statusMeta = {
  open: {
    label: "Aberta",
    className: (
      "border-blue-400/20 bg-blue-400/10 " +
      "text-blue-200"
    ),
  },
  closed: {
    label: "Fechada",
    className: (
      "border-green-400/20 bg-green-400/10 " +
      "text-green-200"
    ),
  },
  cancelled: {
    label: "Cancelada",
    className: (
      "border-red-400/20 bg-red-400/10 " +
      "text-red-200"
    ),
  },
};

const paymentMethods = [
  {
    value: "cash",
    label: "Dinheiro",
  },
  {
    value: "pix",
    label: "Pix",
  },
  {
    value: "credit_card",
    label: "Cartão de crédito",
  },
  {
    value: "debit_card",
    label: "Cartão de débito",
  },
  {
    value: "other",
    label: "Outro",
  },
];

function blankOrderForm() {
  return {
    customer_id: "",
    appointment_id: "",
    notes: "",
    discount: "0.00",
  };
}

function blankServiceForm() {
  return {
    service_id: "",
    barber_id: "",
    quantity: "1",
    unit_price: "",
  };
}

function blankProductForm() {
  return {
    product_id: "",
    quantity: "1",
    unit_price: "",
  };
}

function blankPayment() {
  return {
    payment_method: "pix",
    amount: "",
    reference: "",
  };
}

function formatCurrency(valueInCents) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(
    Number(valueInCents || 0) / 100
  );
}

function centsToInput(valueInCents) {
  return (
    Number(valueInCents || 0) / 100
  ).toFixed(2);
}

function parseCurrencyToCents(value) {
  const normalized = String(value)
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");

  const parsed = Number(normalized);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return null;
  }

  return Math.round(parsed * 100);
}

function formatDateTime(value) {
  if (!value) {
    return "Não registrada";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(date);
}

function orderNumber(order) {
  return `#${String(order?.number || 0).padStart(
    5,
    "0"
  )}`;
}

function paymentLabel(method) {
  return (
    paymentMethods.find(
      (item) => item.value === method
    )?.label || method
  );
}

function appointmentLabel(appointment) {
  return [
    appointment.customer_name,
    formatDateTime(appointment.starts_at),
    appointment.service?.name,
  ].filter(Boolean).join(" — ");
}

export default function AdminServiceOrders() {
  const {
    request,
    hasPermission,
  } = useAdminAuth();

  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] =
    useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [barbers, setBarbers] = useState([]);

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingItemId, setRemovingItemId] =
    useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("");
  const [customerFilter, setCustomerFilter] =
    useState("");

  const [modalMode, setModalMode] =
    useState(null);

  const [orderForm, setOrderForm] =
    useState(blankOrderForm);

  const [serviceForm, setServiceForm] =
    useState(blankServiceForm);

  const [productForm, setProductForm] =
    useState(blankProductForm);

  const [payments, setPayments] = useState([
    blankPayment(),
  ]);

  const [cancelReason, setCancelReason] =
    useState("");

  const canManage = hasPermission(
    "commerce.manage"
  );

  const loadOptional = useCallback(
    async (path) => {
      try {
        return await request(path);
      } catch (requestError) {
        if (
          requestError.status === 403 ||
          requestError.status === 404
        ) {
          return [];
        }

        throw requestError;
      }
    },
    [request]
  );

  const loadData = useCallback(async () => {
    if (!canManage) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const now = new Date();

    const startsFrom = new Date(now);
    startsFrom.setDate(
      startsFrom.getDate() - 30
    );

    const startsTo = new Date(now);
    startsTo.setDate(
      startsTo.getDate() + 60
    );

    const appointmentParams =
      new URLSearchParams({
        starts_from: startsFrom.toISOString(),
        starts_to: startsTo.toISOString(),
      });

    try {
      const [
        ordersResponse,
        summaryResponse,
        customersResponse,
        appointmentsResponse,
        servicesResponse,
        productsResponse,
        barbersResponse,
      ] = await Promise.all([
        request(
          "/api/v1/admin/service-orders"
        ),
        request(
          "/api/v1/admin/service-orders/summary"
        ),
        loadOptional(
          "/api/v1/admin/customers?active=true"
        ),
        loadOptional(
          (
            "/api/v1/admin/appointments?" +
            appointmentParams.toString()
          )
        ),
        request("/api/v1/services"),
        loadOptional(
          "/api/v1/admin/products?active=true"
        ),
        request("/api/v1/barbers"),
      ]);

      const orderList = expectArrayResponse(
        ordersResponse,
        "comandas"
      );

      const customerList = expectArrayResponse(
        customersResponse,
        "clientes"
      );

      const appointmentList = expectArrayResponse(
        appointmentsResponse,
        "agendamentos"
      );

      const serviceList = expectArrayResponse(
        servicesResponse,
        "serviços"
      );

      const productList = expectArrayResponse(
        productsResponse,
        "produtos"
      );

      const barberList = expectArrayResponse(
        barbersResponse,
        "profissionais"
      );

      setOrders(orderList);
      setSummary(summaryResponse);
      setCustomers(customerList);
      setAppointments(
        appointmentList.filter(
          (appointment) => (
            ![
              "cancelled",
              "no_show",
            ].includes(appointment.status)
          )
        )
      );
      setServices(serviceList);
      setProducts(productList);
      setBarbers(barberList);

      setSelectedOrder((current) => {
        if (!current) {
          return orderList[0] || null;
        }

        return (
          orderList.find(
            (order) => order.id === current.id
          ) ||
          orderList[0] ||
          null
        );
      });
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível carregar as comandas."
      );
    } finally {
      setLoading(false);
    }
  }, [
    canManage,
    loadOptional,
    request,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredOrders = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        !statusFilter ||
        order.status === statusFilter;

      const matchesCustomer =
        !customerFilter ||
        order.customer_id === customerFilter;

      const matchesSearch =
        !term ||
        [
          order.number,
          order.customer?.name,
          order.customer?.email,
          order.customer?.phone,
          order.notes,
          order.status,
        ].some((value) => (
          String(value || "")
            .toLowerCase()
            .includes(term)
        ));

      return (
        matchesStatus &&
        matchesCustomer &&
        matchesSearch
      );
    });
  }, [
    customerFilter,
    orders,
    search,
    statusFilter,
  ]);

  const availableAppointments = useMemo(
    () => {
      const usedAppointmentIds = new Set(
        orders
          .filter(
            (order) => (
              order.id !== selectedOrder?.id
            )
          )
          .map((order) => order.appointment_id)
          .filter(Boolean)
      );

      return appointments.filter(
        (appointment) => (
          !usedAppointmentIds.has(
            appointment.id
          )
        )
      );
    },
    [
      appointments,
      orders,
      selectedOrder?.id,
    ]
  );

  function updateOrderState(updatedOrder) {
    setOrders((current) => {
      const exists = current.some(
        (order) => order.id === updatedOrder.id
      );

      if (!exists) {
        return [
          updatedOrder,
          ...current,
        ];
      }

      return current.map((order) => (
        order.id === updatedOrder.id
          ? updatedOrder
          : order
      ));
    });

    setSelectedOrder(updatedOrder);
  }

  async function refreshSummary() {
    const response = await request(
      "/api/v1/admin/service-orders/summary"
    );

    setSummary(response);
  }

  async function refreshProducts() {
    try {
      const response = await request(
        "/api/v1/admin/products?active=true"
      );

      setProducts(
        expectArrayResponse(
          response,
          "produtos"
        )
      );
    } catch (requestError) {
      if (requestError.status !== 403) {
        throw requestError;
      }
    }
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalMode(null);
    setOrderForm(blankOrderForm());
    setServiceForm(blankServiceForm());
    setProductForm(blankProductForm());
    setPayments([blankPayment()]);
    setCancelReason("");
    setError("");
  }

  function openCreateOrder() {
    setOrderForm(blankOrderForm());
    setError("");
    setSuccess("");
    setModalMode("create");
  }

  function openEditOrder() {
    if (!selectedOrder) {
      return;
    }

    setOrderForm({
      customer_id:
        selectedOrder.customer_id || "",
      appointment_id:
        selectedOrder.appointment_id || "",
      notes:
        selectedOrder.notes || "",
      discount:
        centsToInput(
          selectedOrder.discount_cents
        ),
    });

    setError("");
    setSuccess("");
    setModalMode("edit");
  }

  function openServiceItem() {
    setServiceForm({
      ...blankServiceForm(),
      barber_id:
        selectedOrder?.appointment
          ? (
            appointments.find(
              (appointment) => (
                appointment.id ===
                selectedOrder.appointment_id
              )
            )?.barber?.id || ""
          )
          : "",
    });

    setError("");
    setSuccess("");
    setModalMode("service");
  }

  function openProductItem() {
    setProductForm(blankProductForm());
    setError("");
    setSuccess("");
    setModalMode("product");
  }

  function openCloseOrder() {
    if (!selectedOrder) {
      return;
    }

    setPayments([
      {
        payment_method: "pix",
        amount: centsToInput(
          selectedOrder.total_cents
        ),
        reference: "",
      },
    ]);

    setError("");
    setSuccess("");
    setModalMode("close");
  }

  function openCancelOrder() {
    setCancelReason("");
    setError("");
    setSuccess("");
    setModalMode("cancel");
  }

  async function submitOrder(event) {
    event.preventDefault();

    const discountCents =
      parseCurrencyToCents(
        orderForm.discount
      );

    if (discountCents === null) {
      setError(
        "Informe um desconto válido."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      customer_id:
        orderForm.customer_id || null,
      appointment_id:
        orderForm.appointment_id || null,
      notes:
        orderForm.notes.trim() || null,
      discount_cents:
        discountCents,
    };

    try {
      const editing =
        modalMode === "edit";

      const endpoint = editing
        ? (
          "/api/v1/admin/service-orders/" +
          selectedOrder.id
        )
        : "/api/v1/admin/service-orders";

      const updatedOrder = await request(
        endpoint,
        {
          method: editing
            ? "PATCH"
            : "POST",
          body: JSON.stringify(payload),
        }
      );

      updateOrderState(updatedOrder);
      setModalMode(null);
      setOrderForm(blankOrderForm());

      setSuccess(
        editing
          ? "Comanda atualizada com sucesso."
          : "Comanda aberta com sucesso."
      );

      await refreshSummary();
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível salvar a comanda."
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitServiceItem(event) {
    event.preventDefault();

    const quantity = Number(
      serviceForm.quantity
    );

    const unitPriceCents =
      serviceForm.unit_price.trim()
        ? parseCurrencyToCents(
            serviceForm.unit_price
          )
        : null;

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      setError(
        "Informe uma quantidade inteira positiva."
      );
      return;
    }

    if (
      serviceForm.unit_price.trim() &&
      unitPriceCents === null
    ) {
      setError(
        "Informe um preço unitário válido."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updatedOrder = await request(
        (
          "/api/v1/admin/service-orders/" +
          selectedOrder.id +
          "/items/services"
        ),
        {
          method: "POST",
          body: JSON.stringify({
            service_id:
              serviceForm.service_id,
            barber_id:
              serviceForm.barber_id || null,
            quantity,
            unit_price_cents:
              unitPriceCents,
          }),
        }
      );

      updateOrderState(updatedOrder);
      setModalMode(null);
      setServiceForm(blankServiceForm());

      setSuccess(
        "Serviço adicionado à comanda."
      );
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível adicionar o serviço."
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitProductItem(event) {
    event.preventDefault();

    const quantity = Number(
      productForm.quantity
    );

    const unitPriceCents =
      productForm.unit_price.trim()
        ? parseCurrencyToCents(
            productForm.unit_price
          )
        : null;

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      setError(
        "Informe uma quantidade inteira positiva."
      );
      return;
    }

    if (
      productForm.unit_price.trim() &&
      unitPriceCents === null
    ) {
      setError(
        "Informe um preço unitário válido."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updatedOrder = await request(
        (
          "/api/v1/admin/service-orders/" +
          selectedOrder.id +
          "/items/products"
        ),
        {
          method: "POST",
          body: JSON.stringify({
            product_id:
              productForm.product_id,
            quantity,
            unit_price_cents:
              unitPriceCents,
          }),
        }
      );

      updateOrderState(updatedOrder);
      setModalMode(null);
      setProductForm(blankProductForm());

      setSuccess(
        "Produto adicionado e estoque atualizado."
      );

      await refreshProducts();
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível adicionar o produto."
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(item) {
    if (
      !selectedOrder ||
      selectedOrder.status !== "open"
    ) {
      return;
    }

    const confirmed = window.confirm(
      (
        `Remover "${item.name}" da comanda ` +
        `${orderNumber(selectedOrder)}?`
      )
    );

    if (!confirmed) {
      return;
    }

    setRemovingItemId(item.id);
    setError("");
    setSuccess("");

    try {
      const updatedOrder = await request(
        (
          "/api/v1/admin/service-orders/" +
          selectedOrder.id +
          "/items/" +
          item.id
        ),
        {
          method: "DELETE",
        }
      );

      updateOrderState(updatedOrder);

      setSuccess(
        item.item_type === "product"
          ? (
            "Produto removido e estoque " +
            "estornado."
          )
          : "Serviço removido da comanda."
      );

      if (item.item_type === "product") {
        await refreshProducts();
      }
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível remover o item."
      );
    } finally {
      setRemovingItemId(null);
    }
  }

  function updatePayment(
    index,
    field,
    value
  ) {
    setPayments((current) => (
      current.map((payment, position) => (
        position === index
          ? {
            ...payment,
            [field]: value,
          }
          : payment
      ))
    ));
  }

  function addPayment() {
    if (payments.length >= 10) {
      return;
    }

    setPayments((current) => [
      ...current,
      blankPayment(),
    ]);
  }

  function removePayment(index) {
    if (payments.length <= 1) {
      return;
    }

    setPayments((current) => (
      current.filter(
        (_, position) => position !== index
      )
    ));
  }

  async function submitClose(event) {
    event.preventDefault();

    const parsedPayments = payments.map(
      (payment) => ({
        payment_method:
          payment.payment_method,
        amount_cents:
          parseCurrencyToCents(
            payment.amount
          ),
        reference:
          payment.reference.trim() || null,
      })
    );

    if (
      parsedPayments.some(
        (payment) => (
          payment.amount_cents === null ||
          payment.amount_cents <= 0
        )
      )
    ) {
      setError(
        "Todos os pagamentos devem possuir valor positivo."
      );
      return;
    }

    const paymentTotal = parsedPayments.reduce(
      (total, payment) => (
        total + payment.amount_cents
      ),
      0
    );

    if (
      paymentTotal !== selectedOrder.total_cents
    ) {
      setError(
        (
          "A soma dos pagamentos deve ser " +
          formatCurrency(
            selectedOrder.total_cents
          ) +
          "."
        )
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updatedOrder = await request(
        (
          "/api/v1/admin/service-orders/" +
          selectedOrder.id +
          "/close"
        ),
        {
          method: "POST",
          body: JSON.stringify({
            payments: parsedPayments,
          }),
        }
      );

      updateOrderState(updatedOrder);
      setModalMode(null);
      setPayments([blankPayment()]);

      setSuccess(
        "Comanda fechada com sucesso."
      );

      await refreshSummary();
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível fechar a comanda."
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitCancel(event) {
    event.preventDefault();

    const reason = cancelReason.trim();

    if (reason.length < 2) {
      setError(
        "Informe o motivo do cancelamento."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updatedOrder = await request(
        (
          "/api/v1/admin/service-orders/" +
          selectedOrder.id +
          "/cancel"
        ),
        {
          method: "POST",
          body: JSON.stringify({
            reason,
          }),
        }
      );

      updateOrderState(updatedOrder);
      setModalMode(null);
      setCancelReason("");

      setSuccess(
        "Comanda cancelada e produtos estornados."
      );

      await Promise.all([
        refreshSummary(),
        refreshProducts(),
      ]);
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível cancelar a comanda."
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
          Comandas indisponíveis
        </h1>

        <p className="mt-3 text-neutral-300">
          Sua conta não possui a permissão
          <span className="mx-1 font-mono text-red-200">
            commerce.manage
          </span>
          .
        </p>
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Abertas",
      value: summary?.open_orders || 0,
      detail: "Em atendimento",
      icon: ClipboardList,
    },
    {
      label: "Fechadas",
      value: summary?.closed_orders || 0,
      detail: "Vendas concluídas",
      icon: CheckCircle2,
    },
    {
      label: "Canceladas",
      value: summary?.cancelled_orders || 0,
      detail: "Histórico preservado",
      icon: Ban,
    },
    {
      label: "Receita bruta",
      value: formatCurrency(
        summary?.gross_revenue_cents
      ),
      detail: "Comandas fechadas",
      icon: CircleDollarSign,
    },
    {
      label: "Tíquete médio",
      value: formatCurrency(
        summary?.average_ticket_cents
      ),
      detail: "Valor médio por venda",
      icon: BadgeDollarSign,
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Operação comercial
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Comandas e vendas
          </h1>

          <p className="mt-2 max-w-3xl text-neutral-400">
            Abra atendimentos, adicione serviços e
            produtos, controle descontos, pagamentos,
            fechamento e cancelamento.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={loadData}
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
            onClick={openCreateOrder}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-black transition hover:opacity-90"
          >
            <Plus size={18} />
            Nova comanda
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

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="rounded-2xl border border-white/10 bg-neutral-900 p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {card.label}
                </p>

                <Icon
                  size={20}
                  className="text-accent"
                />
              </div>

              <p className="mt-4 text-2xl font-bold">
                {card.value}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                {card.detail}
              </p>
            </article>
          );
        })}
      </section>

      <section className="mt-7 grid gap-4 rounded-3xl border border-white/10 bg-neutral-900 p-5 md:grid-cols-2 xl:grid-cols-4">
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
              placeholder="Número, cliente, telefone ou observação..."
              className={`${inputClass} pl-11`}
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Situação
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
            <option value="">
              Todas
            </option>

            <option value="open">
              Abertas
            </option>

            <option value="closed">
              Fechadas
            </option>

            <option value="cancelled">
              Canceladas
            </option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Cliente
          </span>

          <select
            value={customerFilter}
            onChange={(event) => (
              setCustomerFilter(
                event.target.value
              )
            )}
            className={inputClass}
          >
            <option value="">
              Todos
            </option>

            {customers.map((customer) => (
              <option
                key={customer.id}
                value={customer.id}
              >
                {customer.name}
              </option>
            ))}
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
            Carregando comandas...
          </div>
        </div>
      ) : (
        <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm text-neutral-500">
                {filteredOrders.length}
                {" "}
                {filteredOrders.length === 1
                  ? "comanda encontrada"
                  : "comandas encontradas"}
              </p>
            </div>

            {filteredOrders.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => {
                  const meta =
                    statusMeta[order.status] ||
                    statusMeta.open;

                  const selected =
                    selectedOrder?.id ===
                    order.id;

                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => (
                        setSelectedOrder(order)
                      )}
                      className={[
                        "w-full rounded-2xl border",
                        "p-5 text-left transition",
                        selected
                          ? (
                            "border-accent/60 " +
                            "bg-accent/5"
                          )
                          : (
                            "border-white/10 " +
                            "bg-neutral-900 " +
                            "hover:border-white/20"
                          ),
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-bold">
                            {orderNumber(order)}
                          </p>

                          <p className="mt-1 text-sm text-neutral-400">
                            {order.customer?.name ||
                              "Consumidor não identificado"}
                          </p>
                        </div>

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

                      <div className="mt-4 flex items-end justify-between gap-4">
                        <div className="text-xs text-neutral-500">
                          <p>
                            {order.item_count}
                            {" "}
                            {order.item_count === 1
                              ? "item"
                              : "itens"}
                          </p>

                          <p className="mt-1">
                            {formatDateTime(
                              order.opened_at
                            )}
                          </p>
                        </div>

                        <p className="text-lg font-bold text-accent">
                          {formatCurrency(
                            order.total_cents
                          )}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <OrderDetail
            order={selectedOrder}
            appointments={appointments}
            removingItemId={removingItemId}
            onEdit={openEditOrder}
            onAddService={openServiceItem}
            onAddProduct={openProductItem}
            onClose={openCloseOrder}
            onCancel={openCancelOrder}
            onRemoveItem={removeItem}
          />
        </div>
      )}

      <AdminModal
        open={
          modalMode === "create" ||
          modalMode === "edit"
        }
        title={
          modalMode === "edit"
            ? "Editar comanda"
            : "Nova comanda"
        }
        description="Cliente, agendamento, desconto e observações são opcionais."
        onClose={closeModal}
        wide
        footer={
          <ModalFooter
            saving={saving}
            formId="service-order-form"
            submitLabel={
              modalMode === "edit"
                ? "Salvar alterações"
                : "Abrir comanda"
            }
            onCancel={closeModal}
          />
        }
      >
        <ModalError
          visible={Boolean(error)}
          message={error}
        />

        <form
          id="service-order-form"
          onSubmit={submitOrder}
          className="space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Cliente
              </span>

              <select
                value={orderForm.customer_id}
                onChange={(event) => (
                  setOrderForm((current) => ({
                    ...current,
                    customer_id:
                      event.target.value,
                  }))
                )}
                className={inputClass}
              >
                <option value="">
                  Consumidor não identificado
                </option>

                {customers.map((customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.name}
                    {customer.phone
                      ? ` — ${customer.phone}`
                      : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Agendamento
              </span>

              <select
                value={orderForm.appointment_id}
                onChange={(event) => (
                  setOrderForm((current) => ({
                    ...current,
                    appointment_id:
                      event.target.value,
                  }))
                )}
                className={inputClass}
              >
                <option value="">
                  Sem agendamento
                </option>

                {availableAppointments.map(
                  (appointment) => (
                    <option
                      key={appointment.id}
                      value={appointment.id}
                    >
                      {appointmentLabel(
                        appointment
                      )}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Desconto
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={orderForm.discount}
                onChange={(event) => (
                  setOrderForm((current) => ({
                    ...current,
                    discount:
                      event.target.value,
                  }))
                )}
                className={inputClass}
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-neutral-200">
              Observações
            </span>

            <textarea
              value={orderForm.notes}
              onChange={(event) => (
                setOrderForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              )}
              className={`${inputClass} min-h-28 resize-y`}
              maxLength={2000}
            />
          </label>
        </form>
      </AdminModal>

      <AdminModal
        open={modalMode === "service"}
        title="Adicionar serviço"
        description="O preço do catálogo será usado quando o valor unitário ficar vazio."
        onClose={closeModal}
        footer={
          <ModalFooter
            saving={saving}
            formId="service-item-form"
            submitLabel="Adicionar serviço"
            onCancel={closeModal}
          />
        }
      >
        <ModalError
          visible={Boolean(error)}
          message={error}
        />

        <form
          id="service-item-form"
          onSubmit={submitServiceItem}
          className="space-y-5"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-neutral-200">
              Serviço
            </span>

            <select
              value={serviceForm.service_id}
              onChange={(event) => (
                setServiceForm((current) => ({
                  ...current,
                  service_id:
                    event.target.value,
                }))
              )}
              className={inputClass}
              required
            >
              <option value="">
                Selecione
              </option>

              {services.map((service) => (
                <option
                  key={service.id}
                  value={service.id}
                >
                  {service.name}
                  {" — "}
                  {formatCurrency(
                    service.price_cents
                  )}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Profissional
              </span>

              <select
                value={serviceForm.barber_id}
                onChange={(event) => (
                  setServiceForm((current) => ({
                    ...current,
                    barber_id:
                      event.target.value,
                  }))
                )}
                className={inputClass}
              >
                <option value="">
                  Não informado
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

            <FormField
              label="Quantidade"
              type="number"
              value={serviceForm.quantity}
              onChange={(value) => (
                setServiceForm((current) => ({
                  ...current,
                  quantity: value,
                }))
              )}
              min="1"
              max="1000"
              step="1"
              required
            />

            <FormField
              label="Preço unitário personalizado"
              type="number"
              value={serviceForm.unit_price}
              onChange={(value) => (
                setServiceForm((current) => ({
                  ...current,
                  unit_price: value,
                }))
              )}
              min="0"
              step="0.01"
              placeholder="Usar preço do catálogo"
            />
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={modalMode === "product"}
        title="Adicionar produto"
        description="A inclusão realiza a baixa automática do estoque."
        onClose={closeModal}
        footer={
          <ModalFooter
            saving={saving}
            formId="product-item-form"
            submitLabel="Adicionar produto"
            onCancel={closeModal}
          />
        }
      >
        <ModalError
          visible={Boolean(error)}
          message={error}
        />

        <form
          id="product-item-form"
          onSubmit={submitProductItem}
          className="space-y-5"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-neutral-200">
              Produto
            </span>

            <select
              value={productForm.product_id}
              onChange={(event) => (
                setProductForm((current) => ({
                  ...current,
                  product_id:
                    event.target.value,
                }))
              )}
              className={inputClass}
              required
            >
              <option value="">
                Selecione
              </option>

              {products.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                  disabled={
                    product.stock_quantity <= 0
                  }
                >
                  {product.name}
                  {" — "}
                  {formatCurrency(
                    product.sale_price_cents
                  )}
                  {" — "}
                  {product.stock_quantity}
                  {" "}
                  {product.unit_label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Quantidade"
              type="number"
              value={productForm.quantity}
              onChange={(value) => (
                setProductForm((current) => ({
                  ...current,
                  quantity: value,
                }))
              )}
              min="1"
              step="1"
              required
            />

            <FormField
              label="Preço unitário personalizado"
              type="number"
              value={productForm.unit_price}
              onChange={(value) => (
                setProductForm((current) => ({
                  ...current,
                  unit_price: value,
                }))
              )}
              min="0"
              step="0.01"
              placeholder="Usar preço do produto"
            />
          </div>

          {products.length === 0 && (
            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100">
              Nenhum produto ficou disponível para
              consulta. Verifique a permissão
              <span className="mx-1 font-mono">
                inventory.manage
              </span>
              ou cadastre produtos ativos.
            </div>
          )}
        </form>
      </AdminModal>

      <AdminModal
        open={modalMode === "close"}
        title="Fechar comanda"
        description="A soma dos pagamentos deve corresponder exatamente ao total."
        onClose={closeModal}
        wide
        footer={
          <ModalFooter
            saving={saving}
            formId="close-order-form"
            submitLabel="Confirmar fechamento"
            onCancel={closeModal}
          />
        }
      >
        <ModalError
          visible={Boolean(error)}
          message={error}
        />

        <div className="mb-5 rounded-2xl border border-accent/20 bg-accent/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-yellow-100">
            Total da comanda
          </p>

          <p className="mt-2 text-3xl font-bold text-accent">
            {formatCurrency(
              selectedOrder?.total_cents
            )}
          </p>
        </div>

        <form
          id="close-order-form"
          onSubmit={submitClose}
          className="space-y-4"
        >
          {payments.map((payment, index) => (
            <div
              key={`payment-${index}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Forma
                  </span>

                  <select
                    value={
                      payment.payment_method
                    }
                    onChange={(event) => (
                      updatePayment(
                        index,
                        "payment_method",
                        event.target.value
                      )
                    )}
                    className={inputClass}
                  >
                    {paymentMethods.map(
                      (method) => (
                        <option
                          key={method.value}
                          value={method.value}
                        >
                          {method.label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <FormField
                  label="Valor"
                  type="number"
                  value={payment.amount}
                  onChange={(value) => (
                    updatePayment(
                      index,
                      "amount",
                      value
                    )
                  )}
                  min="0.01"
                  step="0.01"
                  required
                />

                <FormField
                  label="Referência"
                  value={payment.reference}
                  onChange={(value) => (
                    updatePayment(
                      index,
                      "reference",
                      value
                    )
                  )}
                  maxLength={120}
                  placeholder="NSU, autorização..."
                />

                <button
                  type="button"
                  onClick={() => (
                    removePayment(index)
                  )}
                  disabled={payments.length <= 1}
                  className="mt-7 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-red-400/20 text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Remover pagamento"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addPayment}
            disabled={payments.length >= 10}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-neutral-200 transition hover:border-accent hover:text-accent disabled:opacity-50"
          >
            <Plus size={17} />
            Adicionar pagamento
          </button>
        </form>
      </AdminModal>

      <AdminModal
        open={modalMode === "cancel"}
        title="Cancelar comanda"
        description="Produtos serão devolvidos ao estoque e o histórico será preservado."
        onClose={closeModal}
        footer={
          <ModalFooter
            saving={saving}
            formId="cancel-order-form"
            submitLabel="Confirmar cancelamento"
            onCancel={closeModal}
            danger
          />
        }
      >
        <ModalError
          visible={Boolean(error)}
          message={error}
        />

        <form
          id="cancel-order-form"
          onSubmit={submitCancel}
        >
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-neutral-200">
              Motivo
            </span>

            <textarea
              value={cancelReason}
              onChange={(event) => (
                setCancelReason(
                  event.target.value
                )
              )}
              className={`${inputClass} min-h-32 resize-y`}
              minLength={2}
              maxLength={255}
              required
            />
          </label>
        </form>
      </AdminModal>
    </div>
  );
}

function OrderDetail({
  order,
  appointments,
  removingItemId,
  onEdit,
  onAddService,
  onAddProduct,
  onClose,
  onCancel,
  onRemoveItem,
}) {
  if (!order) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 bg-neutral-900/60 p-10 text-center">
        <Eye
          size={44}
          className="mx-auto text-neutral-600"
        />

        <h2 className="mt-4 text-xl font-bold">
          Selecione uma comanda
        </h2>

        <p className="mt-2 text-neutral-500">
          Os dados completos aparecerão aqui.
        </p>
      </div>
    );
  }

  const meta =
    statusMeta[order.status] ||
    statusMeta.open;

  const appointment = appointments.find(
    (item) => (
      item.id === order.appointment_id
    )
  );

  const open = order.status === "open";

  return (
    <section className="rounded-3xl border border-white/10 bg-neutral-900 p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold">
              Comanda {orderNumber(order)}
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

          <p className="mt-2 text-sm text-neutral-500">
            Aberta em
            {" "}
            {formatDateTime(order.opened_at)}
          </p>
        </div>

        {open && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-accent hover:text-accent"
          >
            <Edit3 size={16} />
            Editar
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          icon={UserRound}
          label="Cliente"
          value={
            order.customer?.name ||
            "Não identificado"
          }
          detail={
            order.customer?.phone ||
            order.customer?.email ||
            null
          }
        />

        <InfoCard
          icon={CalendarDays}
          label="Agendamento"
          value={
            order.appointment
              ? formatDateTime(
                  order.appointment.starts_at
                )
              : "Sem vínculo"
          }
          detail={
            appointment?.service?.name ||
            order.appointment?.status ||
            null
          }
        />

        <InfoCard
          icon={ReceiptText}
          label="Itens"
          value={String(order.item_count)}
          detail={
            order.item_count === 1
              ? "Item registrado"
              : "Itens registrados"
          }
        />

        <InfoCard
          icon={WalletCards}
          label="Pagamentos"
          value={String(order.payment_count)}
          detail={
            order.status === "closed"
              ? formatCurrency(
                  order.paid_cents
                )
              : "Aguardando fechamento"
          }
        />
      </div>

      {order.notes && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Observações
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
            {order.notes}
          </p>
        </div>
      )}

      <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h3 className="text-lg font-bold">
          Itens da comanda
        </h3>

        {open && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onAddService}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-accent hover:text-accent"
            >
              <Scissors size={17} />
              Serviço
            </button>

            <button
              type="button"
              onClick={onAddProduct}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-accent hover:text-accent"
            >
              <Package size={17} />
              Produto
            </button>
          </div>
        )}
      </div>

      {order.items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-neutral-500">
          Nenhum item adicionado.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <p className="font-semibold text-white">
                  {item.name}
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  {item.item_type === "service"
                    ? "Serviço"
                    : "Produto"}
                  {" • "}
                  {item.quantity}
                  {" × "}
                  {formatCurrency(
                    item.unit_price_cents
                  )}
                </p>

                {item.barber?.name && (
                  <p className="mt-1 text-xs text-neutral-500">
                    Profissional:
                    {" "}
                    {item.barber.name}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <p className="font-bold text-accent">
                  {formatCurrency(
                    item.total_cents
                  )}
                </p>

                {open && (
                  <button
                    type="button"
                    onClick={() => (
                      onRemoveItem(item)
                    )}
                    disabled={
                      removingItemId === item.id
                    }
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/20 text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                    aria-label="Remover item"
                  >
                    {removingItemId === item.id
                      ? (
                        <LoaderCircle
                          size={17}
                          className="animate-spin"
                        />
                      )
                      : <Trash2 size={17} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {order.payments.length > 0 && (
        <div className="mt-7">
          <h3 className="text-lg font-bold">
            Pagamentos
          </h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {order.payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {payment.payment_method === "cash"
                    ? <Banknote size={17} />
                    : <CreditCard size={17} />}

                  {paymentLabel(
                    payment.payment_method
                  )}
                </p>

                <p className="mt-2 text-lg font-bold text-accent">
                  {formatCurrency(
                    payment.amount_cents
                  )}
                </p>

                {payment.reference && (
                  <p className="mt-1 text-xs text-neutral-500">
                    {payment.reference}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="space-y-3 text-sm">
          <TotalLine
            label="Subtotal"
            value={order.subtotal_cents}
          />

          <TotalLine
            label="Desconto"
            value={-order.discount_cents}
          />

          <div className="border-t border-white/10 pt-3">
            <TotalLine
              label="Total"
              value={order.total_cents}
              strong
            />
          </div>
        </div>
      </div>

      {order.cancellation_reason && (
        <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-200">
            Motivo do cancelamento
          </p>

          <p className="mt-2 text-sm text-red-100">
            {order.cancellation_reason}
          </p>
        </div>
      )}

      {open && (
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-5 py-3 font-semibold text-red-200 transition hover:bg-red-400/15"
          >
            <Ban size={18} />
            Cancelar comanda
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={
              order.item_count === 0 ||
              order.total_cents <= 0
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save size={18} />
            Fechar comanda
          </button>
        </div>
      )}
    </section>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  detail,
}) {
  return (
    <div className="rounded-2xl bg-black/20 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        <Icon size={15} />
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-neutral-200">
        {value}
      </p>

      {detail && (
        <p className="mt-1 truncate text-xs text-neutral-500">
          {detail}
        </p>
      )}
    </div>
  );
}

function TotalLine({
  label,
  value,
  strong = false,
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p
        className={
          strong
            ? "text-lg font-bold text-white"
            : "text-neutral-400"
        }
      >
        {label}
      </p>

      <p
        className={
          strong
            ? "text-2xl font-bold text-accent"
            : (
              value < 0
                ? "font-semibold text-red-300"
                : "font-semibold text-neutral-200"
            )
        }
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-neutral-900/60 p-10 text-center">
      <ClipboardList
        size={44}
        className="mx-auto text-neutral-600"
      />

      <h2 className="mt-4 text-xl font-bold">
        Nenhuma comanda encontrada
      </h2>

      <p className="mt-2 text-neutral-500">
        Ajuste os filtros ou abra uma nova comanda.
      </p>
    </div>
  );
}

function FormField({
  label,
  type = "text",
  value,
  onChange,
  ...props
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => (
          onChange(event.target.value)
        )}
        className={inputClass}
        {...props}
      />
    </label>
  );
}

function ModalError({
  visible,
  message,
}) {
  if (!visible) {
    return null;
  }

  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
      <XCircle size={19} />
      {message}
    </div>
  );
}

function ModalFooter({
  saving,
  formId,
  submitLabel,
  onCancel,
  danger = false,
}) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-neutral-200 transition hover:bg-white/5 disabled:opacity-50"
      >
        Voltar
      </button>

      <button
        type="submit"
        form={formId}
        disabled={saving}
        className={[
          "inline-flex items-center justify-center",
          "gap-2 rounded-xl px-5 py-3",
          "font-bold transition",
          "disabled:opacity-50",
          danger
            ? (
              "bg-red-500 text-white " +
              "hover:bg-red-400"
            )
            : (
              "bg-accent text-black " +
              "hover:opacity-90"
            ),
        ].join(" ")}
      >
        {saving && (
          <LoaderCircle
            size={18}
            className="animate-spin"
          />
        )}

        {submitLabel}
      </button>
    </div>
  );
}
