// FILE: src/App.jsx
// Nome do arquivo: src/App.jsx
import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import Header from "./components/Header";
import Hero from "./components/Hero";
import Sobre from "./components/Sobre";
import Diferenciais from "./components/Diferenciais";
import Cortes from "./components/Cortes";
import Pricing from "./components/Pricing";
import Gallery from "./components/Gallery";
import Contato from "./components/Contato";
import Footer from "./components/Footer";
import WhatsappIcon from "./components/WhatsappIcon";

function HomePage() {
  return (
    <>
      <Hero />
      <Sobre />
      <Diferenciais />
      <Cortes />
      <Pricing />
      <Gallery />
      <Contato />
    </>
  );
}

function NotFound() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center text-center p-10">
      <div>
        <h1 className="text-3xl font-bold">Página não encontrada</h1>
        <p className="text-neutral-400 mt-2">
          Verifique o endereço ou volte para a página inicial.
        </p>
        <a
          href="/"
          className="inline-block mt-6 px-5 py-3 rounded-2xl bg-accent text-black font-semibold"
        >
          Voltar ao início
        </a>
      </div>
    </div>
  );
}

const router = createBrowserRouter(
  [
    { path: "/", element: <HomePage /> },
    { path: "*", element: <NotFound /> },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <RouterProvider router={router} />
      </main>
      <Footer />
      <WhatsappIcon />
    </div>
  );
}
