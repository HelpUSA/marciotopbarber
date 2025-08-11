// FILE: src/components/Cortes.jsx
import React from "react";

const categorias = [
  {
    nome: "Corte Curto Feminino",
    slug: "curto-feminino",
    descricao: "Estilos modernos e práticos, com acabamento impecável.",
    capa: "/images/curto-feminito01.jpg",
    fotos: [
      "/images/curto-feminito01.jpg",
      "/images/curto-feminito02.jpg",
      "/images/curto-feminito03.jpg",
    ],
  },
  {
    nome: "Corte Infantil",
    slug: "infantil",
    descricao: "Atendimento carinhoso para os pequenos, com muito cuidado.",
    capa: "/images/corte-infantil01.jpg",
    fotos: ["/images/corte-infantil01.jpg"],
  },
  {
    nome: "Corte Masculino",
    slug: "masculino",
    descricao: "Clássico ou moderno, na tesoura ou máquina, acabamento na navalha.",
    capa: "/images/corte-masculino01.jpg",
    fotos: [
      "/images/corte-masculino01.jpg",
      "/images/corte-masculino02.jpg",
      "/images/corte-masculino03.jpg",
    ],
  },
  {
    nome: "Barba",
    slug: "barba",
    descricao: "Modelagem completa com toalha quente e skincare.",
    capa: "/images/barba01.jpg",
    fotos: ["/images/barba01.jpg"],
  },
];

export default function Cortes() {
  return (
    <section id="cortes" className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">Tipos de Corte</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categorias.map((c) => (
            <div
              key={c.slug}
              className="rounded-2xl overflow-hidden border border-white/10 bg-neutral-900/40 hover:border-accent transition"
            >
              <div className="aspect-[4/5] w-full overflow-hidden">
                <img src={c.capa} alt={c.nome} className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold">{c.nome}</h3>
                <p className="text-sm text-neutral-300 mt-1">{c.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
