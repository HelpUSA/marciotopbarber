import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeDollarSign,
  CheckCircle2,
  Clock3,
  Layers3,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Scissors,
  Search,
  ShieldAlert,
  Tags,
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

function blankCategoryForm() {
  return {
    name: "",
    slug: "",
    description: "",
    active: true,
    position: "0",
  };
}

function blankServiceForm() {
  return {
    category_id: "",
    name: "",
    slug: "",
    description: "",
    duration_minutes: "45",
    price: "0.00",
    position: "0",
    active: true,
  };
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

function centsToInput(priceCents) {
  return (
    (priceCents || 0) / 100
  ).toFixed(2);
}

export default function AdminCatalog() {
  const {
    request,
    hasPermission,
  } = useAdminAuth();

  const [categories, setCategories] =
    useState([]);

  const [services, setServices] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("services");

  const [search, setSearch] =
    useState("");

  const [activeFilter, setActiveFilter] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("");

  const [modalMode, setModalMode] =
    useState(null);

  const [
    editingCategory,
    setEditingCategory,
  ] = useState(null);

  const [
    editingService,
    setEditingService,
  ] = useState(null);

  const [
    categoryForm,
    setCategoryForm,
  ] = useState(blankCategoryForm);

  const [
    serviceForm,
    setServiceForm,
  ] = useState(blankServiceForm);

  const canManage = hasPermission(
    "catalog.manage"
  );

  const loadCatalog =
    useCallback(async () => {
      if (!canManage) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [
          categoriesResponse,
          servicesResponse,
        ] = await Promise.all([
          request(
            "/api/v1/admin/service-categories"
          ),
          request(
            "/api/v1/admin/services"
          ),
        ]);

        setCategories(categoriesResponse);
        setServices(servicesResponse);
      } catch (requestError) {
        setError(
          requestError.message ||
          "Não foi possível carregar o catálogo."
        );
      } finally {
        setLoading(false);
      }
    }, [
      canManage,
      request,
    ]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const filteredCategories = useMemo(
    () => {
      const term = search
        .trim()
        .toLowerCase();

      return categories.filter(
        (category) => {
          const matchesActive =
            activeFilter === "" ||
            String(category.active) ===
              activeFilter;

          const matchesSearch =
            !term ||
            [
              category.name,
              category.slug,
              category.description,
            ].some((value) => (
              value
                ?.toLowerCase()
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
      categories,
      search,
    ]
  );

  const filteredServices = useMemo(
    () => {
      const term = search
        .trim()
        .toLowerCase();

      return services.filter(
        (service) => {
          const matchesActive =
            activeFilter === "" ||
            String(service.active) ===
              activeFilter;

          const matchesCategory =
            !categoryFilter ||
            service.category_id ===
              categoryFilter;

          const matchesSearch =
            !term ||
            [
              service.name,
              service.slug,
              service.description,
              service.category?.name,
            ].some((value) => (
              value
                ?.toLowerCase()
                .includes(term)
            ));

          return (
            matchesActive &&
            matchesCategory &&
            matchesSearch
          );
        }
      );
    },
    [
      activeFilter,
      categoryFilter,
      search,
      services,
    ]
  );

  function openCreateCategory() {
    setEditingCategory(null);
    setCategoryForm(
      blankCategoryForm()
    );
    setError("");
    setSuccess("");
    setModalMode("category");
  }

  function openEditCategory(category) {
    setEditingCategory(category);

    setCategoryForm({
      name: category.name || "",
      slug: category.slug || "",
      description:
        category.description || "",
      active: Boolean(category.active),
      position: String(
        category.position || 0
      ),
    });

    setError("");
    setSuccess("");
    setModalMode("category");
  }

  function openCreateService() {
    setEditingService(null);

    setServiceForm({
      ...blankServiceForm(),
      category_id:
        categoryFilter ||
        categories.find(
          (category) => category.active
        )?.id ||
        "",
    });

    setError("");
    setSuccess("");
    setModalMode("service");
  }

  function openEditService(service) {
    setEditingService(service);

    setServiceForm({
      category_id:
        service.category_id || "",
      name: service.name || "",
      slug: service.slug || "",
      description:
        service.description || "",
      duration_minutes: String(
        service.duration_minutes || 45
      ),
      price: centsToInput(
        service.price_cents
      ),
      position: String(
        service.position || 0
      ),
      active: Boolean(service.active),
    });

    setError("");
    setSuccess("");
    setModalMode("service");
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalMode(null);
    setEditingCategory(null);
    setEditingService(null);
    setCategoryForm(
      blankCategoryForm()
    );
    setServiceForm(
      blankServiceForm()
    );
    setError("");
  }

  function updateCategoryForm(
    field,
    value
  ) {
    setCategoryForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateServiceForm(
    field,
    value
  ) {
    setServiceForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submitCategory(event) {
    event.preventDefault();

    const position = Number(
      categoryForm.position
    );

    if (
      !Number.isInteger(position) ||
      position < 0
    ) {
      setError(
        "A posição deve ser um número inteiro positivo."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      name: categoryForm.name.trim(),
      slug:
        categoryForm.slug.trim() ||
        null,
      description:
        categoryForm.description.trim() ||
        null,
      active: categoryForm.active,
      position,
    };

    try {
      const endpoint = editingCategory
        ? (
          "/api/v1/admin/service-categories/" +
          editingCategory.id
        )
        : "/api/v1/admin/service-categories";

      await request(
        endpoint,
        {
          method: editingCategory
            ? "PATCH"
            : "POST",
          body: JSON.stringify(payload),
        }
      );

      setModalMode(null);
      setEditingCategory(null);
      setCategoryForm(
        blankCategoryForm()
      );

      setSuccess(
        editingCategory
          ? "Categoria atualizada com sucesso."
          : "Categoria criada com sucesso."
      );

      await loadCatalog();
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível salvar a categoria."
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitService(event) {
    event.preventDefault();

    const durationMinutes = Number(
      serviceForm.duration_minutes
    );

    const price = Number(
      String(serviceForm.price).replace(
        ",",
        "."
      )
    );

    const position = Number(
      serviceForm.position
    );

    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 5 ||
      durationMinutes > 480
    ) {
      setError(
        "A duração deve ser um número inteiro entre 5 e 480 minutos."
      );
      return;
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError(
        "Informe um preço válido."
      );
      return;
    }

    if (
      !Number.isInteger(position) ||
      position < 0
    ) {
      setError(
        "A posição deve ser um número inteiro positivo."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      category_id:
        serviceForm.category_id ||
        null,
      name: serviceForm.name.trim(),
      slug:
        serviceForm.slug.trim() ||
        null,
      description:
        serviceForm.description.trim() ||
        null,
      duration_minutes:
        durationMinutes,
      price_cents: Math.round(
        price * 100
      ),
      position,
      active: serviceForm.active,
    };

    try {
      const endpoint = editingService
        ? (
          "/api/v1/admin/services/" +
          editingService.id
        )
        : "/api/v1/admin/services";

      await request(
        endpoint,
        {
          method: editingService
            ? "PATCH"
            : "POST",
          body: JSON.stringify(payload),
        }
      );

      setModalMode(null);
      setEditingService(null);
      setServiceForm(
        blankServiceForm()
      );

      setSuccess(
        editingService
          ? "Serviço atualizado com sucesso."
          : "Serviço criado com sucesso."
      );

      await loadCatalog();
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível salvar o serviço."
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
          Catálogo indisponível
        </h1>

        <p className="mt-3 text-neutral-300">
          Sua conta não possui a permissão
          <span className="mx-1 font-mono text-red-200">
            catalog.manage
          </span>
          .
        </p>
      </div>
    );
  }

  const currentItems =
    activeTab === "services"
      ? filteredServices
      : filteredCategories;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Catálogo
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Categorias e serviços
          </h1>

          <p className="mt-2 max-w-2xl text-neutral-400">
            Organize o catálogo, preços,
            durações, descrições e a
            disponibilidade pública dos serviços.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={loadCatalog}
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
            onClick={
              activeTab === "services"
                ? openCreateService
                : openCreateCategory
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-black transition hover:opacity-90"
          >
            <Plus size={18} />

            {activeTab === "services"
              ? "Novo serviço"
              : "Nova categoria"}
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

      <div className="mt-7 inline-flex rounded-2xl border border-white/10 bg-neutral-900 p-1.5">
        <button
          type="button"
          onClick={() => {
            setActiveTab("services");
            setSearch("");
          }}
          className={[
            "inline-flex items-center gap-2",
            "rounded-xl px-5 py-3",
            "text-sm font-semibold transition",
            activeTab === "services"
              ? "bg-accent text-black"
              : (
                "text-neutral-400 " +
                "hover:text-white"
              ),
          ].join(" ")}
        >
          <Scissors size={18} />
          Serviços
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("categories");
            setSearch("");
            setCategoryFilter("");
          }}
          className={[
            "inline-flex items-center gap-2",
            "rounded-xl px-5 py-3",
            "text-sm font-semibold transition",
            activeTab === "categories"
              ? "bg-accent text-black"
              : (
                "text-neutral-400 " +
                "hover:text-white"
              ),
          ].join(" ")}
        >
          <Tags size={18} />
          Categorias
        </button>
      </div>

      <section className="mt-5 grid gap-4 rounded-3xl border border-white/10 bg-neutral-900 p-5 md:grid-cols-2 xl:grid-cols-4">
        <label
          className={
            activeTab === "services"
              ? "block xl:col-span-2"
              : "block xl:col-span-3"
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
                activeTab === "services"
                  ? "Nome, slug, descrição ou categoria..."
                  : "Nome, slug ou descrição..."
              }
              className={`${inputClass} pl-11`}
            />
          </div>
        </label>

        {activeTab === "services" && (
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Categoria
            </span>

            <select
              value={categoryFilter}
              onChange={(event) => (
                setCategoryFilter(
                  event.target.value
                )
              )}
              className={inputClass}
            >
              <option value="">
                Todas
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                )
              )}
            </select>
          </label>
        )}

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
            Carregando catálogo...
          </div>
        </div>
      ) : currentItems.length === 0 ? (
        <div className="mt-7 rounded-3xl border border-dashed border-white/15 bg-neutral-900/60 p-10 text-center">
          {activeTab === "services" ? (
            <Scissors
              size={44}
              className="mx-auto text-neutral-600"
            />
          ) : (
            <Layers3
              size={44}
              className="mx-auto text-neutral-600"
            />
          )}

          <h2 className="mt-4 text-xl font-bold">
            Nenhum registro encontrado
          </h2>

          <p className="mt-2 text-neutral-500">
            Ajuste os filtros ou cadastre um
            novo item no catálogo.
          </p>
        </div>
      ) : activeTab === "services" ? (
        <div className="mt-7 grid gap-5 xl:grid-cols-2">
          {filteredServices.map(
            (service) => (
              <article
                key={service.id}
                className="rounded-3xl border border-white/10 bg-neutral-900 p-5 sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="truncate text-xl font-bold">
                        {service.name}
                      </h2>

                      <span
                        className={
                          service.active
                            ? "rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-semibold text-green-200"
                            : "rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-200"
                        }
                      >
                        {service.active
                          ? "Ativo"
                          : "Inativo"}
                      </span>
                    </div>

                    <p className="mt-2 font-mono text-xs text-neutral-600">
                      {service.slug}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => (
                      openEditService(service)
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
                      <BadgeDollarSign size={15} />
                      Preço
                    </p>

                    <p className="mt-2 font-semibold text-neutral-200">
                      {formatPrice(
                        service.price_cents
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      <Clock3 size={15} />
                      Duração
                    </p>

                    <p className="mt-2 text-sm text-neutral-300">
                      {service.duration_minutes}
                      {" minutos"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      <Tags size={15} />
                      Categoria
                    </p>

                    <p className="mt-2 text-sm text-neutral-300">
                      {service.category?.name ||
                        "Sem categoria"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      <Layers3 size={15} />
                      Uso
                    </p>

                    <p className="mt-2 text-sm text-neutral-300">
                      {service.appointment_count}
                      {" "}
                      {service.appointment_count === 1
                        ? "agendamento"
                        : "agendamentos"}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      Posição:
                      {" "}
                      {service.position}
                    </p>
                  </div>
                </div>

                {service.description && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Descrição
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
                      {service.description}
                    </p>
                  </div>
                )}
              </article>
            )
          )}
        </div>
      ) : (
        <div className="mt-7 grid gap-5 xl:grid-cols-2">
          {filteredCategories.map(
            (category) => {
              const serviceCount =
                services.filter(
                  (service) => (
                    service.category_id ===
                    category.id
                  )
                ).length;

              return (
                <article
                  key={category.id}
                  className="rounded-3xl border border-white/10 bg-neutral-900 p-5 sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="truncate text-xl font-bold">
                          {category.name}
                        </h2>

                        <span
                          className={
                            category.active
                              ? "rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-semibold text-green-200"
                              : "rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-200"
                          }
                        >
                          {category.active
                            ? "Ativa"
                            : "Inativa"}
                        </span>
                      </div>

                      <p className="mt-2 font-mono text-xs text-neutral-600">
                        {category.slug}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => (
                        openEditCategory(category)
                      )}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-accent hover:text-accent"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-black/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Serviços vinculados
                      </p>

                      <p className="mt-2 text-sm text-neutral-300">
                        {serviceCount}
                        {" "}
                        {serviceCount === 1
                          ? "serviço"
                          : "serviços"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Posição
                      </p>

                      <p className="mt-2 text-sm text-neutral-300">
                        {category.position}
                      </p>
                    </div>
                  </div>

                  {category.description && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Descrição
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-300">
                        {category.description}
                      </p>
                    </div>
                  )}
                </article>
              );
            }
          )}
        </div>
      )}

      <AdminModal
        open={modalMode === "category"}
        title={
          editingCategory
            ? "Editar categoria"
            : "Nova categoria"
        }
        description="Organize os serviços em grupos do catálogo."
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
              form="category-form"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {saving && (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              )}

              {editingCategory
                ? "Salvar alterações"
                : "Criar categoria"}
            </button>
          </div>
        }
      >
        {error && modalMode === "category" && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            <XCircle size={19} />
            {error}
          </div>
        )}

        <form
          id="category-form"
          onSubmit={submitCategory}
          className="space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Nome
              </span>

              <input
                type="text"
                value={categoryForm.name}
                onChange={(event) => (
                  updateCategoryForm(
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
                Slug
              </span>

              <input
                type="text"
                value={categoryForm.slug}
                onChange={(event) => (
                  updateCategoryForm(
                    "slug",
                    event.target.value
                  )
                )}
                className={inputClass}
                maxLength={120}
                placeholder="Gerado automaticamente"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Posição
              </span>

              <input
                type="number"
                value={categoryForm.position}
                onChange={(event) => (
                  updateCategoryForm(
                    "position",
                    event.target.value
                  )
                )}
                className={inputClass}
                min="0"
                step="1"
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-neutral-200">
              Descrição
            </span>

            <textarea
              value={categoryForm.description}
              onChange={(event) => (
                updateCategoryForm(
                  "description",
                  event.target.value
                )
              )}
              className={`${inputClass} min-h-28 resize-y`}
              maxLength={2000}
            />
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <input
              type="checkbox"
              checked={categoryForm.active}
              onChange={(event) => (
                updateCategoryForm(
                  "active",
                  event.target.checked
                )
              )}
              className="mt-1 h-4 w-4 accent-yellow-400"
            />

            <div>
              <p className="font-semibold">
                Categoria ativa
              </p>

              <p className="mt-1 text-sm text-neutral-400">
                Categorias inativas continuam
                preservadas para organização e
                histórico.
              </p>
            </div>
          </label>
        </form>
      </AdminModal>

      <AdminModal
        open={modalMode === "service"}
        title={
          editingService
            ? "Editar serviço"
            : "Novo serviço"
        }
        description="Configure preço, duração, categoria e exibição pública."
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
              form="service-form"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {saving && (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              )}

              {editingService
                ? "Salvar alterações"
                : "Criar serviço"}
            </button>
          </div>
        }
      >
        {error && modalMode === "service" && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            <XCircle size={19} />
            {error}
          </div>
        )}

        <form
          id="service-form"
          onSubmit={submitService}
          className="space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Nome
              </span>

              <input
                type="text"
                value={serviceForm.name}
                onChange={(event) => (
                  updateServiceForm(
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
                Slug
              </span>

              <input
                type="text"
                value={serviceForm.slug}
                onChange={(event) => (
                  updateServiceForm(
                    "slug",
                    event.target.value
                  )
                )}
                className={inputClass}
                maxLength={120}
                placeholder="Gerado automaticamente"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Categoria
              </span>

              <select
                value={serviceForm.category_id}
                onChange={(event) => (
                  updateServiceForm(
                    "category_id",
                    event.target.value
                  )
                )}
                className={inputClass}
              >
                <option value="">
                  Sem categoria
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Preço
              </span>

              <input
                type="number"
                value={serviceForm.price}
                onChange={(event) => (
                  updateServiceForm(
                    "price",
                    event.target.value
                  )
                )}
                className={inputClass}
                min="0"
                step="0.01"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Duração em minutos
              </span>

              <input
                type="number"
                value={
                  serviceForm.duration_minutes
                }
                onChange={(event) => (
                  updateServiceForm(
                    "duration_minutes",
                    event.target.value
                  )
                )}
                className={inputClass}
                min="5"
                max="480"
                step="1"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-200">
                Posição
              </span>

              <input
                type="number"
                value={serviceForm.position}
                onChange={(event) => (
                  updateServiceForm(
                    "position",
                    event.target.value
                  )
                )}
                className={inputClass}
                min="0"
                step="1"
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-neutral-200">
              Descrição
            </span>

            <textarea
              value={serviceForm.description}
              onChange={(event) => (
                updateServiceForm(
                  "description",
                  event.target.value
                )
              )}
              className={`${inputClass} min-h-28 resize-y`}
              maxLength={2000}
            />
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <input
              type="checkbox"
              checked={serviceForm.active}
              onChange={(event) => (
                updateServiceForm(
                  "active",
                  event.target.checked
                )
              )}
              className="mt-1 h-4 w-4 accent-yellow-400"
            />

            <div>
              <p className="font-semibold">
                Serviço ativo
              </p>

              <p className="mt-1 text-sm text-neutral-400">
                Apenas serviços ativos ficam
                disponíveis no agendamento público.
              </p>
            </div>
          </label>
        </form>
      </AdminModal>
    </div>
  );
}
