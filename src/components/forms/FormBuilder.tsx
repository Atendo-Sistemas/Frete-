import React, { useState, useEffect, useCallback } from 'react';
import { FormDefinition, FormField, FormFieldType, FormEventTrigger } from '../../types';
import { api } from '../../services/api';
import { FormFillModal } from './FormFillModal';
import { 
  FileText, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Camera, 
  PenTool, 
  Calendar, 
  Layers, 
  Clock, 
  Sparkles,
  Eye,
  CheckCircle2,
  X
} from 'lucide-react';

export const FormBuilder: React.FC = () => {
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [previewForm, setPreviewForm] = useState<FormDefinition | null>(null);

  // New Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<any>('CHECKLIST_COLETA');
  const [triggerEvent, setTriggerEvent] = useState<FormEventTrigger>('DURANTE_COLETA');
  const [fields, setFields] = useState<FormField[]>([
    {
      id: 'f_1',
      name: 'item_conferido',
      label: 'Conferência física de volumes com a Nota Fiscal',
      type: 'radio',
      required: true,
      options: ['Conforme', 'Inconforme / Divergência'],
      order: 1
    },
    {
      id: 'f_2',
      name: 'foto_comprovante',
      label: 'Foto da mercadoria / Canhoto',
      type: 'photo',
      required: true,
      order: 2
    }
  ]);

  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getForms();
      setForms(data);
    } catch (err) {
      console.error('Erro ao carregar formulários:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleAddField = (type: FormFieldType) => {
    const newField: FormField = {
      id: `f_${Date.now()}`,
      name: `campo_${fields.length + 1}`,
      label: type === 'photo' ? 'Foto comprobatória' : type === 'signature' ? 'Assinatura digital do recebedor' : `Novo campo ${fields.length + 1}`,
      type,
      required: true,
      options: ['select', 'radio', 'checkbox'].includes(type) ? ['Opção 1', 'Opção 2'] : undefined,
      order: fields.length + 1
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert('Informe o título do formulário');

    try {
      const saved = await api.createForm({
        title,
        description,
        category,
        triggerEvent,
        fields
      });
      setForms([...forms, saved]);
      setIsCreating(false);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar formulário');
    }
  };

  const handleDeleteForm = async (id: string, title: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o formulário "${title}"?`)) return;
    try {
      await api.deleteForm(id);
      setForms(prev => prev.filter(f => f.id !== id));
      if (previewForm?.id === id) {
        setPreviewForm(null);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir formulário');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-emerald-600" />
            <span>Formulários & Checklists Dinâmicos</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Crie e gerencie checklists de coleta, comprovantes digitais de entrega e relatórios de ocorrência vinculados aos eventos de frete.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Criar Novo Formulário</span>
        </button>
      </div>

      {/* Featured Template Banner: Elo Log Official Checklist */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-5 rounded-2xl text-white shadow-lg border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center font-black text-emerald-400 text-lg shrink-0">
            ELO
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                Modelo Oficial Carregado
              </span>
              <span className="text-xs text-slate-300 font-mono">Talão / Vistoria 3 Vias</span>
            </div>
            <h2 className="text-base font-black text-white mt-1">
              Checklist / Vistoria de Entrega e Retirada (Modelo ELO LOG)
            </h2>
            <p className="text-xs text-slate-300/90 mt-0.5">
              Conferência completa de 17 equipamentos, avarias (lataria, pintura, pneus), odômetro, documentos (CRLV/Danfe) e assinaturas digitais de Origem e Destino.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const eloForm = forms.find(f => f.id === 'form-checklist-elolog') || {
              id: 'form-checklist-elolog',
              tenantId: 'tenant-translog-01',
              title: 'Checklist / Vistoria de Entrega e Retirada de Veículo e Carga (Modelo Elo Log)',
              description: 'Modelo oficial de vistoria e checklist de entrega/retirada com conferência de documentos, avarias, 17 itens de equipamentos, odômetro (KM) e assinaturas de origem/destino.',
              category: 'CHECKLIST_ENTREGA' as any,
              triggerEvent: 'NA_ENTREGA' as any,
              fields: [],
              active: true,
              createdAt: new Date().toISOString()
            };
            setPreviewForm(eloForm);
          }}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Eye className="w-4 h-4" />
          <span>Abrir & Testar Vistoria Elo Log</span>
        </button>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forms.map(form => (
          <div
            key={form.id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {form.category}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  ⚡ Evento: {form.triggerEvent}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-3">{form.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{form.description}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300">Campos inclusos ({form.fields.length}):</div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.fields.map(f => (
                    <span key={f.id} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                      {f.label} ({f.type})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewForm(form)}
                  className="py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Testar</span>
                </button>
                <button
                  onClick={() => handleDeleteForm(form.id, form.title)}
                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                  title="Excluir formulário"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE FORM BUILDER MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Construtor de Formulário Personalizado</h2>
              <button onClick={() => setIsCreating(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Título do Formulário</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    placeholder="Ex: Checklist de Inspeção de Carregamento"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Vincular ao Evento do Frete</label>
                  <select
                    value={triggerEvent}
                    onChange={e => setTriggerEvent(e.target.value as FormEventTrigger)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    <option value="DURANTE_COLETA">Durante a Coleta (Carregamento)</option>
                    <option value="EM_TRANSITO">Durante o Transporte (Ocorrência em Rota)</option>
                    <option value="NA_ENTREGA">Na Entrega (Canhoto & Assinatura)</option>
                    <option value="FINALIZACAO">Finalização Operacional</option>
                    <option value="MANUAL">Preenchimento Manual Livre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Descrição / Instruções aos Motoristas</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  placeholder="Orientações detalhadas sobre como preencher..."
                />
              </div>

              {/* Fields Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Campos do Formulário ({fields.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => handleAddField('text')}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded text-[11px] font-medium cursor-pointer"
                    >
                      + Texto
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('photo')}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded text-[11px] font-medium text-emerald-600 cursor-pointer flex items-center gap-1"
                    >
                      <Camera className="w-3 h-3" /> + Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('signature')}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded text-[11px] font-medium text-indigo-600 cursor-pointer flex items-center gap-1"
                    >
                      <PenTool className="w-3 h-3" /> + Assinatura Digital
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddField('radio')}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded text-[11px] font-medium cursor-pointer"
                    >
                      + Opções (Radio)
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}.</span>
                      <input
                        type="text"
                        value={field.label}
                        onChange={e => {
                          const updated = [...fields];
                          updated[idx].label = e.target.value;
                          setFields(updated);
                        }}
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                        placeholder="Nome / Pergunta do Campo"
                      />
                      <span className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono uppercase">
                        {field.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Salvar e Publicar Formulário
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* FORM FILL / PREVIEW MODAL */}
      {previewForm && (
        <FormFillModal
          form={previewForm}
          onClose={() => setPreviewForm(null)}
          onSuccess={() => {
            alert('Resposta de teste registrada com sucesso no banco de dados!');
            setPreviewForm(null);
          }}
        />
      )}

    </div>
  );
};
