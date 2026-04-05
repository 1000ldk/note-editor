"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { TopNav } from '@/components/TopNav';
import { FloatingToolbar } from '@/components/FloatingToolbar';
import { StatusBar } from '@/components/StatusBar';
import { Draft } from '@/types';
import { motion } from 'motion/react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

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
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

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
    alert('保存しました！');
  }, [draft]);

  const handlePublish = async () => {
    console.log('Publishing draft:', draft);
    
    try {
      const res = await fetch('/api/user/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete_memo' })
      });
      
      if (!res.ok) {
        console.error('Failed to complete memo:', res.status, res.statusText);
        alert('メモの完了に失敗しました。時間をおいて再度お試しください。');
        return;
      }
      alert('メモを完了し、10ポイントを獲得しました！');
      window.location.href = '/';
    } catch (e) {
      console.error(e);
      alert('メモの完了に失敗しました。通信状況を確認して再度お試しください。');
      return;
    }
  };

  useEffect(() => {
    // Add auto-scroll helper when typing heavily, so user always sees bottom of textarea clearly
    const textarea = document.getElementById('memo-content-textarea');
    if (textarea) {
      textarea.style.paddingBottom = '200px'; 
    }
  }, []);

  return (
    <>
      <TopNav 
        title={draft.title} 
        onSave={handleSave} 
        onPublish={handlePublish} 
        showBack={true}
      />

      <div className="flex-1 overflow-y-auto px-6 py-12 flex flex-col items-center bg-gray-50/50">
        <div className="w-full max-w-[740px] mb-4 flex gap-2">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'edit'
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            編集
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            data-testid="preview-tab"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            プレビュー
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[740px] bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-200"
        >
          <article className="space-y-6">
            <textarea
              value={draft.title}
              onChange={handleTitleChange}
              placeholder="タイトルを入力..."
              rows={1}
              className="w-full border-none focus:ring-0 focus:outline-none font-sans font-extrabold text-4xl md:text-5xl text-gray-800 placeholder:text-gray-300 resize-none h-auto overflow-hidden leading-tight bg-transparent"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
              readOnly={activeTab === 'preview'}
            />
            
            <div className="w-12 h-1 bg-emerald-500/30 rounded-full"></div>
            
            {activeTab === 'edit' ? (
              <textarea
                id="memo-content-textarea"
                value={draft.content}
                onChange={handleContentChange}
                placeholder="ここに入力..."
                className="w-full border-none focus:ring-0 focus:outline-none font-sans text-lg md:text-xl text-gray-800 placeholder:text-gray-300 resize-none min-h-[500px] leading-relaxed bg-transparent"
              />
            ) : (
              <div
                className="prose prose-emerald prose-lg max-w-none min-h-[500px]"
                data-testid="preview-content"
              >
                <ReactMarkdown>{draft.content || '*プレビューする内容がありません*'}</ReactMarkdown>
              </div>
            )}
          </article>
        </motion.div>
      </div>

      {activeTab === 'edit' && (
        <FloatingToolbar onAction={(action) => {
        const textarea = document.getElementById('memo-content-textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = draft.content;
        let newContent = text;
        const selectedText = text.substring(start, end);

        switch (action) {
          case 'bold': newContent = text.substring(0, start) + `**${selectedText || '太字'}**` + text.substring(end); break;
          case 'italic': newContent = text.substring(0, start) + `*${selectedText || '斜体'}*` + text.substring(end); break;
          case 'h1': newContent = text.substring(0, start) + `\n# ${selectedText || '見出し1'}\n` + text.substring(end); break;
          case 'h2': newContent = text.substring(0, start) + `\n## ${selectedText || '見出し2'}\n` + text.substring(end); break;
          case 'quote': newContent = text.substring(0, start) + `\n> ${selectedText || '引用'}\n` + text.substring(end); break;
          case 'code': newContent = text.substring(0, start) + `\n\`\`\`\n${selectedText || 'コード'}\n\`\`\`\n` + text.substring(end); break;
          case 'image': newContent = text.substring(0, start) + `![代替テキスト](url)` + text.substring(end); break;
        }

        setDraft(prev => ({ ...prev, content: newContent }));
        
        // Return focus to textarea
        setTimeout(() => {
          textarea.focus();
        }, 0);
      }} />
      )}
      <StatusBar wordCount={draft.wordCount} lastSaved={draft.lastSaved} />
    </>
  );
}