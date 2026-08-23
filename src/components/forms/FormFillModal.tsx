import React, { useState } from 'react';
import { FormDefinition } from '../../types';
import { api } from '../../services/api';
import { Camera, PenTool, CheckCircle2, X, Upload, Check, FileCheck } from 'lucide-react';
import { EloLogChecklistModal } from './EloLogChecklistModal';

interface FormFillModalProps {
  form: FormDefinition;
  freightId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const FormFillModal: React.FC<FormFillModalProps> = ({ form, freightId, onClose, onSuccess }) => {
  // If it is the ELO LOG checklist model, open the specialized talão checklist
  if (form.id === 'form-checklist-elolog' || form.title.toLowerCase().includes('elo log')) {
    return (
      <EloLogChecklistModal
        form={form}
        freightId={freightId}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [photoAdded, setPhotoAdded] = useState(false);

  const handleAnswerChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.submitFormResponse({
        formId: form.id,
        freightId,
        answers: {
          ...answers,
          hasPhoto: photoAdded,
          digitalSignatureCaptured: signed,
          submittedAt: new Date().toISOString()
        }
      });
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar formulário');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Formulário Operacional</span>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{form.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {form.description && (
          <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            {form.description}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {form.fields.map(field => (
            <div key={field.id} className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {field.label} {field.required && <span className="text-rose-500">*</span>}
              </label>

              {field.type === 'photo' ? (
                <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
                  <Camera className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    {photoAdded ? '✅ Foto capturada com sucesso!' : 'Clique para tirar foto ou anexar da galeria'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPhotoAdded(!photoAdded)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {photoAdded ? 'Substituir Foto' : 'Simular Captura de Foto'}
                  </button>
                </div>
              ) : field.type === 'signature' ? (
                <div className="p-4 border-2 border-dashed border-indigo-300 dark:border-indigo-800 rounded-xl text-center space-y-2 bg-indigo-50/20 dark:bg-indigo-950/20">
                  <PenTool className="w-8 h-8 text-indigo-600 mx-auto" />
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    {signed ? '✍️ Assinatura digital registrada!' : 'Painel de Assinatura Digital do Recebedor'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSigned(!signed)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {signed ? 'Limpar e Reassinar' : 'Coletar Assinatura'}
                  </button>
                </div>
              ) : field.type === 'radio' && field.options ? (
                <div className="space-y-1.5">
                  {field.options.map((opt, i) => (
                    <label key={i} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100">
                      <input
                        type="radio"
                        name={field.id}
                        value={opt}
                        checked={answers[field.id] === opt}
                        onChange={() => handleAnswerChange(field.id, opt)}
                        className="text-emerald-600"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              ) : field.type === 'select' && field.options ? (
                <select
                  value={answers[field.id] || ''}
                  onChange={e => handleAnswerChange(field.id, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                >
                  <option value="">Selecione uma opção...</option>
                  {field.options.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={answers[field.id] || ''}
                  onChange={e => handleAnswerChange(field.id, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  placeholder={field.placeholder || 'Digite sua resposta...'}
                />
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={answers[field.id] || ''}
                  onChange={e => handleAnswerChange(field.id, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  placeholder={field.placeholder || 'Preencha o campo...'}
                />
              )}
            </div>
          ))}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Gravando...' : 'Confirmar e Enviar'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
