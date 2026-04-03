import React from 'react';
import { Bold, Italic, Heading1, Heading2, Quote, Image as ImageIcon, Code, Eye } from 'lucide-react';
import { motion } from 'motion/react';

interface FloatingToolbarProps {
  onAction?: (action: string) => void;
}

export function FloatingToolbar({ onAction }: FloatingToolbarProps) {
  return (
    <motion.div 
      initial={{ y: 100, x: '-50%', opacity: 0 }}
      animate={{ y: 0, x: '-50%', opacity: 1 }}
      className="fixed bottom-12 left-1/2 flex items-center gap-1 p-2 bg-white/80 backdrop-blur-xl rounded-full border border-gray-200 shadow-lg z-50"
    >
      <ToolbarButton icon={Bold} title="太字" onClick={() => onAction?.('bold')} />
      <ToolbarButton icon={Italic} title="斜体" onClick={() => onAction?.('italic')} />
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <ToolbarButton icon={Heading1} title="見出し1" onClick={() => onAction?.('h1')} />
      <ToolbarButton icon={Heading2} title="見出し2" onClick={() => onAction?.('h2')} />
      <ToolbarButton icon={Quote} title="引用" onClick={() => onAction?.('quote')} />
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <ToolbarButton icon={ImageIcon} title="画像を挿入" onClick={() => onAction?.('image')} />
      <ToolbarButton icon={Code} title="コードブロック" onClick={() => onAction?.('code')} />
    </motion.div>
  );
}

function ToolbarButton({ icon: Icon, title, active = false, onClick }: { icon: any, title: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
        active ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-gray-100 text-gray-600'
      }`}
      title={title}
    >
      <Icon size={18} />
    </button>
  );
}