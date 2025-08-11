// FILE: src/App.jsx
// Nome do arquivo: src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Cortes from "./components/Cortes";
import Gallery from "./components/Gallery";
import Pricing from "./components/Pricing";
import Footer from "./components/Footer";
import WhatsAppFloat from "./components/WhatsAppFloat";

function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <Cortes />
      <Pricing />
      <Gallery />
    </>
  );
}

function PrecosPage() { return <><Pricing /></>; }
function GaleriaPage() { return <><Gallery /></>; }

function NotFound() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center text-center p-10">
      <div>
        <h1 className="text-3xl font-bold">Página não encontrada</h1>
        <p className="text-neutral-400 mt-2">Verifique o endereço ou volte para a página inicial.</p>
        <a href="/" className="inline-block mt-6 px-5 py-3 rounded-2xl bg-accent text-black font-semibold">Voltar ao início</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/precos" element={<PrecosPage />} />
            <Route path="/galeria" element={<GaleriaPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <WhatsAppFloat />
      </div>
    </Router>
  );
}
