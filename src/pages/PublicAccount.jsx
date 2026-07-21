
import React from "react";

import {
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  Navigate,
} from "react-router-dom";

import {
  useAdminAuth,
} from "../admin/auth/AdminAuthContext";

export default function PublicAccount() {
  const {
    user,
    loading,
    isAuthenticated,
    logout,
  } = useAdminAuth();

  if (loading) {
    return (
      <section className="min-h-[70vh] bg-neutral-950 px-4 pb-16 pt-32 text-white">
        <div className="mx-auto max-w-3xl">
          Validando sua sessão...
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/entrar"
        replace
      />
    );
  }

  const isAdministrator =
    user?.permissions?.includes(
      "admin.access"
    );

  return (
    <section className="min-h-[70vh] bg-neutral-950 px-4 pb-16 pt-32 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-neutral-900 p-7 shadow-2xl sm:p-10">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-accent/10 p-4 text-accent">
            <UserRound size={32} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">
              Minha conta
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              {user?.name}
            </h1>

            <p className="mt-2 text-neutral-400">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck
              size={21}
              className="text-accent"
            />

            <p className="font-semibold">
              Acesso autenticado pelo Google
            </p>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            O portal do cliente será ampliado com
            agendamentos, histórico, fidelidade e
            dados pessoais. Contas administrativas
            acessam o painel conforme suas permissões.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {isAdministrator && (
            <a
              href="/admin"
              className="rounded-xl bg-accent px-5 py-3 font-bold text-black transition hover:opacity-90"
            >
              Abrir painel administrativo
            </a>
          )}

          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-red-300 hover:text-red-200"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </div>
    </section>
  );
}
