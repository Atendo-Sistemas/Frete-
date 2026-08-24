import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { api } from '../../services/api';
import 'react-quill-new/dist/quill.snow.css';

export const HelpPanel: React.FC<{ role: string }> = ({ role }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [role]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await api.getHelp();
      const manual = data.find((h: { role: string, content: string }) => h.role === role);
      setContent(manual?.content || 'Conteúdo de ajuda não definido para este perfil.');
    } catch (err) {
      console.error('Erro ao carregar ajuda:', err);
      setContent('Erro ao carregar conteúdo de ajuda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-4xl mx-auto">
      <h2 className="text-xl font-black flex items-center gap-2 mb-6">
        <BookOpen className="w-6 h-6 text-emerald-500" /> Manual do Sistema
      </h2>
      {loading ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">Carregando...</div>
      ) : (
        <div className="ql-snow">
          <div 
            className="ql-editor text-sm text-slate-600 dark:text-slate-300 max-w-none px-0"
            dangerouslySetInnerHTML={{ __html: content }} 
          />
        </div>
      )}
    </div>
  );
};
