import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgeDollarSign,
  Barcode,
  Boxes,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Edit3,
  History,
  LoaderCircle,
  Minus,
  Package,
  PackageCheck,
  PackageX,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Warehouse,
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

function blankSupplierForm() {
  return {
    legal_name: "",
    trade_name: "",
    document: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    active: true,
  };
}

function blankProductForm() {
  return {
    supplier_id: "",
    name: "",
    sku: "",
    barcode: "",
    description: "",
    unit_label: "un",
    cost: "0.00",
    sale_price: "0.00",
    initial_stock: "0",
    minimum_stock: "0",
    active: true,
  };
}

function blankMovementForm() {
  return {
    product_id: "",
    supplier_id: "",
    movement_type: "entry",
    quantity: "1",
    unit_cost: "",
    reason: "",
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

  const number = Number(normalized);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return null;
  }

  return Math.round(number * 100);
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

function formatDocument(value) {
  if (!value) {
    return "Não informado";
  }

  const digits = String(value).replace(
    /\D/g,
    ""
  );

  if (digits.length === 14) {
    return (
      `${digits.slice(0, 2)}.` +
      `${digits.slice(2, 5)}.` +
      `${digits.slice(5, 8)}/` +
      `${digits.slice(8, 12)}-` +
      digits.slice(12)
    );
  }

  if (digits.length === 11) {
    return (
      `${digits.slice(0, 3)}.` +
      `${digits.slice(3, 6)}.` +
      `${digits.slice(6, 9)}-` +
      digits.slice(9)
    );
  }

  return value;
}

function formatPhone(value) {
  if (!value) {
    return "Não informado";
  }

  const digits = String(value).replace(
    /\D/g,
    ""
  );

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

function movementLabel(type) {
  return {
    entry: "Entrada",
    exit: "Saída",
    adjustment: "Ajuste",
  }[type] || type;
}

function movementIcon(type) {
  if (type === "entry") {
    return ArrowDownToLine;
  }

  if (type === "exit") {
    return ArrowUpFromLine;
  }

  return SlidersHorizontal;
}

function supplierDisplayName(supplier) {
  return (
    supplier?.trade_name ||
    supplier?.legal_name ||
    "Sem fornecedor"
  );
}

export default function AdminInventory() {
  const {
    request,
    hasPermission,
  } = useAdminAuth();

  const [activeTab, setActiveTab] =
    useState("products");

  const [suppliers, setSuppliers] =
    useState([]);

  const [products, setProducts] =
    useState([]);

  const [movements, setMovements] =
    useState([]);

  const [summary, setSummary] =
    useState(null);

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

  const [supplierFilter, setSupplierFilter] =
    useState("");

  const [stockFilter, setStockFilter] =
    useState("");

  const [movementTypeFilter, setMovementTypeFilter] =
    useState("");

  const [movementProductFilter, setMovementProductFilter] =
    useState("");

  const [modalMode, setModalMode] =
    useState(null);

  const [editingSupplier, setEditingSupplier] =
    useState(null);

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [supplierForm, setSupplierForm] =
    useState(blankSupplierForm);

  const [productForm, setProductForm] =
    useState(blankProductForm);

  const [movementForm, setMovementForm] =
    useState(blankMovementForm);

  const canManage = hasPermission(
    "inventory.manage"
  );

  const loadInventory = useCallback(
    async () => {
      if (!canManage) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [
          suppliersResponse,
          productsResponse,
          movementsResponse,
          summaryResponse,
        ] = await Promise.all([
          request(
            "/api/v1/admin/suppliers"
          ),
          request(
            "/api/v1/admin/products"
          ),
          request(
            (
              "/api/v1/admin/inventory/" +
              "movements?limit=300"
            )
          ),
          request(
            "/api/v1/admin/inventory/summary"
          ),
        ]);

        setSuppliers(suppliersResponse);
        setProducts(productsResponse);
        setMovements(movementsResponse);
        setSummary(summaryResponse);
      } catch (requestError) {
        setError(
          requestError.message ||
          "Não foi possível carregar o estoque."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      canManage,
      request,
    ]
  );

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const filteredSuppliers = useMemo(
    () => {
      const term = search
        .trim()
        .toLowerCase();

      return suppliers.filter(
        (supplier) => {
          const matchesActive =
            activeFilter === "" ||
            String(supplier.active) ===
              activeFilter;

          const matchesSearch =
            !term ||
            [
              supplier.legal_name,
              supplier.trade_name,
              supplier.document,
              supplier.contact_name,
              supplier.email,
              supplier.phone,
            ].some((value) => (
              String(value || "")
                .toLowerCase()
                .includes(term)
            ));

          return (
            matchesActive &&
            matchesSearch
          );
        }
      );
    },
    [
      activeFilter,
      search,
      suppliers,
    ]
  );

  const filteredProducts = useMemo(
    () => {
      const term = search
        .trim()
        .toLowerCase();

      return products.filter(
        (product) => {
          const matchesActive =
            activeFilter === "" ||
            String(product.active) ===
              activeFilter;

          const matchesSupplier =
            !supplierFilter ||
            product.supplier_id ===
              supplierFilter;

          const matchesStock =
            stockFilter === "" ||
            (
              stockFilter === "low" &&
              product.low_stock
            ) ||
            (
              stockFilter === "out" &&
              product.stock_quantity === 0
            ) ||
            (
              stockFilter === "normal" &&
              !product.low_stock
            );

          const matchesSearch =
            !term ||
            [
              product.name,
              product.sku,
              product.barcode,
              product.description,
              supplierDisplayName(
                product.supplier
              ),
            ].some((value) => (
              String(value || "")
                .toLowerCase()
                .includes(term)
            ));

          return (
            matchesActive &&
            matchesSupplier &&
            matchesStock &&
            matchesSearch
          );
        }
      );
    },
    [
      activeFilter,
      products,
      search,
      stockFilter,
      supplierFilter,
    ]
  );

  const filteredMovements = useMemo(
    () => {
      const term = search
        .trim()
        .toLowerCase();

      return movements.filter(
        (movement) => {
          const matchesType =
            !movementTypeFilter ||
            movement.movement_type ===
              movementTypeFilter;

          const matchesProduct =
            !movementProductFilter ||
            movement.product_id ===
              movementProductFilter;

          const matchesSupplier =
            !supplierFilter ||
            movement.supplier_id ===
              supplierFilter;

          const matchesSearch =
            !term ||
            [
              movement.product?.name,
              movement.product?.sku,
              movement.reason,
              movement.reference,
              supplierDisplayName(
                movement.supplier
              ),
            ].some((value) => (
              String(value || "")
                .toLowerCase()
                .includes(term)
            ));

          return (
            matchesType &&
            matchesProduct &&
            matchesSupplier &&
            matchesSearch
          );
        }
      );
    },
    [
      movementProductFilter,
      movements,
      movementTypeFilter,
      search,
      supplierFilter,
    ]
  );

  function resetFilters() {
    setSearch("");
    setActiveFilter("");
    setSupplierFilter("");
    setStockFilter("");
    setMovementTypeFilter("");
    setMovementProductFilter("");
  }

  function changeTab(tab) {
    setActiveTab(tab);
    resetFilters();
    setError("");
    setSuccess("");
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalMode(null);
    setEditingSupplier(null);
    setEditingProduct(null);
    setSupplierForm(
      blankSupplierForm()
    );
    setProductForm(
      blankProductForm()
    );
    setMovementForm(
      blankMovementForm()
    );
    setError("");
  }

  function updateSupplierForm(
    field,
    value
  ) {
    setSupplierForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateProductForm(
    field,
    value
  ) {
    setProductForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateMovementForm(
    field,
    value
  ) {
    setMovementForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateSupplier() {
    setEditingSupplier(null);
    setSupplierForm(
      blankSupplierForm()
    );
    setError("");
    setSuccess("");
    setModalMode("supplier");
  }

  function openEditSupplier(supplier) {
    setEditingSupplier(supplier);

    setSupplierForm({
      legal_name:
        supplier.legal_name || "",
      trade_name:
        supplier.trade_name || "",
      document:
        supplier.document || "",
      contact_name:
        supplier.contact_name || "",
      email:
        supplier.email || "",
      phone:
        supplier.phone || "",
      address:
        supplier.address || "",
      notes:
        supplier.notes || "",
      active:
        Boolean(supplier.active),
    });

    setError("");
    setSuccess("");
    setModalMode("supplier");
  }

  function openCreateProduct() {
    setEditingProduct(null);

    setProductForm({
      ...blankProductForm(),
      supplier_id:
        supplierFilter || "",
    });

    setError("");
    setSuccess("");
    setModalMode("product");
  }

  function openEditProduct(product) {
    setEditingProduct(product);

    setProductForm({
      supplier_id:
        product.supplier_id || "",
      name:
        product.name || "",
      sku:
        product.sku || "",
      barcode:
        product.barcode || "",
      description:
        product.description || "",
      unit_label:
        product.unit_label || "un",
      cost:
        centsToInput(
          product.cost_cents
        ),
      sale_price:
        centsToInput(
          product.sale_price_cents
        ),
      initial_stock:
        String(
          product.stock_quantity || 0
        ),
      minimum_stock:
        String(
          product.minimum_stock || 0
        ),
      active:
        Boolean(product.active),
    });

    setError("");
    setSuccess("");
    setModalMode("product");
  }

  function openMovement(
    product = null,
    movementType = "entry"
  ) {
    setMovementForm({
      ...blankMovementForm(),
      product_id:
        product?.id || "",
      supplier_id:
        product?.supplier_id || "",
      movement_type:
        movementType,
      unit_cost:
        movementType === "entry" &&
        product
          ? centsToInput(
              product.cost_cents
            )
          : "",
      reason:
        movementType === "entry"
          ? "Entrada de mercadoria"
          : (
            movementType === "exit"
              ? "Saída de estoque"
              : "Ajuste de inventário"
          ),
    });

    setError("");
    setSuccess("");
    setModalMode("movement");
  }

  async function submitSupplier(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      legal_name:
        supplierForm.legal_name.trim(),
      trade_name:
        supplierForm.trade_name.trim() ||
        null,
      document:
        supplierForm.document.trim() ||
        null,
      contact_name:
        supplierForm.contact_name.trim() ||
        null,
      email:
        supplierForm.email.trim() ||
        null,
      phone:
        supplierForm.phone.trim() ||
        null,
      address:
        supplierForm.address.trim() ||
        null,
      notes:
        supplierForm.notes.trim() ||
        null,
      active:
        supplierForm.active,
    };

    try {
      const endpoint = editingSupplier
        ? (
          "/api/v1/admin/suppliers/" +
          editingSupplier.id
        )
        : "/api/v1/admin/suppliers";

      await request(
        endpoint,
        {
          method: editingSupplier
            ? "PATCH"
            : "POST",
          body: JSON.stringify(payload),
        }
      );

      setModalMode(null);
      setEditingSupplier(null);
      setSupplierForm(
        blankSupplierForm()
      );

      setSuccess(
        editingSupplier
          ? "Fornecedor atualizado com sucesso."
          : "Fornecedor criado com sucesso."
      );

      await loadInventory();
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível salvar o fornecedor."
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitProduct(event) {
    event.preventDefault();

    const costCents = parseCurrencyToCents(
      productForm.cost
    );

    const salePriceCents =
      parseCurrencyToCents(
        productForm.sale_price
      );

    const initialStock = Number(
      productForm.initial_stock
    );

    const minimumStock = Number(
      productForm.minimum_stock
    );

    if (costCents === null) {
      setError(
        "Informe um custo válido."
      );
      return;
    }

    if (salePriceCents === null) {
      setError(
        "Informe um preço de venda válido."
      );
      return;
    }

    if (
      !Number.isInteger(initialStock) ||
      initialStock < 0
    ) {
      setError(
        "O estoque inicial deve ser um número inteiro positivo."
      );
      return;
    }

    if (
      !Number.isInteger(minimumStock) ||
      minimumStock < 0
    ) {
      setError(
        "O estoque mínimo deve ser um número inteiro positivo."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      supplier_id:
        productForm.supplier_id ||
        null,
      name:
        productForm.name.trim(),
      sku:
        productForm.sku.trim(),
      barcode:
        productForm.barcode.trim() ||
        null,
      description:
        productForm.description.trim() ||
        null,
      unit_label:
        productForm.unit_label.trim(),
      cost_cents:
        costCents,
      sale_price_cents:
        salePriceCents,
      minimum_stock:
        minimumStock,
      active:
        productForm.active,
    };

    if (!editingProduct) {
      payload.initial_stock =
        initialStock;
    }

    try {
      const endpoint = editingProduct
        ? (
          "/api/v1/admin/products/" +
          editingProduct.id
        )
        : "/api/v1/admin/products";

      await request(
        endpoint,
        {
          method: editingProduct
            ? "PATCH"
            : "POST",
          body: JSON.stringify(payload),
        }
      );

      setModalMode(null);
      setEditingProduct(null);
      setProductForm(
        blankProductForm()
      );

      setSuccess(
        editingProduct
          ? "Produto atualizado com sucesso."
          : "Produto criado com sucesso."
      );

      await loadInventory();
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível salvar o produto."
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitMovement(event) {
    event.preventDefault();

    const quantity = Number(
      movementForm.quantity
    );

    const unitCostCents =
      movementForm.unit_cost.trim()
        ? parseCurrencyToCents(
            movementForm.unit_cost
          )
        : null;

    if (
      !Number.isInteger(quantity) ||
      quantity === 0
    ) {
      setError(
        "A quantidade deve ser um número inteiro diferente de zero."
      );
      return;
    }

    if (
      ["entry", "exit"].includes(
        movementForm.movement_type
      ) &&
      quantity < 0
    ) {
      setError(
        "Entradas e saídas devem usar quantidade positiva."
      );
      return;
    }

    if (
      movementForm.unit_cost.trim() &&
      unitCostCents === null
    ) {
      setError(
        "Informe um custo unitário válido."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      product_id:
        movementForm.product_id,
      supplier_id:
        movementForm.supplier_id ||
        null,
      movement_type:
        movementForm.movement_type,
      quantity,
      unit_cost_cents:
        unitCostCents,
      reason:
        movementForm.reason.trim(),
      reference:
        movementForm.reference.trim() ||
        null,
    };

    try {
      await request(
        "/api/v1/admin/inventory/movements",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      setModalMode(null);
      setMovementForm(
        blankMovementForm()
      );

      setSuccess(
        "Movimentação registrada com sucesso."
      );

      await loadInventory();
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível registrar a movimentação."
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
          Estoque indisponível
        </h1>

        <p className="mt-3 text-neutral-300">
          Sua conta não possui a permissão
          <span className="mx-1 font-mono text-red-200">
            inventory.manage
          </span>
          .
        </p>
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Produtos",
      value:
        summary?.total_products || 0,
      detail:
        `${summary?.active_products || 0} ativos`,
      icon: Package,
    },
    {
      label: "Estoque baixo",
      value:
        summary?.low_stock_products || 0,
      detail:
        `${summary?.out_of_stock_products || 0} sem estoque`,
      icon: AlertTriangle,
    },
    {
      label: "Unidades",
      value:
        summary?.total_units || 0,
      detail:
        "Itens disponíveis",
      icon: Boxes,
    },
    {
      label: "Valor de custo",
      value: formatCurrency(
        summary?.inventory_cost_cents
      ),
      detail:
        "Capital em estoque",
      icon: CircleDollarSign,
    },
    {
      label: "Venda potencial",
      value: formatCurrency(
        summary?.inventory_sale_value_cents
      ),
      detail:
        "Valor bruto estimado",
      icon: BadgeDollarSign,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Operação comercial
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Estoque e fornecedores
          </h1>

          <p className="mt-2 max-w-3xl text-neutral-400">
            Gerencie produtos, fornecedores,
            saldos, estoque mínimo e o histórico
            completo de entradas, saídas e ajustes.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={loadInventory}
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
            onClick={() => openMovement()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-black transition hover:opacity-90"
          >
            <Plus size={18} />
            Nova movimentação
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

      <div className="mt-7 inline-flex flex-wrap rounded-2xl border border-white/10 bg-neutral-900 p-1.5">
        {[
          {
            value: "products",
            label: "Produtos",
            icon: Package,
          },
          {
            value: "suppliers",
            label: "Fornecedores",
            icon: Building2,
          },
          {
            value: "movements",
            label: "Movimentações",
            icon: History,
          },
        ].map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => (
                changeTab(tab.value)
              )}
              className={[
                "inline-flex items-center gap-2",
                "rounded-xl px-5 py-3",
                "text-sm font-semibold transition",
                activeTab === tab.value
                  ? "bg-accent text-black"
                  : (
                    "text-neutral-400 " +
                    "hover:text-white"
                  ),
              ].join(" ")}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <section className="mt-5 rounded-3xl border border-white/10 bg-neutral-900 p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label
            className={
              activeTab === "suppliers"
                ? "block xl:col-span-3"
                : "block xl:col-span-2"
            }
          >
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
                placeholder={
                  activeTab === "products"
                    ? "Produto, SKU, código ou fornecedor..."
                    : (
                      activeTab === "suppliers"
                        ? "Razão social, documento, contato..."
                        : "Produto, motivo ou referência..."
                    )
                }
                className={`${inputClass} pl-11`}
              />
            </div>
          </label>

          {activeTab === "products" && (
            <>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Fornecedor
                </span>

                <select
                  value={supplierFilter}
                  onChange={(event) => (
                    setSupplierFilter(
                      event.target.value
                    )
                  )}
                  className={inputClass}
                >
                  <option value="">
                    Todos
                  </option>

                  {suppliers.map(
                    (supplier) => (
                      <option
                        key={supplier.id}
                        value={supplier.id}
                      >
                        {supplierDisplayName(
                          supplier
                        )}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Estoque
                </span>

                <select
                  value={stockFilter}
                  onChange={(event) => (
                    setStockFilter(
                      event.target.value
                    )
                  )}
                  className={inputClass}
                >
                  <option value="">
                    Todos
                  </option>

                  <option value="normal">
                    Estoque normal
                  </option>

                  <option value="low">
                    Estoque baixo
                  </option>

                  <option value="out">
                    Sem estoque
                  </option>
                </select>
              </label>
            </>
          )}

          {activeTab === "suppliers" && (
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
          )}

          {activeTab === "movements" && (
            <>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Produto
                </span>

                <select
                  value={movementProductFilter}
                  onChange={(event) => (
                    setMovementProductFilter(
                      event.target.value
                    )
                  )}
                  className={inputClass}
                >
                  <option value="">
                    Todos
                  </option>

                  {products.map(
                    (product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Tipo
                </span>

                <select
                  value={movementTypeFilter}
                  onChange={(event) => (
                    setMovementTypeFilter(
                      event.target.value
                    )
                  )}
                  className={inputClass}
                >
                  <option value="">
                    Todos
                  </option>

                  <option value="entry">
                    Entradas
                  </option>

                  <option value="exit">
                    Saídas
                  </option>

                  <option value="adjustment">
                    Ajustes
                  </option>
                </select>
              </label>
            </>
          )}
        </div>

        <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-neutral-500">
            {activeTab === "products" &&
              `${filteredProducts.length} produtos encontrados`}

            {activeTab === "suppliers" &&
              `${filteredSuppliers.length} fornecedores encontrados`}

            {activeTab === "movements" &&
              `${filteredMovements.length} movimentações encontradas`}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-neutral-300 transition hover:bg-white/5"
            >
              Limpar filtros
            </button>

            {activeTab === "products" && (
              <button
                type="button"
                onClick={openCreateProduct}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-black"
              >
                <Plus size={17} />
                Novo produto
              </button>
            )}

            {activeTab === "suppliers" && (
              <button
                type="button"
                onClick={openCreateSupplier}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-black"
              >
                <Plus size={17} />
                Novo fornecedor
              </button>
            )}

            {activeTab === "movements" && (
              <button
                type="button"
                onClick={() => openMovement()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-black"
              >
                <Plus size={17} />
                Nova movimentação
              </button>
            )}
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
            Carregando estoque...
          </div>
        </div>
      ) : activeTab === "products" ? (
        filteredProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum produto encontrado"
            description="Ajuste os filtros ou cadastre um novo produto."
          />
        ) : (
          <div className="mt-7 grid gap-5 xl:grid-cols-2">
            {filteredProducts.map(
              (product) => (
                <article
                  key={product.id}
                  className={[
                    "rounded-3xl border bg-neutral-900 p-5 sm:p-6",
                    product.low_stock
                      ? "border-yellow-400/30"
                      : "border-white/10",
                  ].join(" ")}
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="truncate text-xl font-bold">
                          {product.name}
                        </h2>

                        <span
                          className={
                            product.active
                              ? "rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-semibold text-green-200"
                              : "rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-200"
                          }
                        >
                          {product.active
                            ? "Ativo"
                            : "Inativo"}
                        </span>

                        {product.low_stock && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-200">
                            <AlertTriangle size={14} />

                            {product.stock_quantity === 0
                              ? "Sem estoque"
                              : "Estoque baixo"}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 font-mono text-xs text-neutral-500">
                        SKU: {product.sku}
                      </p>

                      <p className="mt-2 text-sm text-neutral-400">
                        {supplierDisplayName(
                          product.supplier
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => (
                        openEditProduct(product)
                      )}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-accent hover:text-accent"
                    >
                      <Edit3 size={16} />
                      Editar
                    </button>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoCard
                      icon={Warehouse}
                      label="Saldo"
                      value={
                        `${product.stock_quantity} ${product.unit_label}`
                      }
                    />

                    <InfoCard
                      icon={AlertTriangle}
                      label="Mínimo"
                      value={
                        `${product.minimum_stock} ${product.unit_label}`
                      }
                    />

                    <InfoCard
                      icon={CircleDollarSign}
                      label="Custo"
                      value={formatCurrency(
                        product.cost_cents
                      )}
                    />

                    <InfoCard
                      icon={BadgeDollarSign}
                      label="Venda"
                      value={formatCurrency(
                        product.sale_price_cents
                      )}
                    />
                  </div>

                  {product.barcode && (
                    <p className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
                      <Barcode size={16} />
                      {product.barcode}
                    </p>
                  )}

                  {product.description && (
                    <p className="mt-4 whitespace-pre-wrap text-sm text-neutral-400">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => (
                        openMovement(
                          product,
                          "entry"
                        )
                      )}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm font-semibold text-green-200 transition hover:bg-green-400/15"
                    >
                      <TrendingUp size={17} />
                      Entrada
                    </button>

                    <button
                      type="button"
                      onClick={() => (
                        openMovement(
                          product,
                          "exit"
                        )
                      )}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-400/15"
                    >
                      <TrendingDown size={17} />
                      Saída
                    </button>

                    <button
                      type="button"
                      onClick={() => (
                        openMovement(
                          product,
                          "adjustment"
                        )
                      )}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-sm font-semibold text-blue-200 transition hover:bg-blue-400/15"
                    >
                      <SlidersHorizontal size={17} />
                      Ajustar
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        )
      ) : activeTab === "suppliers" ? (
        filteredSuppliers.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhum fornecedor encontrado"
            description="Ajuste os filtros ou cadastre um novo fornecedor."
          />
        ) : (
          <div className="mt-7 grid gap-5 xl:grid-cols-2">
            {filteredSuppliers.map(
              (supplier) => (
                <article
                  key={supplier.id}
                  className="rounded-3xl border border-white/10 bg-neutral-900 p-5 sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="truncate text-xl font-bold">
                          {supplierDisplayName(
                            supplier
                          )}
                        </h2>

                        <span
                          className={
                            supplier.active
                              ? "rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-semibold text-green-200"
                              : "rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-200"
                          }
                        >
                          {supplier.active
                            ? "Ativo"
                            : "Inativo"}
                        </span>
                      </div>

                      {supplier.trade_name && (
                        <p className="mt-2 text-sm text-neutral-500">
                          {supplier.legal_name}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => (
                        openEditSupplier(supplier)
                      )}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-accent hover:text-accent"
                    >
                      <Edit3 size={16} />
                      Editar
                    </button>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <InfoCard
                      icon={ClipboardList}
                      label="Documento"
                      value={formatDocument(
                        supplier.document
                      )}
                    />

                    <InfoCard
                      icon={PackageCheck}
                      label="Produtos"
                      value={
                        `${supplier.product_count} vinculados`
                      }
                    />

                    <InfoCard
                      icon={Building2}
                      label="Contato"
                      value={
                        supplier.contact_name ||
                        "Não informado"
                      }
                    />

                    <InfoCard
                      icon={Package}
                      label="Telefone"
                      value={formatPhone(
                        supplier.phone
                      )}
                    />
                  </div>

                  {supplier.email && (
                    <p className="mt-4 text-sm text-neutral-400">
                      {supplier.email}
                    </p>
                  )}

                  {supplier.address && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-500">
                      {supplier.address}
                    </p>
                  )}

                  {supplier.notes && (
                    <div className="mt-4 rounded-2xl bg-black/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Observações
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
                        {supplier.notes}
                      </p>
                    </div>
                  )}
                </article>
              )
            )}
          </div>
        )
      ) : filteredMovements.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhuma movimentação encontrada"
          description="Ajuste os filtros ou registre uma movimentação."
        />
      ) : (
        <div className="mt-7 overflow-hidden rounded-3xl border border-white/10 bg-neutral-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-black/20">
                <tr>
                  {[
                    "Data",
                    "Produto",
                    "Tipo",
                    "Quantidade",
                    "Saldo",
                    "Motivo",
                    "Referência",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredMovements.map(
                  (movement) => {
                    const MovementIcon =
                      movementIcon(
                        movement.movement_type
                      );

                    return (
                      <tr
                        key={movement.id}
                        className="transition hover:bg-white/[0.03]"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-neutral-400">
                          {formatDateTime(
                            movement.occurred_at
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-white">
                            {movement.product?.name}
                          </p>

                          <p className="mt-1 font-mono text-xs text-neutral-600">
                            {movement.product?.sku}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-neutral-200">
                            <MovementIcon size={14} />
                            {movementLabel(
                              movement.movement_type
                            )}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={
                              movement.quantity_delta > 0
                                ? "font-bold text-green-300"
                                : "font-bold text-red-300"
                            }
                          >
                            {movement.quantity_delta > 0
                              ? "+"
                              : ""}
                            {movement.quantity_delta}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-neutral-300">
                          {movement.stock_before}
                          {" → "}
                          {movement.stock_after}
                        </td>

                        <td className="max-w-xs px-5 py-4 text-sm text-neutral-300">
                          {movement.reason}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-neutral-500">
                          {movement.reference || "—"}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AdminModal
        open={modalMode === "supplier"}
        title={
          editingSupplier
            ? "Editar fornecedor"
            : "Novo fornecedor"
        }
        description="Cadastre os dados comerciais e de contato do fornecedor."
        onClose={closeModal}
        footer={
          <ModalFooter
            saving={saving}
            formId="supplier-form"
            submitLabel={
              editingSupplier
                ? "Salvar alterações"
                : "Criar fornecedor"
            }
            onCancel={closeModal}
          />
        }
      >
        <ModalError
          visible={
            Boolean(error) &&
            modalMode === "supplier"
          }
          message={error}
        />

        <form
          id="supplier-form"
          onSubmit={submitSupplier}
          className="space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Razão social"
              value={supplierForm.legal_name}
              onChange={(value) => (
                updateSupplierForm(
                  "legal_name",
                  value
                )
              )}
              required
              minLength={2}
              maxLength={160}
            />

            <FormField
              label="Nome comercial"
              value={supplierForm.trade_name}
              onChange={(value) => (
                updateSupplierForm(
                  "trade_name",
                  value
                )
              )}
              maxLength={160}
            />

            <FormField
              label="CPF ou CNPJ"
              value={supplierForm.document}
              onChange={(value) => (
                updateSupplierForm(
                  "document",
                  value
                )
              )}
              maxLength={32}
            />

            <FormField
              label="Pessoa de contato"
              value={supplierForm.contact_name}
              onChange={(value) => (
                updateSupplierForm(
                  "contact_name",
                  value
                )
              )}
              maxLength={120}
            />

            <FormField
              label="E-mail"
              type="email"
              value={supplierForm.email}
              onChange={(value) => (
                updateSupplierForm(
                  "email",
                  value
                )
              )}
              maxLength={255}
            />

            <FormField
              label="Telefone"
              type="tel"
              value={supplierForm.phone}
              onChange={(value) => (
                updateSupplierForm(
                  "phone",
                  value
                )
              )}
              maxLength={32}
            />
          </div>

          <TextAreaField
            label="Endereço"
            value={supplierForm.address}
            onChange={(value) => (
              updateSupplierForm(
                "address",
                value
              )
            )}
            maxLength={2000}
          />

          <TextAreaField
            label="Observações"
            value={supplierForm.notes}
            onChange={(value) => (
              updateSupplierForm(
                "notes",
                value
              )
            )}
            maxLength={2000}
          />

          <ActiveField
            checked={supplierForm.active}
            onChange={(value) => (
              updateSupplierForm(
                "active",
                value
              )
            )}
            title="Fornecedor ativo"
            description="Fornecedores inativos permanecem no histórico e nos vínculos existentes."
          />
        </form>
      </AdminModal>

      <AdminModal
        open={modalMode === "product"}
        title={
          editingProduct
            ? "Editar produto"
            : "Novo produto"
        }
        description="Configure identificação, fornecedor, preços e limites de estoque."
        onClose={closeModal}
        footer={
          <ModalFooter
            saving={saving}
            formId="product-form"
            submitLabel={
              editingProduct
                ? "Salvar alterações"
                : "Criar produto"
            }
            onCancel={closeModal}
          />
        }
      >
        <ModalError
          visible={
            Boolean(error) &&
            modalMode === "product"
          }
          message={error}
        />

        <form
          id="product-form"
          onSubmit={submitProduct}
          className="space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Nome"
              value={productForm.name}
              onChange={(value) => (
                updateProductForm(
                  "name",
                  value
                )
              )}
              required
              minLength={2}
              maxLength={160}
            />

            <FormField
              label="SKU"
              value={productForm.sku}
              onChange={(value) => (
                updateProductForm(
                  "sku",
                  value
                )
              )}
              required
              maxLength={80}
            />

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Fornecedor
              </span>

              <select
                value={productForm.supplier_id}
                onChange={(event) => (
                  updateProductForm(
                    "supplier_id",
                    event.target.value
                  )
                )}
                className={inputClass}
              >
                <option value="">
                  Sem fornecedor
                </option>

                {suppliers.map(
                  (supplier) => (
                    <option
                      key={supplier.id}
                      value={supplier.id}
                    >
                      {supplierDisplayName(
                        supplier
                      )}
                    </option>
                  )
                )}
              </select>
            </label>

            <FormField
              label="Código de barras"
              value={productForm.barcode}
              onChange={(value) => (
                updateProductForm(
                  "barcode",
                  value
                )
              )}
              maxLength={80}
            />

            <FormField
              label="Unidade"
              value={productForm.unit_label}
              onChange={(value) => (
                updateProductForm(
                  "unit_label",
                  value
                )
              )}
              required
              maxLength={24}
            />

            <FormField
              label="Custo"
              type="number"
              value={productForm.cost}
              onChange={(value) => (
                updateProductForm(
                  "cost",
                  value
                )
              )}
              required
              min="0"
              step="0.01"
            />

            <FormField
              label="Preço de venda"
              type="number"
              value={productForm.sale_price}
              onChange={(value) => (
                updateProductForm(
                  "sale_price",
                  value
                )
              )}
              required
              min="0"
              step="0.01"
            />

            <FormField
              label={
                editingProduct
                  ? "Estoque atual"
                  : "Estoque inicial"
              }
              type="number"
              value={productForm.initial_stock}
              onChange={(value) => (
                updateProductForm(
                  "initial_stock",
                  value
                )
              )}
              required
              min="0"
              step="1"
              disabled={Boolean(editingProduct)}
            />

            <FormField
              label="Estoque mínimo"
              type="number"
              value={productForm.minimum_stock}
              onChange={(value) => (
                updateProductForm(
                  "minimum_stock",
                  value
                )
              )}
              required
              min="0"
              step="1"
            />
          </div>

          {editingProduct && (
            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100">
              O saldo atual não é alterado pela
              edição cadastral. Use uma entrada,
              saída ou ajuste de estoque.
            </div>
          )}

          <TextAreaField
            label="Descrição"
            value={productForm.description}
            onChange={(value) => (
              updateProductForm(
                "description",
                value
              )
            )}
            maxLength={2000}
          />

          <ActiveField
            checked={productForm.active}
            onChange={(value) => (
              updateProductForm(
                "active",
                value
              )
            )}
            title="Produto ativo"
            description="Produtos inativos permanecem no histórico, mas podem ser removidos da operação diária."
          />
        </form>
      </AdminModal>

      <AdminModal
        open={modalMode === "movement"}
        title="Nova movimentação"
        description="Registre uma entrada, saída ou ajuste no saldo do produto."
        onClose={closeModal}
        footer={
          <ModalFooter
            saving={saving}
            formId="movement-form"
            submitLabel="Registrar movimentação"
            onCancel={closeModal}
          />
        }
      >
        <ModalError
          visible={
            Boolean(error) &&
            modalMode === "movement"
          }
          message={error}
        />

        <form
          id="movement-form"
          onSubmit={submitMovement}
          className="space-y-5"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-neutral-200">
              Produto
            </span>

            <select
              value={movementForm.product_id}
              onChange={(event) => {
                const product = products.find(
                  (item) => (
                    item.id ===
                    event.target.value
                  )
                );

                updateMovementForm(
                  "product_id",
                  event.target.value
                );

                if (product?.supplier_id) {
                  updateMovementForm(
                    "supplier_id",
                    product.supplier_id
                  );
                }
              }}
              className={inputClass}
              required
            >
              <option value="">
                Selecione o produto
              </option>

              {products.map(
                (product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name}
                    {" — "}
                    {product.stock_quantity}
                    {" "}
                    {product.unit_label}
                  </option>
                )
              )}
            </select>
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Tipo
              </span>

              <select
                value={movementForm.movement_type}
                onChange={(event) => (
                  updateMovementForm(
                    "movement_type",
                    event.target.value
                  )
                )}
                className={inputClass}
                required
              >
                <option value="entry">
                  Entrada
                </option>

                <option value="exit">
                  Saída
                </option>

                <option value="adjustment">
                  Ajuste
                </option>
              </select>
            </label>

            <FormField
              label="Quantidade"
              type="number"
              value={movementForm.quantity}
              onChange={(value) => (
                updateMovementForm(
                  "quantity",
                  value
                )
              )}
              required
              step="1"
            />

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Fornecedor
              </span>

              <select
                value={movementForm.supplier_id}
                onChange={(event) => (
                  updateMovementForm(
                    "supplier_id",
                    event.target.value
                  )
                )}
                className={inputClass}
              >
                <option value="">
                  Não informado
                </option>

                {suppliers.map(
                  (supplier) => (
                    <option
                      key={supplier.id}
                      value={supplier.id}
                    >
                      {supplierDisplayName(
                        supplier
                      )}
                    </option>
                  )
                )}
              </select>
            </label>

            <FormField
              label="Custo unitário"
              type="number"
              value={movementForm.unit_cost}
              onChange={(value) => (
                updateMovementForm(
                  "unit_cost",
                  value
                )
              )}
              min="0"
              step="0.01"
            />

            <FormField
              label="Referência"
              value={movementForm.reference}
              onChange={(value) => (
                updateMovementForm(
                  "reference",
                  value
                )
              )}
              maxLength={120}
              placeholder="NF, venda, pedido..."
            />

            <FormField
              label="Motivo"
              value={movementForm.reason}
              onChange={(value) => (
                updateMovementForm(
                  "reason",
                  value
                )
              )}
              required
              minLength={2}
              maxLength={255}
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-400">
            <p>
              <strong className="text-white">
                Entrada:
              </strong>
              {" "}
              quantidade positiva aumenta o saldo.
            </p>

            <p className="mt-2">
              <strong className="text-white">
                Saída:
              </strong>
              {" "}
              quantidade positiva reduz o saldo.
            </p>

            <p className="mt-2">
              <strong className="text-white">
                Ajuste:
              </strong>
              {" "}
              use valor positivo para acréscimo e
              negativo para redução.
            </p>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
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
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="mt-7 rounded-3xl border border-dashed border-white/15 bg-neutral-900/60 p-10 text-center">
      <Icon
        size={44}
        className="mx-auto text-neutral-600"
      />

      <h2 className="mt-4 text-xl font-bold">
        {title}
      </h2>

      <p className="mt-2 text-neutral-500">
        {description}
      </p>
    </div>
  );
}

function FormField({
  label,
  type = "text",
  value,
  onChange,
  required = false,
  disabled = false,
  ...props
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-neutral-200">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => (
          onChange(event.target.value)
        )}
        className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
        required={required}
        disabled={disabled}
        {...props}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  ...props
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-neutral-200">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) => (
          onChange(event.target.value)
        )}
        className={`${inputClass} min-h-28 resize-y`}
        {...props}
      />
    </label>
  );
}

function ActiveField({
  checked,
  onChange,
  title,
  description,
}) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => (
          onChange(event.target.checked)
        )}
        className="mt-1 h-4 w-4 accent-yellow-400"
      />

      <div>
        <p className="font-semibold">
          {title}
        </p>

        <p className="mt-1 text-sm text-neutral-400">
          {description}
        </p>
      </div>
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
}) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-neutral-200 transition hover:bg-white/5 disabled:opacity-50"
      >
        Cancelar
      </button>

      <button
        type="submit"
        form={formId}
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-black transition hover:opacity-90 disabled:opacity-50"
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
