
import React, {
  useCallback,
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

import GoogleSignInButton from "../../components/GoogleSignInButton";

import {
  useAdminAuth,
} from "../auth/AdminAuthContext";

function destinationForUser(
  user,
  requestedPath,
) {
  const permissions = Array.isArray(
    user?.permissions
  )
    ? user.permissions
    : [];

  const isAdministrator = permissions.includes(
    "admin.access"
  );

  if (
    isAdministrator &&
    requestedPath?.startsWith("/admin")
  ) {
    return requestedPath;
  }

  return isAdministrator
    ? "/admin"
    : "/conta";
}

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [showPasswordLogin, setShowPasswordLogin] =
    useState(true);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const {
    user,
    login,
    loginWithGoogle,
    isAuthenticated,
  } = useAdminAuth();

  const requestedPath =
    location.state?.from?.pathname;

  const completeLogin = useCallback(
    (authenticatedUser) => {
      navigate(
        destinationForUser(
          authenticatedUser,
          requestedPath,
        ),
        { replace: true }
      );
    },
    [
      navigate,
      requestedPath,
    ]
  );

  const handleGoogleCredential = useCallback(
    async (credential) => {
      setError("");
      setSubmitting(true);

      try {
        const authenticatedUser =
          await loginWithGoogle(credential);

        completeLogin(authenticatedUser);
      } catch (requestError) {
        setError(
          requestError.message ||
          "Não foi possível autenticar com o Google."
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      completeLogin,
      loginWithGoogle,
    ]
  );

  if (isAuthenticated) {
    return (
      <Navigate
        to={destinationForUser(
          user,
          requestedPath,
        )}
        replace
      />
    );
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const authenticatedUser = await login(
        email,
        password,
      );

      completeLogin(authenticatedUser);
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
                  Sua conta em uma plataforma segura.
                </h1>

                <p className="mt-4 max-w-md text-lg text-neutral-300">
                  Clientes, operadores, administradores
                  e proprietários acessam somente as
                  áreas permitidas ao seu perfil.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-neutral-400">
              <ShieldCheck
                size={20}
                className="text-accent"
              />
              Identidade Google, sessão da aplicação,
              papéis, permissões e auditoria.
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
                Acesso à plataforma
              </span>

              <h2 className="mt-6 text-3xl font-bold">
                Entrar
              </h2>

              <p className="mt-2 text-neutral-400">
                Continue com sua conta Google.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-2xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200"
                >
                  {error}
                </div>
              )}

              <div className="mt-7">
                <GoogleSignInButton
                  onCredential={
                    handleGoogleCredential
                  }
                  disabled={submitting}
                />
              </div>

              <div className="my-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs uppercase tracking-wider text-neutral-600">
                  acesso legado
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <button
                type="button"
                onClick={() => (
                  setShowPasswordLogin(
                    (current) => !current
                  )
                )}
                className="w-full rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-neutral-300 transition hover:border-accent hover:text-accent"
              >
                {showPasswordLogin
                  ? "Ocultar login por senha"
                  : "Entrar com e-mail e senha"}
              </button>

              {showPasswordLogin && (
                <form
                  onSubmit={handlePasswordSubmit}
                  className="mt-5 space-y-5"
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
                        className="w-full rounded-xl border border-white/15 bg-black/30 py-3.5 pl-12 pr-4 text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
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
                        className="w-full rounded-xl border border-white/15 bg-black/30 py-3.5 pl-12 pr-12 text-white outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
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
                        Entrar com senha
                      </>
                    )}
                  </button>
                </form>
              )}

              <p className="mt-6 text-center text-xs leading-relaxed text-neutral-500">
                O token Google é validado no backend.
                A aplicação cria sua própria sessão
                temporária e revogável.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
