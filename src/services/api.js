const configuredBaseUrl = (
  import.meta.env.VITE_API_URL || "/api"
).trim();

const baseUrl = configuredBaseUrl.replace(/\/+$/, "");

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
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