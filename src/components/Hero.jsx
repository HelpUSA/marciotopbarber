// FILE: src/components/Hero.jsx
import React from 'react';

export default function Hero() {
  return (
    <section id="home" className="relative h-[70vh] text-white pt-24 overflow-hidden">
      {/* Vídeo de fundo */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/barber-bg.mp4" type="video/mp4" />
        Seu navegador não suporta vídeo em HTML5.
      </video>

      {/* Sobreposição escura */}
      <div className="absolute inset-0 bg-black bg-opacity-60 z-10"></div>

      {/* Conteúdo com imagem e texto */}
      <div className="relative z-20 flex flex-col md:flex-row items-center justify-center h-full px-6">
        {/* Imagem do Márcio em ação */}
        <img
          src="/images/hero-marcio-barber.png"
          alt="Márcio realizando corte de cabelo"
          className="max-h-[400px] md:max-h-[500px] w-auto object-contain drop-shadow-2xl rounded-full border-4 border-accent bg-black/30 p-2"
        />

        {/* Texto ao lado */}
        <div className="md:ml-10 text-center md:text-left mt-6 md:mt-0">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Marcio TopBarber</h1>
          <p className="text-lg md:text-xl max-w-lg text-neutral-200">
            Corte, barba, pigmentação e design com excelência. Agende seu horário e viva a experiência premium.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <a
              href="https://wa.me/5583XXXXXXXXX?text=Quero%20agendar%20um%20hor%C3%A1rio"
              className="px-6 py-3 rounded-2xl bg-accent text-black font-semibold hover:opacity-90 transition"
            >
              Agendar no WhatsApp
            </a>
            <a
              href="#servicos"
              className="px-6 py-3 rounded-2xl border border-white/20 hover:border-accent transition"
            >
              Ver serviços
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}