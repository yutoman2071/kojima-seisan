'use client';

import { useState } from 'react';
import { Menu, Factory } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header bar */}
        <header className="md:hidden bg-blue-900 text-white flex items-center gap-3 px-4 h-14 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-1 rounded-lg hover:bg-blue-800 transition-colors"
            aria-label="メニューを開く"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Factory className="w-5 h-5 text-blue-300" />
          <div>
            <p className="text-xs text-blue-300 leading-none">こじま</p>
            <p className="text-sm font-bold leading-tight">生産管理システム</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
