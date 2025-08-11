// FILE: src/components/Sobre.jsx
import React from "react";

export default function Sobre() {
  return (
    <>
      {/* Sobre o Barbeiro */}
      <section id="sobre" className="py-16 px-6 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-6">Sobre o Barbeiro</h2>
          <p className="text-neutral-300 text-lg">
            Marcio TopBarber é barbeiro especializado em cortes masculinos, barba, pigmentação e
            design em João Pessoa e região. Com atendimento personalizado, técnicas modernas e foco
            total na satisfação do cliente, ele oferece uma experiência de alto nível.
          </p>
          <p className="mt-4 text-neutral-400">
            Aqui você encontra um ambiente acolhedor, serviços de qualidade e todo o cuidado para
            que cada cliente saia confiante e satisfeito.
          </p>
        </div>
      </section>

      {/* Por que escolher (AGORA DEPOIS do Sobre) */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center mb-8">
            Por que escolher o <span className="text-yellow-600">Marcio TopBarber</span>?
          </h2>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
              <h3 className="text-gray-900 font-semibold">Atendimento personalizado</h3>
              <p className="text-gray-600 mt-1">
                Horários flexíveis e foco total em você.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
              <h3 className="text-gray-900 font-semibold">Técnicas modernas</h3>
              <p className="text-gray-600 mt-1">
                Fade, navalha, tesoura e pigmentação com precisão.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
              <h3 className="text-gray-900 font-semibold">Higiene e segurança</h3>
              <p className="text-gray-600 mt-1">
                Ferramentas esterilizadas e ambiente impecável.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
