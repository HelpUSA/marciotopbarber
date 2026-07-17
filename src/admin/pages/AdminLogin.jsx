import React, {
  useState,
} from "react";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAdminAuth,
} from "../auth/AdminAuthContext";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const {
    login,
    isAuthenticated,
  } = useAdminAuth();

  if (isAuthenticated) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await login(email, password);

      const requestedPath =
        location.state?.from?.pathname;

      const destination = (
        requestedPath &&
        requestedPath.startsWith("/admin")
      )
        ? requestedPath
        : "/admin";

      navigate(
        destination,
        { replace: true }
      );
    } catch (requestError) {
      setError(
        requestError.message ||
        "Não foi possível autenticar."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 px-4 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.07),transparent_30%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/90 shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden min-h-[620px] flex-col justify-between bg-black/30 p-10 lg:flex">
            <div>
              <a
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-300 transition hover:text-accent"
              >
                <ArrowLeft size={17} />
                Voltar ao site
              </a>

              <div className="mt-16">
                <img
                  src="/images/logo.png"
                  alt="Marcio TopBarber"
                  className="h-24 w-24 rounded-full object-cover shadow-xl"
                />

                <h1 className="mt-7 max-w-md text-4xl font-bold leading-tight">
                  Gestão segura da sua barbearia.
                </h1>

                <p className="mt-4 max-w-md text-lg text-neutral-300">
                  Acesse agenda, equipe, clientes,
                  estoque, financeiro e relatórios
                  em uma única plataforma.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-neutral-400">
              <ShieldCheck
                size={20}
                className="text-accent"
              />

              Sessão protegida por usuário,
              papéis e permissões.
            </div>
          </div>

          <div className="flex min-h-[620px] items-center p-6 sm:p-10">
            <div className="mx-auto w-full max-w-md">
              <a
                href="/"
                className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-neutral-300 transition hover:text-accent lg:hidden"
              >
                <ArrowLeft size={17} />
                Voltar ao site
              </a>

              <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
                <LockKeyhole size={17} />
                Área administrativa
              </span>

              <h2 className="mt-6 text-3xl font-bold">
                Entre na sua conta
              </h2>

              <p className="mt-2 text-neutral-400">
                Use as credenciais administrativas
                provisionadas para sua equipe.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-2xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200"
                >
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="mt-7 space-y-5"
              >
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-neutral-200">
                    E-mail
                  </span>

                  <div className="relative">
                    <Mail
                      size={19}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                    />

                    <input
                      type="email"
                      value={email}
                      onChange={(event) => (
                        setEmail(event.target.value)
                      )}
                      autoComplete="username"
                      placeholder="administrador@empresa.com"
                      className="w-full rounded-xl border border-white/15 bg-black/30 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-neutral-600 focus:border-accent focus:ring-2 focus:ring-accent/20"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-neutral-200">
                    Senha
                  </span>

                  <div className="relative">
                    <LockKeyhole
                      size={19}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                    />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(event) => (
                        setPassword(
                          event.target.value
                        )
                      )}
                      autoComplete="current-password"
                      placeholder="Sua senha"
                      className="w-full rounded-xl border border-white/15 bg-black/30 py-3.5 pl-12 pr-12 text-white outline-none transition placeholder:text-neutral-600 focus:border-accent focus:ring-2 focus:ring-accent/20"
                      required
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? "Ocultar senha"
                          : "Mostrar senha"
                      }
                      onClick={() => (
                        setShowPassword(
                          (current) => !current
                        )
                      )}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 transition hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle
                        className="animate-spin"
                        size={20}
                      />
                      Autenticando...
                    </>
                  ) : (
                    <>
                      <LockKeyhole size={19} />
                      Entrar no painel
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-xs leading-relaxed text-neutral-500">
                A senha nunca é armazenada no navegador.
                Somente o token temporário da sessão fica
                disponível enquanto esta aba permanecer aberta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
