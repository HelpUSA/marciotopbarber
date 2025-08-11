// FILE: src/components/Sobre.jsx
import React from 'react';

export default function Sobre() {
  return (
    <section id="sobre" className="py-16 px-6 bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-semibold mb-6">Sobre o Barbeiro</h2>
        <p className="text-neutral-300 text-lg">
          Marcio TopBarber é barbeiro especializado em cortes masculinos, barba, pigmentação e design em João Pessoa e região.
          Com atendimento personalizado, técnicas modernas e foco total na satisfação do cliente, ele oferece uma experiência de alto nível.
        </p>
        <p className="mt-4 text-neutral-400">
          Aqui você encontra um ambiente acolhedor, serviços de qualidade e todo o cuidado para que cada cliente saia confiante e satisfeito.
        </p>
      </div>
    </section>
  );
}