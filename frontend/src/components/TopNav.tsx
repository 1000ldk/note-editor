import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface TopNavProps {
  title: string;
  onSave: () => void;
  onPublish: () => void;
  showBack?: boolean;
}

export function TopNav({ title, onSave, onPublish, showBack = false }: TopNavProps) {
  return (
    <header className="flex justify-between items-center w-full px-8 h-16 bg-surface/80 backdrop-blur-md sticky top-0 z-30 border-b border-outline-variant/5 font-sans">
      <div className="flex items-center gap-4">
        {showBack && (
          <Link href="/" className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-800 transition mr-2">
            <ArrowLeft size={16} className="mr-1" /> 戻る
          </Link>
        )}
        <span className="text-lg font-bold tracking-tight text-on-surface">Editor</span>
        <span className="h-4 w-[1px] bg-outline-variant/30"></span>
        <span className="text-sm text-on-surface-variant font-normal">{title || '無題のメモ'}</span>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onSave}
          className="text-on-surface-variant hover:text-primary transition-all px-4 py-2 text-sm font-medium"
        >
          下書き保存
        </button>
        <button 
          onClick={onPublish}
          className="bg-gradient-to-br from-primary to-primary-container text-white px-6 py-2 rounded-full text-sm font-semibold hover:shadow-lg transition-all active:scale-95"
        >
          完了する
        </button>
      </div>
    </header>
  );
}