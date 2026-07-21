import React, { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#home", label: "Início" },
  { href: "#sobre", label: "Sobre" },
  { href: "#cortes", label: "Cortes" },
  { href: "#agendamento", label: "Agendamento" },
  { href: "#galeria", label: "Galeria" },
  { href: "#contato", label: "Contato" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-primary/90 text-white fixed top-0 left-0 w-full z-50 shadow-md border-b border-white/10">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">
        <a
          href="#home"
          className="flex items-center space-x-2"
        >
          <img
            src="/images/logo.png"
            alt="Logo Marcio TopBarber"
            className="h-12 w-auto object-contain rounded-full"
          />

          <span className="text-xl font-semibold tracking-wide">
            Marcio TopBarber
          </span>
        </a>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="md:hidden text-white focus:outline-none"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          {open ? <X /> : <Menu />}
        </button>

        <nav
          className="hidden md:flex space-x-6 text-sm font-medium"
          aria-label="Navegação principal"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-accent transition"
            >
              {link.label}
            </a>
          ))}

          <a
            href="#agendamento"
            className="px-4 py-2 rounded-2xl bg-accent text-black font-medium hover:opacity-90 transition"
          >
            Agendar
          </a>

          <a
            href="/entrar"
            className="px-4 py-2 rounded-2xl border border-white/20 text-white font-medium hover:border-accent hover:text-accent transition"
          >
            Entrar
          </a>
        </nav>
      </div>

      {open && (
        <nav
          id="mobile-navigation"
          className="md:hidden bg-primary/95 text-white px-4 pb-4 space-y-2 border-t border-white/10"
          aria-label="Navegação móvel"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block py-2 hover:text-accent"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}

          <a
            href="#agendamento"
            className="block px-4 py-2 rounded-2xl bg-accent text-black text-center font-medium hover:opacity-90 transition"
            onClick={() => setOpen(false)}
          >
            Agendar
          </a>

          <a
            href="/entrar"
            className="block rounded-2xl border border-white/20 px-4 py-2 text-center font-medium text-white transition hover:border-accent hover:text-accent"
            onClick={() => setOpen(false)}
          >
            Entrar
          </a>
        </nav>
      )}
    </header>
  );
}
