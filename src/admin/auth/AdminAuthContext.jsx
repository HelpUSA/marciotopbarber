import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiRequest } from "../../services/api";
import { adminRequest } from "../../services/adminApi";

const STORAGE_KEY = "marcio-topbarber-admin-session";

const AdminAuthContext = createContext(null);

function readStoredSession() {
  try {
    const rawValue = sessionStorage.getItem(
      STORAGE_KEY
    );

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);

    if (
      !parsed?.token ||
      !parsed?.expiresAt
    ) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const expiresAt = new Date(
      parsed.expiresAt
    ).getTime();

    if (
      !Number.isFinite(expiresAt) ||
      expiresAt <= Date.now()
    ) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      token: parsed.token,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function writeStoredSession(session) {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(session)
  );
}

export function AdminAuthProvider({
  children,
}) {
  const [session, setSession] = useState(
    () => readStoredSession()
  );

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(
    Boolean(session)
  );

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setUser(null);
    setLoading(false);
  }, []);

  const refreshUser = useCallback(
    async (token = session?.token) => {
      if (!token) {
        clearSession();
        return null;
      }

      try {
        const currentUser = await adminRequest(
          "/api/v1/auth/me",
          token
        );

        setUser(currentUser);
        return currentUser;
      } catch (error) {
        if (error.status === 401) {
          clearSession();
        }

        throw error;
      }
    },
    [
      clearSession,
      session?.token,
    ]
  );

  useEffect(() => {
    if (!session?.token) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    async function restoreSession() {
      setLoading(true);

      try {
        const currentUser = await adminRequest(
          "/api/v1/auth/me",
          session.token
        );

        if (active) {
          setUser(currentUser);
        }
      } catch {
        if (active) {
          clearSession();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, [
    clearSession,
    session?.token,
  ]);

  const login = useCallback(
    async (email, password) => {
      setLoading(true);

      try {
        const response = await apiRequest(
          "/api/v1/auth/login",
          {
            method: "POST",
            body: JSON.stringify({
              email,
              password,
            }),
          }
        );

        const nextSession = {
          token: response.access_token,
          expiresAt: response.expires_at,
        };

        writeStoredSession(nextSession);
        setSession(nextSession);
        setUser(response.user);

        return response.user;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    const token = session?.token;

    try {
      if (token) {
        await adminRequest(
          "/api/v1/auth/logout",
          token,
          {
            method: "POST",
          }
        );
      }
    } catch {
      // A sessão local deve ser encerrada mesmo
      // quando o backend já a revogou ou expirou.
    } finally {
      clearSession();
    }
  }, [
    clearSession,
    session?.token,
  ]);

  const request = useCallback(
    async (path, options = {}) => {
      try {
        return await adminRequest(
          path,
          session?.token,
          options
        );
      } catch (error) {
        if (error.status === 401) {
          clearSession();
        }

        throw error;
      }
    },
    [
      clearSession,
      session?.token,
    ]
  );

  const hasPermission = useCallback(
    (permissionCode) => (
      user?.permissions?.includes(
        permissionCode
      ) || false
    ),
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      token: session?.token || null,
      expiresAt: session?.expiresAt || null,
      loading,
      isAuthenticated: Boolean(
        user && session?.token
      ),
      login,
      logout,
      request,
      refreshUser,
      hasPermission,
    }),
    [
      user,
      session?.token,
      session?.expiresAt,
      loading,
      login,
      logout,
      request,
      refreshUser,
      hasPermission,
    ]
  );

  return (
    <AdminAuthContext.Provider
      value={value}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(
    AdminAuthContext
  );

  if (!context) {
    throw new Error(
      "useAdminAuth deve ser usado dentro de AdminAuthProvider."
    );
  }

  return context;
}
