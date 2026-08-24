import React, { useState, useRef } from 'react';
import { FormDefinition } from '../../types';
import { api } from '../../services/api';
import { Camera, PenTool, CheckCircle2, X, Upload, Check, FileCheck, Trash2, Eye } from 'lucide-react';
import { EloLogChecklistModal } from './EloLogChecklistModal';
import { CameraCaptureModal } from '../common/CameraCaptureModal';

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
  const [activeCameraField, setActiveCameraField] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleAnswerChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleFileUpload = (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          handleAnswerChange(fieldId, reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
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
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    ref={el => { fileInputRefs.current[field.id] = el; }}
                    onChange={e => handleFileUpload(field.id, e)}
                    className="hidden"
                  />

                  {answers[field.id] ? (
                    <div className="relative border-2 border-emerald-500/50 rounded-xl overflow-hidden bg-slate-900 p-1 flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 cursor-pointer p-1"
                        onClick={() => setPreviewPhoto(answers[field.id])}
                      >
                        <img 
                          src={answers[field.id]} 
                          alt="Foto capturada" 
                          className="w-16 h-16 object-cover rounded-lg border border-emerald-400"
                        />
                        <div>
                          <span className="text-xs font-bold text-white flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Foto Anexada
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Clique para ampliar</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pr-2">
                        <button
                          type="button"
                          onClick={() => setActiveCameraField(field.id)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-bold cursor-pointer"
                          title="Tirar outra foto com a câmera"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[field.id]?.click()}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                          title="Substituir por foto da galeria"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAnswerChange(field.id, null)}
                          className="p-2 bg-rose-900/60 hover:bg-rose-800 text-rose-300 rounded-lg text-xs font-bold cursor-pointer"
                          title="Excluir foto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                          Anexar Foto Comprobatória
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Abra a câmera do dispositivo ou escolha um arquivo da galeria
                        </p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveCameraField(field.id)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Abrir Câmera ao Vivo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[field.id]?.click()}
                          className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Galeria / Arquivo</span>
                        </button>
                      </div>
                    </div>
                  )}
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

      {/* Live Camera Modal */}
      {activeCameraField && (
        <CameraCaptureModal
          isOpen={true}
          onClose={() => setActiveCameraField(null)}
          onCapture={(dataUrl) => {
            handleAnswerChange(activeCameraField, dataUrl);
            setActiveCameraField(null);
          }}
          title="Capturar Foto para o Formulário"
          subtitle="Enquadre o registro com boa iluminação"
        />
      )}

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2 flex flex-col items-center">
            <div className="w-full flex justify-between items-center p-2 text-white text-xs font-bold">
              <span>Foto Anexada</span>
              <button type="button" onClick={() => setPreviewPhoto(null)} className="p-1 hover:bg-slate-800 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={previewPhoto} alt="Foto" className="max-h-[70vh] rounded object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

