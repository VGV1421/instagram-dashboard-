"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Menu, X } from "lucide-react";

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile menu button - Solo visible en móvil */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-3 left-3 z-[60] md:hidden bg-white shadow-lg rounded-lg p-2 hover:bg-gray-100"
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
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Oculto en móvil por defecto, visible en desktop */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-40
          md:static md:z-auto
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden w-full md:w-auto">
        <Header />
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 bg-gray-50 pt-2">
          {children}
        </main>
      </div>
    </div>
  );
}
