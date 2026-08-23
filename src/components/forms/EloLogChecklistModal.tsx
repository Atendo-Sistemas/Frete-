import React, { useState, useRef, useEffect } from 'react';
import { FormDefinition, Freight, FormResponse } from '../../types';
import { api } from '../../services/api';
import { WhatsAppConfigModal } from '../common/WhatsAppConfigModal';
import { 
  X, 
  Printer, 
  Check, 
  Sparkles, 
  Camera, 
  PenTool, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  FileText,
  RotateCcw,
  Download,
  Share2,
  Save,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  Send,
  UserCheck,
  Building,
  CheckCircle,
  Settings
} from 'lucide-react';

interface EloLogChecklistModalProps {
  form?: FormDefinition;
  freightId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const EloLogChecklistModal: React.FC<EloLogChecklistModalProps> = ({
  form,
  freightId,
  onClose,
  onSuccess
}) => {
  const [freight, setFreight] = useState<Freight | null>(null);
  const [loadingFreight, setLoadingFreight] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [activeVia, setActiveVia] = useState<'1_BRANCA' | '2_VERDE' | '3_AMARELA'>('1_BRANCA');

  // Existing response/draft tracking
  const [existingResponseId, setExistingResponseId] = useState<string | null>(null);
  const [formStage, setFormStage] = useState<'RETIRADA_INICIADA' | 'FINALIZADO_ENTREGA' | 'COMPLETO'>('RETIRADA_INICIADA');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Document control number
  const [talaoNumber, setTalaoNumber] = useState<string>('401');

  // Client info & Contacts (Email & Telefone)
  const [cliente, setCliente] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [origemTelefone, setOrigemTelefone] = useState('');
  const [destinoTelefone, setDestinoTelefone] = useState('');

  // Retirada (Etapa 1 - Início da Viagem)
  const [dataRetirada, setDataRetirada] = useState(new Date().toISOString().split('T')[0]);
  const [kmRetirada, setKmRetirada] = useState('');
  const [localRetirada, setLocalRetirada] = useState('');

  // Entrega (Etapa 2 - Término da Viagem)
  const [dataEntrega, setDataEntrega] = useState('');
  const [kmEntrega, setKmEntrega] = useState('');
  const [localEntrega, setLocalEntrega] = useState('');

  // Vehicle
  const [marcaVeiculo, setMarcaVeiculo] = useState<string>('Mercedes-Benz');
  const [outraMarca, setOutraMarca] = useState('');
  const [modeloVeiculo, setModeloVeiculo] = useState('');
  const [corVeiculo, setCorVeiculo] = useState('Branco');
  const [placaVeiculo, setPlacaVeiculo] = useState('');
  const [chassiVeiculo, setChassiVeiculo] = useState('');

  // Documents
  const [docCRLV, setDocCRLV] = useState(true);
  const [docDanfeVeiculo, setDocDanfeVeiculo] = useState(true);
  const [docManual, setDocManual] = useState(false);
  const [docDanfeEquipamento, setDocDanfeEquipamento] = useState(false);

  // Avarias (S = Sim tem avaria / N = Não tem avaria + observações)
  const [avarias, setAvarias] = useState({
    lataria: { hasAvaria: false, obs: '' },
    pintura: { hasAvaria: false, obs: '' },
    parabrisa: { hasAvaria: false, obs: '' },
    interior: { hasAvaria: false, obs: '' },
    pneus: { hasAvaria: false, obs: '' },
    pneusQuant: '6',
    pneusMarca: 'Michelin / Pirelli'
  });

  // 17 Equipamentos Obrigatórios (true = SIM / false = NÃO)
  const [equipamentos, setEquipamentos] = useState<Record<string, boolean>>({
    chaveIgnicao: true,
    chaveTanque: true,
    chaveArla: true,
    chaveCopia: false,
    extintor: true,
    radio: true,
    antena: true,
    triangulo: true,
    macaco: true,
    chaveRoda: true,
    tacografo: true,
    pinoEngate: true,
    farois: true,
    lanternas: true,
    retrovisores: true,
    tampaBateria: true,
    bateria: true,
    estepe: true
  });

  // General observations
  const [observacoes, setObservacoes] = useState('');

  // Responsibles & Signatures: ORIGEM (Retirada) & DESTINO (Entrega)
  const [origemNome, setOrigemNome] = useState('');
  const [origemCpf, setOrigemCpf] = useState('');
  const [origemEmail, setOrigemEmail] = useState('');
  const [origemAssinado, setOrigemAssinado] = useState(false);
  const [origemDataAssinatura, setOrigemDataAssinatura] = useState('');

  const [destinoNome, setDestinoNome] = useState('');
  const [destinoCpf, setDestinoCpf] = useState('');
  const [destinoEmail, setDestinoEmail] = useState('');
  const [destinoAssinado, setDestinoAssinado] = useState(false);
  const [destinoDataAssinatura, setDestinoDataAssinatura] = useState('');

  const [condutorNome, setCondutorNome] = useState('');
  const [condutorTelefone, setCondutorTelefone] = useState('');

  // Photos
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);

  // WhatsApp Notification State & Feedback
  const [showWhatsAppPanel, setShowWhatsAppPanel] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [whatsAppRecipient, setWhatsAppRecipient] = useState('');
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [whatsAppSending, setWhatsAppSending] = useState(false);
  const [whatsAppStatus, setWhatsAppStatus] = useState<string | null>(null);

  // Quick Template Setters for WhatsApp
  const handleApplyWhatsAppTemplate = (type: 'RETIRADA' | 'ENTREGA' | 'VISTORIA') => {
    const pl = placaVeiculo || 'VEÍCULO';
    const mod = modeloVeiculo || marcaVeiculo || 'Caminhão';
    const code = freight?.code ? `[Frete ${freight.code}]` : `[Talão Nº ${talaoNumber}]`;

    if (type === 'RETIRADA') {
      setWhatsAppMessage(`🚗 ${code} ELO LOG: Retirada e Vistoria de Coleta concluída com sucesso! Veículo: ${mod} - Placa: ${pl}. KM Coleta: ${kmRetirada || 'Registrado'}. 1ª Assinatura coletada.`);
      if (origemTelefone) setWhatsAppRecipient(origemTelefone);
      else if (clienteTelefone) setWhatsAppRecipient(clienteTelefone);
    } else if (type === 'ENTREGA') {
      setWhatsAppMessage(`🏁 ${code} ELO LOG: Entrega e Vistoria Final finalizada! Veículo: ${mod} - Placa: ${pl}. KM Entrega: ${kmEntrega || 'Registrado'}. 2ª Assinatura coletada com sucesso.`);
      if (destinoTelefone) setWhatsAppRecipient(destinoTelefone);
      else if (clienteTelefone) setWhatsAppRecipient(clienteTelefone);
    } else {
      setWhatsAppMessage(`📋 ${code} ELO LOG: Relatório de Checklist e Vistoria do veículo ${mod} (${pl}). Origem: ${localRetirada} -> Destino: ${localEntrega}.`);
      if (clienteTelefone) setWhatsAppRecipient(clienteTelefone);
    }
  };

  // Interactive Signature Canvas references
  const origemCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const destinoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingOrigem, setIsDrawingOrigem] = useState(false);
  const [isDrawingDestino, setIsDrawingDestino] = useState(false);

  // Load freight context and existing form responses if available
  useEffect(() => {
    if (freightId) {
      setLoadingFreight(true);
      api.getFreight(freightId)
        .then(f => {
          setFreight(f);
          setCliente(f.tenantName || 'TransLog Brasil Transportes');
          setLocalRetirada(`${f.origin.city}/${f.origin.state}`);
          setLocalEntrega(`${f.destination.city}/${f.destination.state}`);
          if (f.origin.contactPhone) setOrigemTelefone(f.origin.contactPhone);
          if (f.destination.contactPhone) setDestinoTelefone(f.destination.contactPhone);
          if (f.origin.contactName) setOrigemNome(f.origin.contactName);
          if (f.destination.contactName) setDestinoNome(f.destination.contactName);
          if (f.assignedVehiclePlate) setPlacaVeiculo(f.assignedVehiclePlate);
          if (f.assignedVehicleModel) setModeloVeiculo(f.assignedVehicleModel);
          if (f.assignedDriverName) setCondutorNome(f.assignedDriverName);
          if (f.assignedDriverPhone) setCondutorTelefone(f.assignedDriverPhone);
          if (f.origin.date) setDataRetirada(f.origin.date);
          if (f.destination.date) setDataEntrega(f.destination.date);

          // Check if there is already a saved response/draft for this freight
          return api.getFormResponses({ freightId, formId: form?.id || 'form-checklist-elolog' });
        })
        .then(responses => {
          if (responses && responses.length > 0) {
            const latest = responses[responses.length - 1];
            setExistingResponseId(latest.id);
            if (latest.stage) setFormStage(latest.stage);
            if (latest.updatedAt || latest.createdAt) {
              setLastSavedAt(new Date(latest.updatedAt || latest.createdAt).toLocaleString('pt-BR'));
            }

            const ans = latest.answers || {};
            if (ans.talaoNumber) setTalaoNumber(ans.talaoNumber);
            if (ans.cliente) setCliente(ans.cliente);
            if (ans.clienteEmail) setClienteEmail(ans.clienteEmail);
            if (ans.clienteTelefone) setClienteTelefone(ans.clienteTelefone);
            if (ans.retirada) {
              if (ans.retirada.data) setDataRetirada(ans.retirada.data);
              if (ans.retirada.km) setKmRetirada(ans.retirada.km);
              if (ans.retirada.local) setLocalRetirada(ans.retirada.local);
              if (ans.retirada.telefone) setOrigemTelefone(ans.retirada.telefone);
            }
            if (ans.entrega) {
              if (ans.entrega.data) setDataEntrega(ans.entrega.data);
              if (ans.entrega.km) setKmEntrega(ans.entrega.km);
              if (ans.entrega.local) setLocalEntrega(ans.entrega.local);
              if (ans.entrega.telefone) setDestinoTelefone(ans.entrega.telefone);
            }
            if (ans.veiculo) {
              if (ans.veiculo.marca) setMarcaVeiculo(ans.veiculo.marca);
              if (ans.veiculo.modelo) setModeloVeiculo(ans.veiculo.modelo);
              if (ans.veiculo.cor) setCorVeiculo(ans.veiculo.cor);
              if (ans.veiculo.placa) setPlacaVeiculo(ans.veiculo.placa);
              if (ans.veiculo.chassi) setChassiVeiculo(ans.veiculo.chassi);
            }
            if (ans.documentos) {
              if (ans.documentos.crlv !== undefined) setDocCRLV(ans.documentos.crlv);
              if (ans.documentos.danfeVeiculo !== undefined) setDocDanfeVeiculo(ans.documentos.danfeVeiculo);
              if (ans.documentos.manual !== undefined) setDocManual(ans.documentos.manual);
              if (ans.documentos.danfeEquipamento !== undefined) setDocDanfeEquipamento(ans.documentos.danfeEquipamento);
            }
            if (ans.avarias) setAvarias(ans.avarias);
            if (ans.equipamentos) setEquipamentos(ans.equipamentos);
            if (ans.observacoes) setObservacoes(ans.observacoes);
            if (ans.origem) {
              if (ans.origem.nome) setOrigemNome(ans.origem.nome);
              if (ans.origem.cpf) setOrigemCpf(ans.origem.cpf);
              if (ans.origem.email) setOrigemEmail(ans.origem.email);
              if (ans.origem.telefone) setOrigemTelefone(ans.origem.telefone);
              if (ans.origem.assinado !== undefined) setOrigemAssinado(ans.origem.assinado);
              if (ans.origem.dataAssinatura) setOrigemDataAssinatura(ans.origem.dataAssinatura);
            }
            if (ans.destino) {
              if (ans.destino.nome) setDestinoNome(ans.destino.nome);
              if (ans.destino.cpf) setDestinoCpf(ans.destino.cpf);
              if (ans.destino.email) setDestinoEmail(ans.destino.email);
              if (ans.destino.telefone) setDestinoTelefone(ans.destino.telefone);
              if (ans.destino.assinado !== undefined) setDestinoAssinado(ans.destino.assinado);
              if (ans.destino.dataAssinatura) setDestinoDataAssinatura(ans.destino.dataAssinatura);
            }
            if (ans.condutor) setCondutorNome(ans.condutor);
            if (ans.condutorTelefone) setCondutorTelefone(ans.condutorTelefone);
            if (ans.photos) setPhotos(ans.photos);
          }
        })
        .catch(err => console.error('Erro ao carregar contexto de vistoria:', err))
        .finally(() => setLoadingFreight(false));
    }
  }, [freightId, form?.id]);

  // Setup WhatsApp default template
  useEffect(() => {
    const targetPhone = destinoTelefone || origemTelefone || clienteTelefone || '17997451176';
    setWhatsAppRecipient(targetPhone);
    const codeStr = freight?.code ? `Frete #${freight.code}` : `Talão Nº ${talaoNumber}`;
    setWhatsAppMessage(
      `Olá! Segue a atualização do Checklist/Vistoria ELO LOG (${codeStr}).\n` +
      `• Veículo: ${marcaVeiculo} ${modeloVeiculo} (Placa: ${placaVeiculo || 'N/A'})\n` +
      `• Origem: ${localRetirada || 'Retirada'} (KM: ${kmRetirada || 'Registrado'})\n` +
      `• Destino: ${localEntrega || 'Destino'} (KM: ${kmEntrega || 'Pendente'})\n` +
      `• Status: ${origemAssinado && destinoAssinado ? '✅ Viagem e Vistoria Concluídas' : origemAssinado ? '📍 Retirada Realizada e Assinada (Em Trânsito)' : '📝 Vistoria em Andamento'}\n` +
      `ELO LOG TRANSPORTES • Tel: (17) 99745.1176`
    );
  }, [
    talaoNumber,
    freight?.code,
    marcaVeiculo,
    modeloVeiculo,
    placaVeiculo,
    localRetirada,
    kmRetirada,
    localEntrega,
    kmEntrega,
    origemAssinado,
    destinoAssinado,
    destinoTelefone,
    origemTelefone,
    clienteTelefone
  ]);

  const handleSetAllEquipamentos = (value: boolean) => {
    const updated: Record<string, boolean> = {};
    Object.keys(equipamentos).forEach(key => {
      updated[key] = value;
    });
    setEquipamentos(updated);
  };

  const handleAddPhoto = () => {
    setPhotoUploading(true);
    setTimeout(() => {
      setPhotos(prev => [
        ...prev,
        `Vistoria_${marcaVeiculo}_${placaVeiculo || 'VEIC'}_${new Date().toLocaleTimeString('pt-BR').replace(/:/g, '')}.jpg`
      ]);
      setPhotoUploading(false);
    }, 400);
  };

  // Build answer payload
  const buildAnswersPayload = (isDraftSave: boolean) => {
    return {
      talaoNumber,
      cliente,
      clienteEmail,
      clienteTelefone,
      retirada: { 
        data: dataRetirada, 
        km: kmRetirada, 
        local: localRetirada,
        telefone: origemTelefone 
      },
      entrega: { 
        data: dataEntrega, 
        km: kmEntrega, 
        local: localEntrega,
        telefone: destinoTelefone 
      },
      veiculo: {
        marca: marcaVeiculo === 'Outro' ? outraMarca : marcaVeiculo,
        modelo: modeloVeiculo,
        cor: corVeiculo,
        placa: placaVeiculo,
        chassi: chassiVeiculo
      },
      documentos: {
        crlv: docCRLV,
        danfeVeiculo: docDanfeVeiculo,
        manual: docManual,
        danfeEquipamento: docDanfeEquipamento
      },
      avarias,
      equipamentos,
      observacoes,
      origem: { 
        nome: origemNome, 
        cpf: origemCpf, 
        email: origemEmail,
        telefone: origemTelefone,
        assinado: origemAssinado,
        dataAssinatura: origemDataAssinatura || (origemAssinado ? new Date().toISOString() : null)
      },
      destino: { 
        nome: destinoNome, 
        cpf: destinoCpf, 
        email: destinoEmail,
        telefone: destinoTelefone,
        assinado: destinoAssinado,
        dataAssinatura: destinoDataAssinatura || (destinoAssinado ? new Date().toISOString() : null)
      },
      condutor: condutorNome,
      condutorTelefone,
      photos,
      photosCount: photos.length,
      isDraft: isDraftSave,
      submittedAt: new Date().toISOString()
    };
  };

  // SALVAR RASCUNHO / SALVAMENTO INTERMEDIÁRIO (Para completar após o término da viagem)
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const answers = buildAnswersPayload(true);
      const stage = destinoAssinado ? 'FINALIZADO_ENTREGA' : 'RETIRADA_INICIADA';

      const response = await api.submitFormResponse({
        responseId: existingResponseId || undefined,
        formId: form?.id || 'form-checklist-elolog',
        freightId,
        stage,
        isDraft: true,
        answers
      });

      setExistingResponseId(response.id);
      setFormStage(stage);
      setLastSavedAt(new Date().toLocaleTimeString('pt-BR'));
      alert('✓ Progresso da Vistoria salvo com sucesso! Você pode continuar a viagem e completar a entrega com a 2ª assinatura depois.');
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar rascunho de vistoria');
    } finally {
      setSavingDraft(false);
    }
  };

  // SUBMISSAO FINAL
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const answers = buildAnswersPayload(false);

      const response = await api.submitFormResponse({
        responseId: existingResponseId || undefined,
        formId: form?.id || 'form-checklist-elolog',
        freightId,
        stage: 'COMPLETO',
        isDraft: false,
        answers
      });

      setExistingResponseId(response.id);
      setFormStage('COMPLETO');
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar vistoria completa');
    } finally {
      setSubmitting(false);
    }
  };

  // DISPARAR NOTIFICAÇÃO VIA WHATSAPP
  const handleSendWhatsAppNotification = async () => {
    if (!whatsAppRecipient) {
      alert('Por favor, informe o telefone do destinatário com DDD.');
      return;
    }
    setWhatsAppSending(true);
    try {
      const res = await api.sendWhatsAppNotification({
        phone: whatsAppRecipient,
        message: whatsAppMessage,
        freightCode: freight?.code,
        templateType: 'CHECKLIST_VISTORIA'
      });
      setWhatsAppStatus(`✓ WhatsApp preparado/enviado para ${res.recipient}! Protocolo: ${res.messageId}`);
    } catch (err: any) {
      alert(err.message || 'Erro ao preparar notificação do WhatsApp');
    } finally {
      setWhatsAppSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full my-auto max-h-[96vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
        
        {/* Modal Top Bar (Control & Print Buttons) */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded">
              DIGITAL & IMPRESSÃO
            </span>
            <span className="text-xs sm:text-sm font-bold truncate">
              Checklist Oficial de Vistoria • ELO LOG TRANSPORTES
            </span>
            {lastSavedAt && (
              <span className="hidden lg:inline text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                Salvo às {lastSavedAt}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Via Selector Pill */}
            <div className="hidden sm:flex items-center bg-slate-800 p-1 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveVia('1_BRANCA')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${activeVia === '1_BRANCA' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'}`}
              >
                1ª Via (ELO LOG)
              </button>
              <button
                type="button"
                onClick={() => setActiveVia('2_VERDE')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${activeVia === '2_VERDE' ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'}`}
              >
                2ª Via (Entrega)
              </button>
              <button
                type="button"
                onClick={() => setActiveVia('3_AMARELA')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${activeVia === '3_AMARELA' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'}`}
              >
                3ª Via (Retirada)
              </button>
            </div>

            {/* WhatsApp Integration Toggle Button */}
            <button
              type="button"
              onClick={() => setShowWhatsAppPanel(!showWhatsAppPanel)}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                showWhatsAppPanel ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white'
              }`}
              title="Notificação WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden md:inline">WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Imprimir Modelo de Talão"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline">Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic WhatsApp Dispatch Panel (Collapsible) */}
        {showWhatsAppPanel && (
          <div className="bg-emerald-950 text-white p-3 sm:p-4 border-b border-emerald-800 animate-in slide-in-from-top-2 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-emerald-200">
                  Notificação e Envio do Checklist via WhatsApp
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(true)}
                  className="text-[11px] text-emerald-300 hover:text-white bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                  title="Configurar URL e Token da API WhatsApp"
                >
                  <Settings className="w-3 h-3" />
                  <span>Configurar API / Token</span>
                </button>
                <span className="text-[10px] text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded font-mono">
                  Gateway API Ativo
                </span>
              </div>
            </div>

            {/* Quick Templates Selector */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] font-semibold text-emerald-400">Modelos Rápidos:</span>
              <button
                type="button"
                onClick={() => handleApplyWhatsAppTemplate('RETIRADA')}
                className="px-2 py-1 bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-700 rounded text-[11px] text-emerald-200 cursor-pointer transition-colors"
              >
                🚗 1. Notificar Retirada (Origem)
              </button>
              <button
                type="button"
                onClick={() => handleApplyWhatsAppTemplate('ENTREGA')}
                className="px-2 py-1 bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-700 rounded text-[11px] text-emerald-200 cursor-pointer transition-colors"
              >
                🏁 2. Notificar Entrega (Destino)
              </button>
              <button
                type="button"
                onClick={() => handleApplyWhatsAppTemplate('VISTORIA')}
                className="px-2 py-1 bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-700 rounded text-[11px] text-emerald-200 cursor-pointer transition-colors"
              >
                📋 3. Envio de Vistoria ao Cliente
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-emerald-300 font-semibold mb-1">Telefone / WhatsApp (DDD + Número):</label>
                <div className="flex items-center gap-1.5 bg-emerald-900/50 border border-emerald-700 rounded px-2.5 py-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <input
                    type="text"
                    value={whatsAppRecipient}
                    onChange={e => setWhatsAppRecipient(e.target.value)}
                    placeholder="Ex: (17) 99745-1176"
                    className="bg-transparent text-white w-full focus:outline-hidden text-xs"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-emerald-300 font-semibold mb-1">Mensagem de Atualização do Checklist:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={whatsAppMessage}
                    onChange={e => setWhatsAppMessage(e.target.value)}
                    placeholder="Digite a mensagem a ser enviada pelo WhatsApp..."
                    className="bg-emerald-900/50 border border-emerald-700 text-white px-2.5 py-1.5 rounded w-full focus:outline-hidden text-xs truncate"
                  />
                  <button
                    type="button"
                    onClick={handleSendWhatsAppNotification}
                    disabled={whatsAppSending}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-xs shrink-0 cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{whatsAppSending ? 'Enviando...' : 'Disparar'}</span>
                  </button>
                </div>
              </div>
            </div>

            {whatsAppStatus && (
              <div className="p-2.5 bg-emerald-900/90 border border-emerald-600 rounded text-emerald-200 text-xs font-semibold flex items-center justify-between animate-in fade-in">
                <span>{whatsAppStatus}</span>
                <button
                  type="button"
                  onClick={() => setWhatsAppStatus(null)}
                  className="text-emerald-400 hover:text-white ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 bg-slate-50 print:bg-white print:p-0 print:m-0 space-y-4">
          
          {/* Two-Stage Journey Notice Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <span className="font-bold text-amber-950">Fluxo em 2 Etapas (Retirada & Entrega): </span>
                <span className="text-amber-800">
                  Preencha a <strong>Retirada (Coleta)</strong> com a 1ª assinatura, clique em <strong>"Salvar Rascunho / Retirada"</strong> e complete a <strong>Entrega</strong> com a 2ª assinatura ao término da viagem.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                formStage === 'COMPLETO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'
              }`}>
                {formStage === 'COMPLETO' ? '✓ Viagem & Vistoria Completas' : '⏳ Etapa 1: Retirada / Em Trânsito'}
              </span>
            </div>
          </div>

          {/* Paper Container - styled like the official sheet */}
          <div className={`bg-white border-2 rounded-xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors ${
            activeVia === '2_VERDE' ? 'border-emerald-400 bg-emerald-50/20' : activeVia === '3_AMARELA' ? 'border-amber-400 bg-amber-50/20' : 'border-slate-800'
          }`}>
            
            {/* 1. OFFICIAL HEADER (ELO LOG) */}
            <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              
              {/* Logo & Company info */}
              <div className="flex items-center gap-4">
                <div className="bg-slate-950 text-white p-3 rounded-xl flex items-center justify-center font-black text-2xl tracking-tighter shadow-sm">
                  <div className="text-center leading-none">
                    <span className="block text-xl tracking-widest text-emerald-400">ELO</span>
                    <span className="block text-[9px] tracking-wider text-slate-400 font-bold">LOG</span>
                  </div>
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight uppercase">
                    ELO LOG TRANSPORTES LTDA
                  </h2>
                  <p className="text-[11px] text-slate-600 font-semibold">
                    CNPJ: 48.510.412/0001-06 • Insc. Est.: 718.258.628.113
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Rua Sete de Setembro, 3421 - CEP 15502-160 - Votuporanga/SP
                  </p>
                </div>
              </div>

              {/* Contacts & Talão Number */}
              <div className="flex flex-col sm:items-end text-left sm:text-right text-[11px] text-slate-700">
                <p className="font-bold text-slate-900">
                  JOSÉ CARLOS: (17) 99745.1176 | ADRIANO: (17) 99737.2190
                </p>
                <p className="text-slate-500">
                  @elotransportesltda • www.elologtransportes.com.br
                </p>
                
                {/* Talão Number Box */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Nº DO TALÃO:</span>
                  <div className="flex items-center border-2 border-rose-600 rounded px-2.5 py-0.5 bg-rose-50 text-rose-700 font-mono font-black text-base shadow-inner">
                    <span>Nº</span>
                    <input
                      type="text"
                      value={talaoNumber}
                      onChange={e => setTalaoNumber(e.target.value)}
                      className="w-16 text-center bg-transparent focus:outline-hidden font-mono font-black"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* 2. CLIENTE, CONTATOS (EMAIL E TELEFONE) E RETIRADA / ENTREGA */}
            <div className="border border-slate-400 rounded-lg p-3 bg-slate-50/50 space-y-2.5 text-xs">
              
              {/* Cliente, Email & Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-black text-slate-900 uppercase text-[11px] block mb-1">Cliente:</label>
                  <input
                    type="text"
                    value={cliente}
                    onChange={e => setCliente(e.target.value)}
                    placeholder="Nome da empresa contratante ou cliente"
                    className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-900 focus:border-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-[11px] block mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span>E-mail do Cliente / Notificação:</span>
                  </label>
                  <input
                    type="email"
                    value={clienteEmail}
                    onChange={e => setClienteEmail(e.target.value)}
                    placeholder="cliente@empresa.com.br"
                    className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-900 focus:border-slate-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-[11px] block mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>Telefone / WhatsApp:</span>
                  </label>
                  <input
                    type="text"
                    value={clienteTelefone}
                    onChange={e => setClienteTelefone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-900 focus:border-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Retirada (Etapa 1 - Início da Viagem) */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-amber-900 uppercase text-[11px] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>1. Retirada (Início da Viagem / Coleta)</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold">3ª Via Amarela</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-700 shrink-0">Data:</label>
                    <input
                      type="date"
                      value={dataRetirada}
                      onChange={e => setDataRetirada(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-medium text-slate-900 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-700 shrink-0">KM:</label>
                    <input
                      type="text"
                      value={kmRetirada}
                      onChange={e => setKmRetirada(e.target.value)}
                      placeholder="Ex: 142.500"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-medium text-slate-900 text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-700 shrink-0">Local:</label>
                    <input
                      type="text"
                      value={localRetirada}
                      onChange={e => setLocalRetirada(e.target.value)}
                      placeholder="Cidade / Unidade"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-medium text-slate-900 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-700 shrink-0">Tel Coleta:</label>
                    <input
                      type="text"
                      value={origemTelefone}
                      onChange={e => setOrigemTelefone(e.target.value)}
                      placeholder="(17) 99999-0000"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Entrega (Etapa 2 - Término da Viagem) */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-emerald-900 uppercase text-[11px] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>2. Entrega (Término da Viagem / Descarga)</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">2ª Via Verde</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-700 shrink-0">Data:</label>
                    <input
                      type="date"
                      value={dataEntrega}
                      onChange={e => setDataEntrega(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-medium text-slate-900 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-700 shrink-0">KM:</label>
                    <input
                      type="text"
                      value={kmEntrega}
                      onChange={e => setKmEntrega(e.target.value)}
                      placeholder="Ex: 143.200"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-medium text-slate-900 text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-700 shrink-0">Local:</label>
                    <input
                      type="text"
                      value={localEntrega}
                      onChange={e => setLocalEntrega(e.target.value)}
                      placeholder="Cidade / CD Destino"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-medium text-slate-900 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-700 shrink-0">Tel Entrega:</label>
                    <input
                      type="text"
                      value={destinoTelefone}
                      onChange={e => setDestinoTelefone(e.target.value)}
                      placeholder="(11) 98888-0000"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* 3. DADOS DO VEÍCULO */}
            <div className="border border-slate-400 rounded-lg p-3 bg-white space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-black text-slate-900 uppercase text-[11px]">Veículo:</span>
                {['Volkswagen', 'Mercedes-Benz', 'Iveco', 'Scania', 'Ford', 'Volvo'].map(marca => (
                  <label key={marca} className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800 hover:text-slate-950">
                    <input
                      type="radio"
                      name="marcaVeiculo"
                      value={marca}
                      checked={marcaVeiculo === marca}
                      onChange={() => setMarcaVeiculo(marca)}
                      className="w-4 h-4 text-slate-900"
                    />
                    <span>{marca}</span>
                  </label>
                ))}
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="radio"
                    name="marcaVeiculo"
                    value="Outro"
                    checked={marcaVeiculo === 'Outro'}
                    onChange={() => setMarcaVeiculo('Outro')}
                    className="w-4 h-4 text-slate-900"
                  />
                  <span>Outro:</span>
                </label>
                {marcaVeiculo === 'Outro' && (
                  <input
                    type="text"
                    value={outraMarca}
                    onChange={e => setOutraMarca(e.target.value)}
                    placeholder="Especifique..."
                    className="px-2 py-0.5 border border-slate-300 rounded text-xs"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-1.5">
                  <label className="font-bold text-slate-700 shrink-0">Modelo:</label>
                  <input
                    type="text"
                    value={modeloVeiculo}
                    onChange={e => setModeloVeiculo(e.target.value)}
                    placeholder="Ex: Atego 2426"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="font-bold text-slate-700 shrink-0">Cor:</label>
                  <input
                    type="text"
                    value={corVeiculo}
                    onChange={e => setCorVeiculo(e.target.value)}
                    placeholder="Ex: Branco"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="font-bold text-slate-700 shrink-0">Placa:</label>
                  <input
                    type="text"
                    value={placaVeiculo}
                    onChange={e => setPlacaVeiculo(e.target.value.toUpperCase())}
                    placeholder="BRA2E19"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-black uppercase"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="font-bold text-slate-700 shrink-0">Chassi:</label>
                  <input
                    type="text"
                    value={chassiVeiculo}
                    onChange={e => setChassiVeiculo(e.target.value)}
                    placeholder="9BWZZZ..."
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 4. DOCUMENTOS */}
            <div className="border border-slate-400 rounded-lg p-3 bg-slate-50/50 text-xs">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="font-black text-slate-900 uppercase text-[11px]">Documentos:</span>
                
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={docCRLV}
                    onChange={e => setDocCRLV(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>CRLV</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={docDanfeVeiculo}
                    onChange={e => setDocDanfeVeiculo(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Danfe Veículo</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={docManual}
                    onChange={e => setDocManual(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Manual</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={docDanfeEquipamento}
                    onChange={e => setDocDanfeEquipamento(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Danfe Equipamento</span>
                </label>
              </div>
            </div>

            {/* 5. AVARIAS (LATARIA, PINTURA, PARABRISA, INTERIOR, PNEUS) */}
            <div className="border border-slate-400 rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase text-[11px] flex items-center justify-between">
                <span>Vistoria de Avarias</span>
                <span className="text-[10px] font-normal text-slate-300">S = Sim (Avariado) / N = Não (Perfeito)</span>
              </div>

              <div className="divide-y divide-slate-300 bg-white">
                
                {/* 2 Column Layout for Avarias */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-300">
                  
                  {/* Left Column (Lataria, Pintura, Parabrisa) */}
                  <div className="divide-y divide-slate-200">
                    
                    {/* Lataria */}
                    <div className="p-2 flex items-center gap-2">
                      <span className="w-20 font-bold text-slate-900">Lataria</span>
                      <div className="flex items-center gap-2 shrink-0 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-rose-700 text-[11px]">
                          <input
                            type="radio"
                            name="avaria_lataria"
                            checked={avarias.lataria.hasAvaria === true}
                            onChange={() => setAvarias(prev => ({ ...prev, lataria: { ...prev.lataria, hasAvaria: true } }))}
                          />
                          <span>S</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-emerald-700 text-[11px]">
                          <input
                            type="radio"
                            name="avaria_lataria"
                            checked={avarias.lataria.hasAvaria === false}
                            onChange={() => setAvarias(prev => ({ ...prev, lataria: { ...prev.lataria, hasAvaria: false } }))}
                          />
                          <span>N</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="Observações da Lataria..."
                        value={avarias.lataria.obs}
                        onChange={e => setAvarias(prev => ({ ...prev, lataria: { ...prev.lataria, obs: e.target.value } }))}
                        className="flex-1 px-2 py-0.5 border border-slate-200 rounded text-xs"
                      />
                    </div>

                    {/* Pintura */}
                    <div className="p-2 flex items-center gap-2">
                      <span className="w-20 font-bold text-slate-900">Pintura</span>
                      <div className="flex items-center gap-2 shrink-0 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-rose-700 text-[11px]">
                          <input
                            type="radio"
                            name="avaria_pintura"
                            checked={avarias.pintura.hasAvaria === true}
                            onChange={() => setAvarias(prev => ({ ...prev, pintura: { ...prev.pintura, hasAvaria: true } }))}
                          />
                          <span>S</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-emerald-700 text-[11px]">
                          <input
                            type="radio"
                            name="avaria_pintura"
                            checked={avarias.pintura.hasAvaria === false}
                            onChange={() => setAvarias(prev => ({ ...prev, pintura: { ...prev.pintura, hasAvaria: false } }))}
                          />
                          <span>N</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="Observações da Pintura (riscos, amassados)..."
                        value={avarias.pintura.obs}
                        onChange={e => setAvarias(prev => ({ ...prev, pintura: { ...prev.pintura, obs: e.target.value } }))}
                        className="flex-1 px-2 py-0.5 border border-slate-200 rounded text-xs"
                      />
                    </div>

                    {/* Parabrisa */}
                    <div className="p-2 flex items-center gap-2">
                      <span className="w-20 font-bold text-slate-900">Parabrisa</span>
                      <div className="flex items-center gap-2 shrink-0 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-rose-700 text-[11px]">
                          <input
                            type="radio"
                            name="avaria_parabrisa"
                            checked={avarias.parabrisa.hasAvaria === true}
                            onChange={() => setAvarias(prev => ({ ...prev, parabrisa: { ...prev.parabrisa, hasAvaria: true } }))}
                          />
                          <span>S</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-emerald-700 text-[11px]">
                          <input
                            type="radio"
                            name="avaria_parabrisa"
                            checked={avarias.parabrisa.hasAvaria === false}
                            onChange={() => setAvarias(prev => ({ ...prev, parabrisa: { ...prev.parabrisa, hasAvaria: false } }))}
                          />
                          <span>N</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="Observações do Parabrisa (trincas, marcas)..."
                        value={avarias.parabrisa.obs}
                        onChange={e => setAvarias(prev => ({ ...prev, parabrisa: { ...prev.parabrisa, obs: e.target.value } }))}
                        className="flex-1 px-2 py-0.5 border border-slate-200 rounded text-xs"
                      />
                    </div>

                  </div>

                  {/* Right Column (Interior, Pneus, Quant/Marca) */}
                  <div className="divide-y divide-slate-200">
                    
                    {/* Interior */}
                    <div className="p-2 flex items-center gap-2">
                      <span className="w-20 font-bold text-slate-900">Interior</span>
                      <div className="flex items-center gap-2 shrink-0 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-rose-700 text-[11px]">
                          <input
                            type="radio"
                            name="avaria_interior"
                            checked={avarias.interior.hasAvaria === true}
                            onChange={() => setAvarias(prev => ({ ...prev, interior: { ...prev.interior, hasAvaria: true } }))}
                          />
                          <span>S</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-emerald-700 text-[11px]">
                          <input
                            type="radio"
                            name="avaria_interior"
                            checked={avarias.interior.hasAvaria === false}
                            onChange={() => setAvarias(prev => ({ ...prev, interior: { ...prev.interior, hasAvaria: false } }))}
                          />
                          <span>N</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="Observações do Interior / Estofamento..."
                        value={avarias.interior.obs}
                        onChange={e => setAvarias(prev => ({ ...prev, interior: { ...prev.interior, obs: e.target.value } }))}
                        className="flex-1 px-2 py-0.5 border border-slate-200 rounded text-xs"
                      />
                    </div>

                    {/* Pneus */}
                    <div className="p-2 flex items-center gap-2">
                      <span className="w-20 font-bold text-slate-900">Pneus</span>
                      <div className="flex items-center gap-2 shrink-0 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-rose-700 text-[11px]">
                          <input
                            type="radio"
                            name="avaria_pneus"
                            checked={avarias.pneus.hasAvaria === true}
                            onChange={() => setAvarias(prev => ({ ...prev, pneus: { ...prev.pneus, hasAvaria: true } }))}
                          />
                          <span>S</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-emerald-700 text-[11px]">
                          <input
                            type="radio"
                            name="avaria_pneus"
                            checked={avarias.pneus.hasAvaria === false}
                            onChange={() => setAvarias(prev => ({ ...prev, pneus: { ...prev.pneus, hasAvaria: false } }))}
                          />
                          <span>N</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="Observações do estado dos pneus..."
                        value={avarias.pneus.obs}
                        onChange={e => setAvarias(prev => ({ ...prev, pneus: { ...prev.pneus, obs: e.target.value } }))}
                        className="flex-1 px-2 py-0.5 border border-slate-200 rounded text-xs"
                      />
                    </div>

                    {/* *Pneus: Quantidade / Marca */}
                    <div className="p-2 bg-slate-50 flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-700 shrink-0">*Pneus: Quant:</span>
                      <input
                        type="text"
                        value={avarias.pneusQuant}
                        onChange={e => setAvarias(prev => ({ ...prev, pneusQuant: e.target.value }))}
                        className="w-16 px-2 py-0.5 bg-white border border-slate-300 rounded font-semibold text-center text-xs"
                      />
                      <span className="font-bold text-slate-700 shrink-0">Marca:</span>
                      <input
                        type="text"
                        value={avarias.pneusMarca}
                        onChange={e => setAvarias(prev => ({ ...prev, pneusMarca: e.target.value }))}
                        placeholder="Ex: Michelin / Pirelli"
                        className="flex-1 px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                      />
                    </div>

                  </div>

                </div>

              </div>
            </div>

            {/* 6. TABELA DE EQUIPAMENTOS (17 ITENS OFICIAIS DO MODELO) */}
            <div className="border border-slate-400 rounded-lg overflow-hidden text-xs">
              
              <div className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase text-[11px] flex items-center justify-between">
                <span>Equipamentos e Acessórios Obrigatórios</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetAllEquipamentos(true)}
                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    ✓ Marcar Todos como SIM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllEquipamentos(false)}
                    className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    ✗ Limpar
                  </button>
                </div>
              </div>

              {/* 2 Column Grid for 17 Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 bg-white">
                
                {/* Coluna 1 */}
                <div className="divide-y divide-slate-200">
                  {[
                    { key: 'chaveIgnicao', label: 'Chave Ignição' },
                    { key: 'chaveTanque', label: 'Chave Tanque' },
                    { key: 'chaveArla', label: 'Chave Arla' },
                    { key: 'chaveCopia', label: 'Chave Cópia' },
                    { key: 'extintor', label: 'Extintor' },
                    { key: 'radio', label: 'Rádio' },
                    { key: 'antena', label: 'Antena' },
                    { key: 'triangulo', label: 'Triângulo' },
                    { key: 'macaco', label: 'Macaco' },
                  ].map(item => (
                    <div key={item.key} className="px-3 py-1.5 flex items-center justify-between hover:bg-slate-50">
                      <span className="font-semibold text-slate-800">{item.label}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-emerald-700 text-[11px]">
                          <input
                            type="radio"
                            name={`eq_${item.key}`}
                            checked={equipamentos[item.key] === true}
                            onChange={() => setEquipamentos(prev => ({ ...prev, [item.key]: true }))}
                          />
                          <span>SIM</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-rose-700 text-[11px]">
                          <input
                            type="radio"
                            name={`eq_${item.key}`}
                            checked={equipamentos[item.key] === false}
                            onChange={() => setEquipamentos(prev => ({ ...prev, [item.key]: false }))}
                          />
                          <span>NÃO</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coluna 2 */}
                <div className="divide-y divide-slate-200">
                  {[
                    { key: 'chaveRoda', label: 'Chave de Roda c/ cabo' },
                    { key: 'tacografo', label: 'Tacógrafo' },
                    { key: 'pinoEngate', label: 'Pino de Engate' },
                    { key: 'farois', label: 'Faróis' },
                    { key: 'lanternas', label: 'Lanternas' },
                    { key: 'retrovisores', label: 'Retrovisores' },
                    { key: 'tampaBateria', label: 'Tampa Bateria' },
                    { key: 'bateria', label: 'Bateria' },
                    { key: 'estepe', label: 'Estepe (Pneu/Roda)' },
                  ].map(item => (
                    <div key={item.key} className="px-3 py-1.5 flex items-center justify-between hover:bg-slate-50">
                      <span className="font-semibold text-slate-800">{item.label}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-emerald-700 text-[11px]">
                          <input
                            type="radio"
                            name={`eq_${item.key}`}
                            checked={equipamentos[item.key] === true}
                            onChange={() => setEquipamentos(prev => ({ ...prev, [item.key]: true }))}
                          />
                          <span>SIM</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer font-bold text-rose-700 text-[11px]">
                          <input
                            type="radio"
                            name={`eq_${item.key}`}
                            checked={equipamentos[item.key] === false}
                            onChange={() => setEquipamentos(prev => ({ ...prev, [item.key]: false }))}
                          />
                          <span>NÃO</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>

            {/* 7. OBSERVAÇÕES GERAIS */}
            <div className="border border-slate-400 rounded-lg p-3 bg-white text-xs space-y-1.5">
              <label className="font-black text-slate-900 uppercase text-[11px] block">Observações:</label>
              <textarea
                rows={2}
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                placeholder="Ressalvas sobre o carregamento, condições climáticas, avarias pré-existentes ou instruções especiais..."
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-medium text-slate-900 text-xs focus:border-slate-800 focus:outline-hidden"
              />
            </div>

            {/* 8. FOTOS COMPROBATÓRIAS (MODERNO / COMPLEMENTAR) */}
            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-800 uppercase text-[11px] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Fotos Comprobatórias da Vistoria ({photos.length})</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  disabled={photoUploading}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs cursor-pointer flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{photoUploading ? 'Gravando...' : '+ Anexar / Tirar Foto'}</span>
                </button>
              </div>

              {photos.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {photos.map((p, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded px-2.5 py-1 flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                      <span>📸 {p}</span>
                      <button
                        type="button"
                        onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 9. ASSINATURAS DUPLAS (RETIRADA NA ORIGEM & ENTREGA NO DESTINO) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              
              {/* Responsável Vistoria (Origem / Retirada - 1ª Assinatura) */}
              <div className={`border-2 rounded-xl p-3 bg-white space-y-2.5 text-xs transition-colors ${
                origemAssinado ? 'border-amber-400 bg-amber-50/10' : 'border-slate-300'
              }`}>
                <div className="bg-amber-100/80 p-2 rounded-lg font-black text-amber-950 uppercase text-[11px] flex items-center justify-between border border-amber-200">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>1. Assinatura de Retirada (Origem)</span>
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">3ª Via Amarela</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 text-[11px]">Nome do Conferente:</label>
                    <input
                      type="text"
                      value={origemNome}
                      onChange={e => setOrigemNome(e.target.value)}
                      placeholder="Nome completo na coleta"
                      className="w-full px-2 py-1 border border-slate-300 rounded font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 text-[11px]">CPF:</label>
                    <input
                      type="text"
                      value={origemCpf}
                      onChange={e => setOrigemCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full px-2 py-1 border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 text-[11px]">E-mail para Cópia:</label>
                    <input
                      type="email"
                      value={origemEmail}
                      onChange={e => setOrigemEmail(e.target.value)}
                      placeholder="origem@empresa.com"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 text-[11px]">Telefone / Celular:</label>
                    <input
                      type="text"
                      value={origemTelefone}
                      onChange={e => setOrigemTelefone(e.target.value)}
                      placeholder="(17) 99999-0000"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>

                {/* Digital Signature Pad (Origem) */}
                <div className={`border-2 border-dashed rounded-xl p-3 text-center space-y-2 transition-colors ${
                  origemAssinado ? 'border-amber-400 bg-amber-50' : 'border-slate-300 bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-amber-700" />
                      <span>{origemAssinado ? '✓ Assinatura de Retirada Coletada' : 'Assinatura Digital de Retirada'}</span>
                    </span>
                    {origemDataAssinatura && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(origemDataAssinatura).toLocaleTimeString('pt-BR')}
                      </span>
                    )}
                  </div>

                  <div className="h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {origemAssinado ? (
                      <div className="flex items-center gap-2 text-amber-900 font-black italic text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Assinado por {origemNome || 'Responsável Coleta'} ({origemCpf || 'Identificado'})</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">
                        Clique abaixo para validar e assinar na tela
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!origemAssinado) {
                        setOrigemAssinado(true);
                        setOrigemDataAssinatura(new Date().toISOString());
                      } else {
                        setOrigemAssinado(false);
                        setOrigemDataAssinatura('');
                      }
                    }}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      origemAssinado
                        ? 'bg-amber-200 text-amber-950 hover:bg-amber-300'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <PenTool className="w-3 h-3" />
                    <span>{origemAssinado ? 'Limpar / Refazer Assinatura' : 'Coletar Assinatura de Retirada (1ª Assinatura)'}</span>
                  </button>
                </div>
              </div>

              {/* Responsável Vistoria (Destino / Entrega - 2ª Assinatura) */}
              <div className={`border-2 rounded-xl p-3 bg-white space-y-2.5 text-xs transition-colors ${
                destinoAssinado ? 'border-emerald-400 bg-emerald-50/10' : 'border-slate-300'
              }`}>
                <div className="bg-emerald-100/80 p-2 rounded-lg font-black text-emerald-950 uppercase text-[11px] flex items-center justify-between border border-emerald-200">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>2. Assinatura de Entrega (Destino)</span>
                  </span>
                  <span className="text-[10px] text-emerald-800 font-bold">2ª Via Verde</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 text-[11px]">Nome do Recebedor:</label>
                    <input
                      type="text"
                      value={destinoNome}
                      onChange={e => setDestinoNome(e.target.value)}
                      placeholder="Nome completo na entrega"
                      className="w-full px-2 py-1 border border-slate-300 rounded font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 text-[11px]">CPF:</label>
                    <input
                      type="text"
                      value={destinoCpf}
                      onChange={e => setDestinoCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full px-2 py-1 border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 text-[11px]">E-mail para Cópia:</label>
                    <input
                      type="email"
                      value={destinoEmail}
                      onChange={e => setDestinoEmail(e.target.value)}
                      placeholder="recebedor@destino.com"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 text-[11px]">Telefone / Celular:</label>
                    <input
                      type="text"
                      value={destinoTelefone}
                      onChange={e => setDestinoTelefone(e.target.value)}
                      placeholder="(11) 98888-0000"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>

                {/* Digital Signature Pad (Destino) */}
                <div className={`border-2 border-dashed rounded-xl p-3 text-center space-y-2 transition-colors ${
                  destinoAssinado ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{destinoAssinado ? '✓ Assinatura de Entrega Coletada' : 'Assinatura Digital de Entrega'}</span>
                    </span>
                    {destinoDataAssinatura && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(destinoDataAssinatura).toLocaleTimeString('pt-BR')}
                      </span>
                    )}
                  </div>

                  <div className="h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {destinoAssinado ? (
                      <div className="flex items-center gap-2 text-emerald-950 font-black italic text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Assinado por {destinoNome || 'Recebedor'} ({destinoCpf || 'Identificado'})</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">
                        Preenchido e assinado ao término da viagem no destino
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!destinoAssinado) {
                        setDestinoAssinado(true);
                        setDestinoDataAssinatura(new Date().toISOString());
                      } else {
                        setDestinoAssinado(false);
                        setDestinoDataAssinatura('');
                      }
                    }}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      destinoAssinado
                        ? 'bg-emerald-200 text-emerald-950 hover:bg-emerald-300'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    <PenTool className="w-3 h-3" />
                    <span>{destinoAssinado ? 'Limpar / Refazer Assinatura' : 'Coletar Assinatura de Entrega (2ª Assinatura)'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Condutor da ELO e Telefone do Motorista */}
            <div className="border border-slate-400 rounded-lg p-3 bg-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1">
                <label className="font-black text-slate-900 uppercase text-[11px] shrink-0">Condutor da ELO:</label>
                <input
                  type="text"
                  value={condutorNome}
                  onChange={e => setCondutorNome(e.target.value)}
                  placeholder="Nome completo do motorista condutor"
                  className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="font-bold text-slate-700 text-[11px] shrink-0 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>Tel Motorista:</span>
                </label>
                <input
                  type="text"
                  value={condutorTelefone}
                  onChange={e => setCondutorTelefone(e.target.value)}
                  placeholder="(17) 99999-0000"
                  className="w-36 px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
            </div>

            {/* 10. RODAPÉ DE VIAS OFICIAIS */}
            <div className="pt-2 text-center text-[11px] font-bold text-slate-500 border-t border-slate-300 flex flex-wrap items-center justify-center gap-4">
              <span className="text-slate-800">1ª Via Branca - ELO LOG (Administrativo)</span>
              <span>•</span>
              <span className="text-emerald-700">2ª Via Verde - Entrega (Destinatário)</span>
              <span>•</span>
              <span className="text-amber-700">3ª Via Amarela - Retirada (Remetente)</span>
            </div>

          </div>

        </div>

        {/* Modal Actions Footer with Dual Save Options */}
        <div className="bg-slate-100 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            {existingResponseId ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Rascunho vinculado a este frete (Etapa: {formStage})</span>
              </span>
            ) : (
              <span>Preencha e salve a retirada para iniciar o frete e complete a entrega ao descarregar.</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
            >
              Fechar
            </button>

            {/* BOTAO DE SALVAMENTO PARA COMPLETAR AO TERMINO DA VIAGEM */}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={savingDraft || submitting}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              title="Salva os dados atuais e a assinatura de retirada para completar a entrega mais tarde"
            >
              <Save className="w-4 h-4" />
              <span>{savingDraft ? 'Salvando Rascunho...' : 'Salvar Etapa (Completar no Término)'}</span>
            </button>

            {/* BOTAO DE CONCLUSAO FINAL */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || savingDraft}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Gravando Vistoria...' : 'Concluir Vistoria Final'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* WhatsApp Configuration Modal */}
      <WhatsAppConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </div>
  );
};
