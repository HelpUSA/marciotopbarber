import { createRoot as createTenantSelectorRoot } from "react-dom/client";
import TenantSelector from "./components/TenantSelector";
import { installTenantFetch } from "./lib/tenant";
// FILE: src/main.jsx
// Nome do arquivo: src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css"; // ✅ caminho corrigido

installTenantFetch();

const tenantSelectorHost =
  document.createElement("div");

tenantSelectorHost.id =
  "marciotopbarber-tenant-selector-host";

document.body.appendChild(
  tenantSelectorHost,
);

createTenantSelectorRoot(
  tenantSelectorHost,
).render(
  <TenantSelector />,
);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
