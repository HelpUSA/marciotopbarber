import React, {
  useEffect,
  useState,
} from "react";

import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAdminAuth,
} from "../auth/AdminAuthContext";

const navigation = [
  {
    to: "/admin",
    label: "Visão geral",
    icon: LayoutDashboard,
    end: true,
  },
];

function navigationClass({
  isActive,
}) {
  return [
    "flex items-center gap-3 rounded-xl px-4 py-3",
    "text-sm font-semibold transition",
    isActive
      ? "bg-accent text-black"
      : (
        "text-neutral-300 " +
        "hover:bg-white/5 hover:text-white"
      ),
  ].join(" ");
}

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAdminAuth();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await logout();

    navigate(
      "/admin/login",
      { replace: true }
    );
  }

  const Sidebar = () => (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <a
          href="/"
          className="flex items-center gap-3"
        >
          <img
            src="/images/logo.png"
            alt="Marcio TopBarber"
            className="h-11 w-11 rounded-full object-cover"
          />

          <div>
            <p className="font-bold text-white">
              Marcio TopBarber
            </p>

            <p className="text-xs text-neutral-400">
              Painel administrativo
            </p>
          </div>
        </a>
      </div>

      <nav
        className="flex-1 space-y-2 px-4 py-5"
        aria-label="Navegação administrativa"
      >
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={navigationClass}
            >
              <Icon size={19} />
              {item.label}
            </NavLink>
          );
        })}

        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Próximos módulos
          </p>

          <div className="mt-3 space-y-2 px-4 text-sm text-neutral-500">
            <p className="flex items-center gap-2">
              <UsersRound size={16} />
              Usuários e funcionários
            </p>

            <p className="flex items-center gap-2">
              <ShieldCheck size={16} />
              Agenda e operações
            </p>
          </div>
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <a
          href="/"
          className="mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-neutral-300 transition hover:bg-white/5 hover:text-white"
        >
          <ExternalLink size={18} />
          Abrir site público
        </a>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-300 transition hover:bg-red-400/10 hover:text-red-200"
        >
          <LogOut size={18} />
          Encerrar sessão
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-neutral-900 lg:block">
        <Sidebar />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu administrativo"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMenuOpen(false)}
          />

          <aside className="relative h-full w-72 border-r border-white/10 bg-neutral-900 shadow-2xl">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-2 text-neutral-300 hover:bg-white/10 hover:text-white"
            >
              <X size={21} />
            </button>

            <Sidebar />
          </aside>
        </div>
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/90 backdrop-blur">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Abrir menu administrativo"
                onClick={() => setMenuOpen(true)}
                className="rounded-xl border border-white/10 p-2.5 text-white lg:hidden"
              >
                <Menu size={21} />
              </button>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Administração
                </p>

                <p className="font-semibold text-white">
                  Área protegida
                </p>
              </div>
            </div>

            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-semibold text-white">
                {user?.name}
              </p>

              <p className="truncate text-xs text-neutral-400">
                {user?.email}
              </p>
            </div>
          </div>
        </header>

        <main className="px-4 py-7 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
