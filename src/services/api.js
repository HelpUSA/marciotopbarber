const configuredBaseUrl = (
  import.meta.env.VITE_API_URL || "/api"
).trim();

const baseUrl = configuredBaseUrl.replace(/\/+$/, "");

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
