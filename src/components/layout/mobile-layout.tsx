"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Menu, X } from "lucide-react";

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button - Solo visible en móvil */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-3 left-3 z-50 lg:hidden bg-white shadow-lg rounded-lg p-2 hover:bg-gray-100"
      >
        {sidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Sidebar overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Oculto en móvil por defecto */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-40
          lg:static lg:block
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="flex flex-col min-h-screen w-full">
        <Header />
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </>
  );
}
