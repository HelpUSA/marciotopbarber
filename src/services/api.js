const configuredBaseUrl = (
  import.meta.env.VITE_API_URL ||
  "https://backend-production-0d53.up.railway.app/api"
).trim();

const baseUrl = configuredBaseUrl.replace(/\/+$/, "");

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  if (
    baseUrl.endsWith("/api") &&
    normalizedPath.startsWith("/api/")
  ) {
    return `${baseUrl}${normalizedPath.slice(4)}`;
  }

  return `${baseUrl}${normalizedPath}`;
}

export function expectArrayResponse(
  value,
  label = "dados"
) {
  if (Array.isArray(value)) {
    return value;
  }

  for (const key of [
    "items",
    "results",
    "data",
  ]) {
    if (Array.isArray(value?.[key])) {
      return value[key];
    }
  }

  throw new TypeError(
    `A API retornou formato inválido para ${label}.`
  );
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  const normalizedStart = text
    .trimStart()
    .toLowerCase();

  const contentType = (
    response.headers.get("content-type") || ""
  ).toLowerCase();

  if (
    normalizedStart.startsWith("<!doctype html") ||
    normalizedStart.startsWith("<html") ||
    contentType.includes("text/html")
  ) {
    const error = new Error(
      "A API respondeu uma página HTML em vez de JSON."
    );

    error.status = response.status;
    error.data = {
      contentType,
    };

    throw error;
  }

  try {
    return JSON.parse(text);
  } catch {
    if (
      contentType.includes("application/json") ||
      contentType.includes("+json")
    ) {
      const error = new Error(
        "A API retornou JSON inválido."
      );

      error.status = response.status;
      throw error;
    }

    return text;
  }
}

function validationMessage(detail) {
  if (!Array.isArray(detail)) {
    return null;
  }

  const messages = detail
    .map((item) => item?.msg)
    .filter(Boolean);

  return messages.length > 0
    ? messages.join(" ")
    : "Verifique os dados informados.";
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const detail =
      validationMessage(data?.detail) ||
      (typeof data?.detail === "string" ? data.detail : null);

    const error = new Error(
      detail || "Não foi possível concluir a solicitação."
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}
