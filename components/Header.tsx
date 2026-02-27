
import React from 'react';
import { motion } from 'motion/react';

const Header: React.FC = () => {
  return (
    <header className="mb-12 text-center">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-6"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
        v1.2 • AI-Powered Studio
      </motion.div>
      <motion.h1 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-5xl font-light text-slate-900 tracking-tight sm:text-6xl mb-4"
      >
        Base64 <span className="font-semibold text-blue-600">Studio</span>
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed"
      >
        A high-precision utility for batch processing documents. 
        Extract structured data with AI or decode Base64 back to visual assets.
      </motion.p>
    </header>
  );
};

export default Header;
