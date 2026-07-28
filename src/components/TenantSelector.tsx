import { useEffect, useState } from "react";

import {
  getSelectedBarbershopId,
  setSelectedBarbershopId,
} from "../lib/tenant";

type Barbershop = {
  id: string;
  name: string;
  slug: string;
};

export default function TenantSelector() {
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [selected, setSelected] = useState(
    getSelectedBarbershopId() ?? "",
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/v1/public/barbershops");
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as Barbershop[];
        if (cancelled) {
          return;
        }
        setBarbershops(payload);
        const stored = getSelectedBarbershopId();
        const exists = payload.some((item) => item.id === stored);
        if (!exists && payload.length > 0) {
          const first = payload[0].id;
          setSelectedBarbershopId(first);
          setSelected(first);
          window.setTimeout(() => window.location.reload(), 25);
        }
      } catch {
        setBarbershops([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (barbershops.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 12,
        background: "rgba(23, 23, 23, 0.92)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
        color: "#ffffff",
        fontSize: "0.85rem",
        fontWeight: 600,
      }}
    >
      <label htmlFor="tenant-selector" style={{ color: "#d4d4d4" }}>Barbearia</label>
      <select
        id="tenant-selector"
        value={selected}
        onChange={(event) => {
          const value = event.target.value;
          setSelected(value);
          setSelectedBarbershopId(value);
          window.location.reload();
        }}
        style={{
          background: "#0a0a0a",
          color: "#ffffff",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: 8,
          padding: "4px 8px",
          outline: "none",
          cursor: "pointer",
          fontSize: "0.85rem",
        }}
      >
        {barbershops.map((barbershop) => (
          <option key={barbershop.id} value={barbershop.id} style={{ background: "#171717", color: "#ffffff" }}>
            {barbershop.name}
          </option>
        ))}
      </select>
    </div>
  );
}
