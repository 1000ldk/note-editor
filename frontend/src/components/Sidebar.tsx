"use client";

import React from 'react';
import { Home, Edit3, PenTool, Network, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { id: 'home', path: '/', label: 'Home', icon: Home },
    { id: 'memos', path: '/memos', label: 'Memos', icon: Edit3 },
    { id: 'topics', path: '/topics', label: 'Topics', icon: PenTool },
    { id: 'canvas', path: '/canvas', label: 'Canvas', icon: Network },
  ];

  const handleNewEntry = () => {
    router.push('/memos/new');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-outline-variant/10 h-screen sticky top-0 p-6 font-sans">
      <div className="mb-10">
        <h1 className="text-xl font-bold text-on-surface mb-1">NoteIdeaMapper</h1>
        <p className="text-xs text-on-surface-variant opacity-70">Editorial Zen Workspace</p>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));
          return (
            <Link
              key={item.id}
              href={item.path}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium",
                isActive 
                  ? "text-primary bg-white shadow-sm" 
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-outline-variant/20">
        <button 
          onClick={handleNewEntry}
          className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-3 rounded-full font-semibold text-sm shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          New Memo
        </button>
      </div>
    </aside>
  );
}