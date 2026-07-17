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

  const headers = new Headers(
    options.headers || {}
  );

  headers.set(
    "Authorization",
    `Bearer ${token}`
  );

  return apiRequest(path, {
    ...options,
    headers,
  });
}
