// 📄 src/components/Gallery.jsx
import React from "react";

const imagens = [
  "/images/barba01.jpg",
  "/images/corte-infantil01.jpg",
  "/images/corte-masculino01.jpg",
  "/images/corte-masculino02.jpg",
  "/images/corte-masculino03.jpg",
  "/images/curto-feminito01.jpg",
  "/images/curto-feminito02.jpg",
  "/images/curto-feminito03.jpg"
];

export default function Galeria() {
  return (
    <section id="galeria" className="py-16 bg-black text-white scroll-mt-24">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-10 text-center">
          Galeria
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {imagens.map((src, index) => (
            <div
              key={index}
              className="group overflow-hidden rounded-lg shadow-lg border border-gray-700"
            >
              <img
                src={src}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500 ease-out"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
