import React from "react";

import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
} from "react-router-dom";

import Header from "./components/Header";
import Hero from "./components/Hero";
import Sobre from "./components/Sobre";
import Cortes from "./components/Cortes";
import Agendamento from "./components/Agendamento";
import Gallery from "./components/Gallery";
import Contato from "./components/Contato";
import Footer from "./components/Footer";
import WhatsappIcon from "./components/WhatsappIcon";

import {
  AdminAuthProvider,
} from "./admin/auth/AdminAuthContext";

import ProtectedAdminRoute from "./admin/components/ProtectedAdminRoute";
import AdminLayout from "./admin/components/AdminLayout";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminEmployees from "./admin/pages/AdminEmployees";
import AdminNotFound from "./admin/pages/AdminNotFound";

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      <WhatsappIcon
        phone="5583987392265"
        text="Quero agendar um horário"
      />
    </div>
  );
}

function HomePage() {
  return (
    <>
      <Hero />
      <Sobre />
      <Cortes />
      <Agendamento />
      <Gallery />
      <Contato />
    </>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-10 text-center text-white">
      <div>
        <h1 className="text-3xl font-bold">
          Página não encontrada
        </h1>

        <p className="mt-2 text-neutral-400">
          Verifique o endereço ou volte para
          a página inicial.
        </p>

        <a
          href="/"
          className="mt-6 inline-block rounded-2xl bg-accent px-5 py-3 font-semibold text-black"
        >
          Voltar ao início
        </a>
      </div>
    </div>
  );
}

const router = createBrowserRouter(
  [
    {
      element: <PublicLayout />,
      children: [
        {
          path: "/",
          element: <HomePage />,
        },
      ],
    },
    {
      path: "/admin/login",
      element: <AdminLogin />,
    },
    {
      path: "/admin",
      element: <ProtectedAdminRoute />,
      children: [
        {
          element: <AdminLayout />,
          children: [
            {
              index: true,
              element: <AdminDashboard />,
            },
            {
              path: "usuarios",
              element: <AdminUsers />,
            },
            {
              path: "funcionarios",
              element: <AdminEmployees />,
            },
            {
              path: "*",
              element: <AdminNotFound />,
            },
          ],
        },
      ],
    },
    {
      path: "*",
      element: <NotFound />,
    },
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
    <AdminAuthProvider>
      <RouterProvider router={router} />
    </AdminAuthProvider>
  );
}
