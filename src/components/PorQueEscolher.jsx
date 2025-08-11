// src/components/PorQueEscolher.jsx
export default function PorQueEscolher() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6 text-center">
          Por que escolher o <span className="text-yellow-600">Marcio TopBarber</span>?
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="text-gray-900 font-semibold">Atendimento personalizado</h3>
            <p className="text-gray-600 mt-1">Horários flexíveis e foco total em você.</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="text-gray-900 font-semibold">Técnicas modernas</h3>
            <p className="text-gray-600 mt-1">Fade, navalha, tesoura e pigmentação com precisão.</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="text-gray-900 font-semibold">Higiene e segurança</h3>
            <p className="text-gray-600 mt-1">Ferramentas esterilizadas e ambiente impecável.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
