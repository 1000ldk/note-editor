"use client";

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';

export default function MemosList() {
  const memos = [
    { id: '1', title: '初めてのアイデア', date: '2026-04-02', snippet: 'このメモには私の将来のビジョンが含まれています。' },
    { id: '2', title: '次期プロダクトの構成案', date: '2026-04-01', snippet: 'Zen UIを適用して、クリーンでミニマルなノート体験をユーザーに提供する。' },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-10 py-12">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-extrabold text-on-surface font-sans">Memos</h1>
          <Link
            href={`/memos/${Date.now()}`}
            className="flex items-center gap-2 bg-primary hover:bg-primary-container text-white py-2 px-5 rounded-full font-semibold transition-colors"
          >
            <Plus size={20} />
            新しいメモ
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memos.map((memo, idx) => (
            <motion.div
              key={memo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link 
                href={`/memos/${memo.id}`}
                className="block h-full bg-surface-container-lowest p-6 rounded-2xl whisper-shadow border border-outline-variant/10 hover:border-primary/30 transition-all hover:-translate-y-1"
              >
                <div className="text-xs text-on-surface-variant/60 font-semibold mb-3 font-sans">
                  {memo.date}
                </div>
                <h2 className="text-xl font-bold text-on-surface mb-3 line-clamp-2">
                  {memo.title}
                </h2>
                <p className="text-on-surface-variant font-serif line-clamp-3">
                  {memo.snippet}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}