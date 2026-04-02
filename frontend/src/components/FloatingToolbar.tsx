import React from 'react';
import { Bold, Italic, Heading1, Heading2, Quote, Image as ImageIcon, Code, Eye } from 'lucide-react';
import { motion } from 'motion/react';

export function FloatingToolbar() {
  return (
    <motion.div 
      initial={{ y: 100, x: '-50%', opacity: 0 }}
      animate={{ y: 0, x: '-50%', opacity: 1 }}
      className="fixed bottom-12 left-1/2 flex items-center gap-1 p-2 bg-white/80 backdrop-blur-xl rounded-full border border-outline-variant/10 whisper-shadow z-50"
    >
      <ToolbarButton icon={Bold} title="Bold" />
      <ToolbarButton icon={Italic} title="Italic" />
      <div className="w-px h-6 bg-outline-variant/20 mx-1" />
      <ToolbarButton icon={Heading1} title="Heading 1" />
      <ToolbarButton icon={Heading2} title="Heading 2" />
      <ToolbarButton icon={Quote} title="Quote" />
      <div className="w-px h-6 bg-outline-variant/20 mx-1" />
      <ToolbarButton icon={ImageIcon} title="Add Image" />
      <ToolbarButton icon={Code} title="Code Block" />
      <div className="w-px h-6 bg-outline-variant/20 mx-1" />
      <ToolbarButton icon={Eye} title="Zen Mode" active />
    </motion.div>
  );
}

function ToolbarButton({ icon: Icon, title, active = false }: { icon: any, title: string, active?: boolean }) {
  return (
    <button 
      className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
        active ? 'bg-primary-container/20 text-primary' : 'hover:bg-surface-container-high text-on-surface-variant'
      }`}
      title={title}
    >
      <Icon size={18} />
    </button>
  );
}