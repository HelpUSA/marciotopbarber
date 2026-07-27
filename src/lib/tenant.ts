export const TENANT_STORAGE_KEY =
  "marciotopbarber.selectedBarbershopId";

const GLOBAL_API_PREFIXES = [
  "/api/v1/auth",
  "/api/v1/platform",
  "/api/v1/public/barbershops",
  "/api/v1/barbershops",
  "/api/v1/users",
  "/api/v1/roles",
  "/api/v1/permissions",
  "/api/v1/access",
  "/api/v1/health",
];

let installed = false;

export function getSelectedBarbershopId(): string | null {
  return window.localStorage.getItem(TENANT_STORAGE_KEY);
}

export function setSelectedBarbershopId(value: string): void {
  window.localStorage.setItem(TENANT_STORAGE_KEY, value);
}

function isCommercialPath(pathname: string): boolean {
  if (!pathname.startsWith("/api/v1/")) {
    return false;
  }
  return !GLOBAL_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function installTenantFetch(): void {
  if (installed) {
    return;
  }
  installed = true;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const rawUrl = input instanceof Request ? input.url : input.toString();
    const url = new URL(rawUrl, window.location.origin);
    if (!isCommercialPath(url.pathname)) {
      return nativeFetch(input, init);
    }
    const tenantId = getSelectedBarbershopId();
    if (!tenantId) {
      return nativeFetch(input, init);
    }
    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    headers.set("X-Barbershop-ID", tenantId);
    return nativeFetch(input, { ...init, headers });
  }) as typeof window.fetch;
}
