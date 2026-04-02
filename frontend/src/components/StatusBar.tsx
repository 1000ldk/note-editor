import React from 'react';

interface StatusBarProps {
  wordCount: number;
  lastSaved: Date;
}

export function StatusBar({ wordCount, lastSaved }: StatusBarProps) {
  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div className="fixed bottom-6 right-8 text-[10px] font-sans uppercase tracking-widest text-on-surface-variant/40 flex gap-6 items-center pointer-events-none">
      <span>{wordCount}文字</span>
      <span>Saved {timeAgo(lastSaved)}</span>
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-primary-container"></div>
        <span>Connected</span>
      </div>
    </div>
  );
}