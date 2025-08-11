// FILE: src/components/Contato.jsx
import React, { useState } from "react";

export default function Contato() {
  const [mensagemStatus, setMensagemStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagemStatus("");
    const formData = new FormData(e.target);

    try {
      const response = await fetch("http://localhost:8000/send-email", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setMensagemStatus("Mensagem enviada com sucesso! Verifique seu e-mail.");
        e.target.reset();
      } else {
        setMensagemStatus("Erro ao enviar a mensagem. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro:", error);
      setMensagemStatus("Erro ao conectar com o servidor.");
    }
  };

  return (
    <section id="contato" className="pt-24 pb-12 px-4 bg-neutral-950 text-white">
      <h2 className="text-3xl font-semibold text-center mb-8">Fale com a gente</h2>

      <form className="max-w-xl mx-auto grid gap-4" onSubmit={handleSubmit}>
        <input
          type="text"
          name="nome"
          placeholder="Nome"
          className="border border-white/20 bg-black/20 p-2 rounded"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="border border-white/20 bg-black/20 p-2 rounded"
          required
        />
        <textarea
          name="mensagem"
          placeholder="Mensagem"
          className="border border-white/20 bg-black/20 p-2 rounded"
          rows="4"
          required
        />
        <button
          type="submit"
          className="bg-accent text-black p-2 rounded hover:opacity-90 transition font-semibold"
        >
          Enviar
        </button>
      </form>

      {mensagemStatus && (
        <p className="text-center text-green-400 mt-4">{mensagemStatus}</p>
      )}

      <div className="text-center mt-6 space-y-1">
        <p>
          Ou chame no WhatsApp:{" "}
          <a
            href="https://wa.me/5583987392265"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent font-semibold"
          >
            +55 (83) 98739-2265
          </a>
        </p>
        <p>
          Instagram:{" "}
          <a
            href="https://www.instagram.com/marciotopbarber/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent font-semibold"
          >
            @marciotopbarber
          </a>
        </p>
      </div>
    </section>
  );
}
