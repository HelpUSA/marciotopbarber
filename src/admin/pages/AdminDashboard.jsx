import React from "react";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  KeyRound,
  Package,
  Scissors,
  ShieldCheck,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import {
  useAdminAuth,
} from "../auth/AdminAuthContext";

const modules = [
  {
    name: "Agenda",
    description: "Atendimentos e status.",
    permission: "appointments.manage",
    icon: CalendarDays,
    to: "/admin/agenda",
  },
  {
    name: "Jornadas",
    description: "Horários e bloqueios.",
    permission: "scheduling.manage",
    icon: Clock3,
    to: "/admin/jornadas",
  },
  {
    name: "Clientes",
    description: "Cadastro e relacionamento.",
    permission: "customers.manage",
    icon: UserRound,
    to: "/admin/clientes",
  },
  {
    name: "Catálogo",
    description: "Categorias, serviços e preços.",
    permission: "catalog.manage",
    icon: Scissors,
    to: "/admin/catalogo",
  },
  {
    name: "Usuários",
    description: "Contas, papéis e acessos.",
    permission: "users.manage",
    icon: KeyRound,
    to: "/admin/usuarios",
  },
  {
    name: "Funcionários",
    description: "Equipe e vínculos operacionais.",
    permission: "employees.manage",
    icon: UsersRound,
    to: "/admin/funcionarios",
  },
  {
    name: "Estoque",
    description: "Produtos, fornecedores e movimentações.",
    permission: "inventory.manage",
    icon: Package,
    to: "/admin/estoque",
  },
  {
    name: "Financeiro",
    description: "Contas e fluxo financeiro.",
    permission: "finance.manage",
    icon: WalletCards,
    to: null,
  },
];

export default function AdminDashboard() {
  const {
    user,
    expiresAt,
    hasPermission,
  } = useAdminAuth();

  const expirationLabel = expiresAt
    ? new Intl.DateTimeFormat(
        "pt-BR",
        {
          dateStyle: "short",
          timeStyle: "short",
        }
      ).format(new Date(expiresAt))
    : "Não informada";

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-4 py-2 text-sm font-semibold text-green-300">
            <CheckCircle2 size={17} />
            Sessão ativa
          </span>

          <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
            Olá, {user?.name}
          </h1>

          <p className="mt-2 max-w-2xl text-neutral-400">
            Acesse os módulos liberados para sua
            conta e acompanhe a operação da
            barbearia.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-900 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Sessão válida até
          </p>

          <p className="mt-1 font-semibold text-white">
            {expirationLabel}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) => {
          const Icon = module.icon;

          const allowed = hasPermission(
            module.permission
          );

          return (
            <article
              key={module.permission}
              className="flex flex-col rounded-2xl border border-white/10 bg-neutral-900 p-5 shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-xl bg-white/5 p-3 text-accent">
                  <Icon size={23} />
                </div>

                <span
                  className={
                    allowed
                      ? "rounded-full bg-green-400/10 px-3 py-1 text-xs font-semibold text-green-300"
                      : "rounded-full bg-neutral-800 px-3 py-1 text-xs font-semibold text-neutral-500"
                  }
                >
                  {allowed
                    ? "Acesso liberado"
                    : "Sem permissão"}
                </span>
              </div>

              <h2 className="mt-5 text-lg font-bold">
                {module.name}
              </h2>

              <p className="mt-1 text-sm text-neutral-400">
                {module.description}
              </p>

              <p className="mt-4 font-mono text-xs text-neutral-600">
                {module.permission}
              </p>

              <div className="mt-auto pt-5">
                {allowed && module.to ? (
                  <Link
                    to={module.to}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-yellow-200"
                  >
                    Acessar módulo
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <p className="text-xs text-neutral-600">
                    {allowed
                      ? "Módulo em implementação."
                      : "Acesso não autorizado."}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck
              size={23}
              className="text-accent"
            />

            <h2 className="text-xl font-bold">
              Papéis da conta
            </h2>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {user?.roles?.length > 0 ? (
              user.roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-neutral-200"
                >
                  {role}
                </span>
              ))
            ) : (
              <p className="text-sm text-neutral-500">
                Nenhum papel atribuído.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
          <div className="flex items-center gap-3">
            <KeyRound
              size={23}
              className="text-accent"
            />

            <h2 className="text-xl font-bold">
              Permissões efetivas
            </h2>
          </div>

          <div className="mt-5 max-h-64 space-y-2 overflow-auto pr-2">
            {user?.permissions?.length > 0 ? (
              user.permissions.map(
                (permission) => (
                  <div
                    key={permission}
                    className="rounded-xl bg-black/20 px-4 py-2.5 font-mono text-sm text-neutral-300"
                  >
                    {permission}
                  </div>
                )
              )
            ) : (
              <p className="text-sm text-neutral-500">
                Nenhuma permissão atribuída.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
