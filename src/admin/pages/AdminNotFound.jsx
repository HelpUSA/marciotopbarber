import React from "react";

import {
  ArrowLeft,
  FileQuestion,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-lg text-center">
        <FileQuestion
          size={48}
          className="mx-auto text-accent"
        />

        <h1 className="mt-5 text-3xl font-bold">
          Página administrativa não encontrada
        </h1>

        <p className="mt-3 text-neutral-400">
          O endereço acessado não corresponde a
          um módulo disponível do painel.
        </p>

        <Link
          to="/admin"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-semibold text-black transition hover:opacity-90"
        >
          <ArrowLeft size={18} />
          Voltar à visão geral
        </Link>
      </div>
    </div>
  );
}
