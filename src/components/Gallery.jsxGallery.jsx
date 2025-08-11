// FILE: src/components/Gallery.jsx
import React from "react";

const Gallery = () => {
  const imagens = [
    "/images/foto1.jpg",
    "/images/foto2.jpg",
    "/images/foto3.jpg",
  ];

  return (
    <section id="galeria" className="py-16 bg-white text-center">
      <h2 className="text-3xl font-bold mb-8">Galeria</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {imagens.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Imagem ${i + 1}`}
            className="rounded-lg shadow-lg"
          />
        ))}
      </div>
    </section>
  );
};

export default Gallery;
