"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface Memo {
  id: string;
  title: string;
  content: string;
  status: string;
  updatedAt: string;
}

export default function MemosList() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMemos() {
      try {
        const res = await fetch('/api/memos');
        if (res.ok) {
          const data = await res.json();
          setMemos(data);
        }
      } catch (error) {
        console.error('Failed to fetch memos', error);
      } finally {
        setLoading(false);
      }
    }
    fetchMemos();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-10 py-12">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-extrabold text-on-surface font-sans">Memos</h1>
          <Link
            href={`/memos/new`}
            className="flex items-center gap-2 bg-primary hover:bg-primary-container text-white py-2 px-5 rounded-full font-semibold transition-colors"
          >
            <Plus size={20} />
            新しいメモ
          </Link>
        </header>

        {memos.length === 0 ? (
          <div className="text-center py-20 text-on-surface-variant">
            <p>メモがありません。新しいメモを作成してください。</p>
          </div>
        ) : (
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
                  className="block h-full bg-surface-container-lowest p-6 rounded-2xl whisper-shadow border border-outline-variant/10 hover:border-primary/30 transition-all hover:-translate-y-1 relative"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-xs text-on-surface-variant/60 font-semibold font-sans">
                      {new Date(memo.updatedAt).toLocaleDateString()}
                    </div>
                    {memo.status === 'DRAFT' && (
                      <span className="text-xs font-semibold px-2 py-1 bg-secondary-container text-on-secondary-container rounded-md">
                        下書き
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-on-surface mb-3 line-clamp-2">
                    {memo.title}
                  </h2>
                  <p className="text-on-surface-variant font-serif line-clamp-3 text-sm">
                    {memo.content.substring(0, 100) || "内容なし"}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}