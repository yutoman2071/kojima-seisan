'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  BarChart2,
  Settings,
  Factory,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/plans', label: '生産計画入力', icon: ClipboardList },
  { href: '/results', label: '実績記録', icon: CheckSquare },
  { href: '/report', label: '計画実績比較', icon: BarChart2 },
  { href: '/master', label: 'マスタ管理', icon: Settings },
];

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={[
        // Base styles (layout + visual)
        'bg-blue-900 text-white flex flex-col shrink-0',
        // Mobile: fixed overlay drawer, slides in from left
        'fixed inset-y-0 left-0 z-30 w-72',
        'transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: static, always visible, normal width
        'md:relative md:translate-x-0 md:w-56 md:z-auto',
      ].join(' ')}
    >
      {/* Logo + close button */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-blue-700">
        <div className="flex items-center gap-2">
          <Factory className="w-6 h-6 text-blue-300" />
          <div>
            <p className="text-xs text-blue-300 leading-none">こじま</p>
            <p className="text-sm font-bold leading-tight">生産管理システム</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg hover:bg-blue-800 transition-colors"
          aria-label="メニューを閉じる"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3.5 text-sm transition-colors ${
                active
                  ? 'bg-blue-700 text-white font-semibold'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 text-xs text-blue-400 border-t border-blue-700">
        v1.0.0
      </div>
    </aside>
  );
}
