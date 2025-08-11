// FILE: src/main.jsx
// Nome do arquivo: src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css"; // ✅ caminho corrigido

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
