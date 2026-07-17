import React from "react";

import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LoaderCircle,
  ShieldAlert,
} from "lucide-react";

import {
  useAdminAuth,
} from "../auth/AdminAuthContext";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
      <div
        role="status"
        className="flex items-center gap-3 text-neutral-300"
      >
        <LoaderCircle
          className="animate-spin text-accent"
          size={24}
        />
        Validando sua sessão...
      </div>
    </div>
  );
}

function AccessDenied() {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  async function handleLogout() {
    await logout();
    navigate(
      "/admin/login",
      { replace: true }
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-5 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-neutral-900 p-8 text-center shadow-2xl">
        <ShieldAlert
          size={44}
          className="mx-auto text-red-400"
        />

        <h1 className="mt-5 text-2xl font-bold">
          Acesso administrativo negado
        </h1>

        <p className="mt-3 text-neutral-300">
          Sua conta está autenticada, mas não possui
          a permissão administrativa necessária.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/"
            className="rounded-xl border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-accent hover:text-accent"
          >
            Voltar ao site
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl bg-accent px-5 py-3 font-semibold text-black transition hover:opacity-90"
          >
            Encerrar sessão
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedAdminRoute() {
  const location = useLocation();

  const {
    loading,
    isAuthenticated,
    hasPermission,
  } = useAdminAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  if (!hasPermission("admin.access")) {
    return <AccessDenied />;
  }

  return <Outlet />;
}
