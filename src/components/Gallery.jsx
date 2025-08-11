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
    <section className="py-12 bg-black text-white">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center">Galeria</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {imagens.map((src, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg shadow-lg border border-gray-700"
            >
              <img
                src={src}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
