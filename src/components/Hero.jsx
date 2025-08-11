// FILE: src/components/Hero.jsx
// Nome do arquivo: src/components/Hero.jsx
import React from "react";
import { FaWhatsapp } from "react-icons/fa";

export default function Hero() {
  return (
    <section id="home" className="relative h-[55vh] text-white pt-24 overflow-hidden">
      {/* Vídeo de fundo */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/background.mp4" type="video/mp4" />
        Seu navegador não suporta vídeo em HTML5.
      </video>

      {/* Sobreposição escura + conteúdo */}
      <div className="absolute inset-0 bg-black bg-opacity-60 z-10 flex flex-col items-center justify-center px-6">
        {/* Imagem à frente do vídeo */}
        <img
          src="/images/hero-marcio-barber.png"
          alt="Márcio Barber"
          className="max-h-[200px] mb-6"
        />

        {/* Frase e WhatsApp */}
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Seu estilo começa aqui!
        </h1>
        <a
          href="https://wa.me/558387392265"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-6 py-3 rounded-full font-semibold text-black"
        >
          <FaWhatsapp className="text-2xl" />
          +55 83 8739-2265
        </a>
      </div>
    </section>
  );
}
