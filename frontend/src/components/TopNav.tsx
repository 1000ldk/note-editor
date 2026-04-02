import React from 'react';

interface TopNavProps {
  title: string;
  onSave: () => void;
  onPublish: () => void;
}

export function TopNav({ title, onSave, onPublish }: TopNavProps) {
  return (
    <header className="flex justify-between items-center w-full px-8 h-16 bg-surface/80 backdrop-blur-md sticky top-0 z-30 border-b border-outline-variant/5 font-sans">
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold tracking-tight text-on-surface">Editor</span>
        <span className="h-4 w-[1px] bg-outline-variant/30"></span>
        <span className="text-sm text-on-surface-variant font-normal">{title || 'Untitled Memo'}</span>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onSave}
          className="text-on-surface-variant/60 hover:text-primary transition-all px-4 py-2 text-sm font-medium"
        >
          Save Draft
        </button>
        <button 
          onClick={onPublish}
          className="bg-gradient-to-br from-primary to-primary-container text-white px-6 py-2 rounded-full text-sm font-semibold hover:shadow-lg transition-all active:scale-95"
        >
          Publish
        </button>
      </div>
    </header>
  );
}