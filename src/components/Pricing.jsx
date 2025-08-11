// FILE: src/components/Pricing.jsx
import React from "react";

const Pricing = () => {
  return (
    <section id="precos" className="py-16 bg-gray-100 text-center">
      <h2 className="text-3xl font-bold mb-8">Nossos Preços</h2>
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold">Plano Básico</h3>
          <p className="text-gray-500 mt-2">R$ 100</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold">Plano Intermediário</h3>
          <p className="text-gray-500 mt-2">R$ 200</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold">Plano Premium</h3>
          <p className="text-gray-500 mt-2">R$ 300</p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
