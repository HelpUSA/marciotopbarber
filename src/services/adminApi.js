import { apiRequest } from "./api";

export function adminRequest(
  path,
  token,
  options = {}
) {
  if (!token) {
    const error = new Error(
      "Sessão administrativa ausente."
    );

    error.status = 401;
    throw error;
  }

  const normalizedHeaders = new Headers(
    options.headers || {}
  );

  normalizedHeaders.set(
    "Authorization",
    `Bearer ${token}`
  );

  const headers = Object.fromEntries(
    normalizedHeaders.entries()
  );

  return apiRequest(path, {
    ...options,
    headers,
  });
}
