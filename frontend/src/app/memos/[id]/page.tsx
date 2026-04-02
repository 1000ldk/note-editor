"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { TopNav } from '@/components/TopNav';
import { FloatingToolbar } from '@/components/FloatingToolbar';
import { StatusBar } from '@/components/StatusBar';
import { Draft } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import { useParams } from 'next/navigation';

export default function MemoEditor() {
  const params = useParams();
  const memoId = params?.id as string | undefined;

  const INITIAL_DRAFT: Draft = {
    id: memoId || '1',
    title: '',
    content: '',
    lastSaved: new Date(),
    wordCount: 0,
  };

  const [draft, setDraft] = useState<Draft>(INITIAL_DRAFT);

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    setDraft(prev => ({ ...prev, title: newTitle }));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    // 日本語対応の雑な文字数カウント: 空白を削除して文字数を測定
    const words = newContent.trim() ? newContent.replace(/\s+/g, '').length : 0;
    setDraft(prev => ({ 
      ...prev, 
      content: newContent,
      wordCount: words
    }));
  };

  const handleSave = useCallback(() => {
    setDraft(prev => ({ ...prev, lastSaved: new Date() }));
    console.log('Draft saved:', draft);
  }, [draft]);

  const handlePublish = () => {
    console.log('Publishing draft:', draft);
    alert('Memo Published!');
  };

  return (
    <>
      <TopNav 
        title={draft.title} 
        onSave={handleSave} 
        onPublish={handlePublish} 
      />

      <div className="flex-1 overflow-y-auto px-6 py-24 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[740px] bg-surface-container-lowest p-12 md:p-20 rounded-xl whisper-shadow"
        >
          <article className="space-y-8">
            <textarea
              value={draft.title}
              onChange={handleTitleChange}
              placeholder="Title..."
              rows={1}
              className="w-full bg-transparent border-none focus:ring-0 font-sans font-extrabold text-5xl md:text-6xl text-on-surface placeholder:text-outline-variant/40 resize-none h-auto overflow-hidden leading-tight"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
            
            <div className="w-16 h-1 bg-primary/20 rounded-full"></div>
            
            <textarea
              value={draft.content}
              onChange={handleContentChange}
              placeholder="Tell your story..."
              className="w-full bg-transparent border-none focus:ring-0 font-serif text-xl md:text-2xl text-on-surface-variant placeholder:text-outline-variant/40 resize-none min-h-[500px] leading-[1.8]"
            />
          </article>
        </motion.div>
      </div>

      <FloatingToolbar />
      <StatusBar wordCount={draft.wordCount} lastSaved={draft.lastSaved} />
    </>
  );
}