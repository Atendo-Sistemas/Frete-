import React, { useState, useRef, useEffect } from 'react';
import { FormDefinition, Freight } from '../../types';
import { api, isOfflineMode } from '../../services/api';
import { WhatsAppConfigModal } from '../common/WhatsAppConfigModal';
import { generateChecklistPdf } from '../../utils/checklistPdfGenerator';
import { scanQrAndBarcodeFromCanvas, parseBrazilianPlateFromText } from '../../utils/barcodeAndPlateScanner';
import { compressImageFile } from '../../utils/imageCompression';
import { 
  X, 
  Printer, 
  Check, 
  Camera, 
  PenTool, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Save, 
  MessageCircle, 
  Mail, 
  Phone, 
  Clock, 
  Send, 
  UserCheck, 
  Settings,
  Lock,
  Eye,
  Trash2,
  RefreshCw,
  Copy,
  ExternalLink,
  Smartphone,
  ZoomIn,
  FileDown,
  Share2,
  QrCode,
  Scan,
  WifiOff,
  Upload
} from 'lucide-react';

interface EloLogChecklistModalProps {
  form?: FormDefinition;
  freightId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

// Helpers to mask sensitive personal and document data (LGPD compliant)
export const maskCpf = (cpf: string): string => {
  if (!cpf) return '***.***.***-**';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length === 11) {
    return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`;
  }
  if (clean.length >= 6) {
    return `***.${clean.slice(2, 5)}***-**`;
  }
  return '***.***.***-**';
};

export const maskChassi = (chassi: string): string => {
  if (!chassi) return '***';
  const clean = chassi.trim();
  if (clean.length >= 8) {
    return `${clean.slice(0, 3)}***${clean.slice(-4)}`;
  }
  return '***';
};

export const maskPhone = (phone: string): string => {
  if (!phone) return '(**) *****-****';
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 10) {
    const ddd = clean.slice(0, 2);
    const end = clean.slice(-4);
    return `(${ddd}) 9****-${end}`;
  }
  return '(**) *****-****';
};

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
  const [isDirty, setIsDirty] = useState(false);

  // Document control number (Sequential: 001, 002, 003...)
  const [talaoNumber, setTalaoNumber] = useState<string>('001');

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
  const [origemSignatureImage, setOrigemSignatureImage] = useState<string | null>(null);

  const [destinoNome, setDestinoNome] = useState('');
  const [destinoCpf, setDestinoCpf] = useState('');
  const [destinoEmail, setDestinoEmail] = useState('');
  const [destinoAssinado, setDestinoAssinado] = useState(false);
  const [destinoDataAssinatura, setDestinoDataAssinatura] = useState('');
  const [destinoSignatureImage, setDestinoSignatureImage] = useState<string | null>(null);

  const [condutorNome, setCondutorNome] = useState('');
  const [condutorTelefone, setCondutorTelefone] = useState('');

  // Photos (Array of Data URLs / Base64 images)
  const [photos, setPhotos] = useState<string[]>([]);
  const [activePhotoPreview, setActivePhotoPreview] = useState<string | null>(null);

  // Live Camera Viewfinder State & Scanner Modes (Foto / QR Code & Barcode / OCR Placa)
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'PHOTO' | 'BARCODE_QR' | 'OCR_PLATE'>('PHOTO');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [scanFeedback, setScanFeedback] = useState<{ type: string; message: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scanIntervalRef = useRef<any>(null);

  // Signature Draw Pad State (Modal)
  const [signatureModalTarget, setSignatureModalTarget] = useState<'ORIGEM' | 'DESTINO' | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Exit Safety Confirmation Modal
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Offline Origin Signature Warning Modal (Requirement: guide driver to notify signer and offer WhatsApp PDF)
  const [showOfflineOriginWarning, setShowOfflineOriginWarning] = useState(false);
  const [isOfflineDetected, setIsOfflineDetected] = useState(false);

  // Post-Save Digital Receipt / Dispatch Modal (Email & WhatsApp)
  const [dispatchReceiptModal, setDispatchReceiptModal] = useState<{
    open: boolean;
    stage: 'RETIRADA' | 'ENTREGA';
    recipientName: string;
    recipientEmail: string;
    recipientPhone: string;
    emailStatus: string;
    whatsappLink: string;
    receiptText: string;
  } | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // PDF Exporting State
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // WhatsApp Config Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showWhatsAppPanel, setShowWhatsAppPanel] = useState(false);
  const [whatsAppRecipient, setWhatsAppRecipient] = useState('');
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [whatsAppSending, setWhatsAppSending] = useState(false);
  const [whatsAppStatus, setWhatsAppStatus] = useState<string | null>(null);

  // IMMUTABILITY RULES:
  // Once the Origin inspection has been signed and saved in the database, the Origin fields are locked!
  const isOrigemLocked = Boolean(existingResponseId && origemAssinado);
  // Once final delivery is completed and saved, the whole form is locked
  const isDestinoLocked = Boolean(existingResponseId && destinoAssinado && formStage === 'COMPLETO');

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
              if (ans.origem.signatureImage) setOrigemSignatureImage(ans.origem.signatureImage);
            }
            if (ans.destino) {
              if (ans.destino.nome) setDestinoNome(ans.destino.nome);
              if (ans.destino.cpf) setDestinoCpf(ans.destino.cpf);
              if (ans.destino.email) setDestinoEmail(ans.destino.email);
              if (ans.destino.telefone) setDestinoTelefone(ans.destino.telefone);
              if (ans.destino.assinado !== undefined) setDestinoAssinado(ans.destino.assinado);
              if (ans.destino.dataAssinatura) setDestinoDataAssinatura(ans.destino.dataAssinatura);
              if (ans.destino.signatureImage) setDestinoSignatureImage(ans.destino.signatureImage);
            }
            if (ans.condutor) setCondutorNome(ans.condutor);
            if (ans.condutorTelefone) setCondutorTelefone(ans.condutorTelefone);
            if (ans.photos) setPhotos(ans.photos);
          } else {
            api.getNextTalaoNumber()
              .then(res => {
                if (res && res.nextNumber) setTalaoNumber(res.nextNumber);
              })
              .catch(e => console.warn('Could not fetch next talao number:', e));
          }
        })
        .catch(err => console.error('Erro ao carregar contexto de vistoria:', err))
        .finally(() => {
          setLoadingFreight(false);
          setIsDirty(false);
        });
    } else {
      api.getNextTalaoNumber()
        .then(res => {
          if (res && res.nextNumber) setTalaoNumber(res.nextNumber);
        })
        .catch(e => console.warn('Could not fetch next talao number:', e));
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

  // Window beforeunload guard to protect unsaved form edits
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Você possui respostas não salvas no checklist.';
        return 'Você possui respostas não salvas no checklist.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle Mark All equipments
  const handleSetAllEquipamentos = (value: boolean) => {
    if (isOrigemLocked) return;
    setIsDirty(true);
    const updated: Record<string, boolean> = {};
    Object.keys(equipamentos).forEach(key => {
      updated[key] = value;
    });
    setEquipamentos(updated);
  };

  // Build answer payload with complete state and signatures
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
        dataAssinatura: origemDataAssinatura || (origemAssinado ? new Date().toISOString() : null),
        signatureImage: origemSignatureImage
      },
      destino: { 
        nome: destinoNome, 
        cpf: destinoCpf, 
        email: destinoEmail,
        telefone: destinoTelefone,
        assinado: destinoAssinado,
        dataAssinatura: destinoDataAssinatura || (destinoAssinado ? new Date().toISOString() : null),
        signatureImage: destinoSignatureImage
      },
      condutor: condutorNome,
      condutorTelefone,
      photos,
      photosCount: photos.length,
      isDraft: isDraftSave,
      submittedAt: new Date().toISOString()
    };
  };

  // Helper to generate the masked formatted WhatsApp / Email Receipt text
  const generateReceiptSummary = (stage: 'RETIRADA' | 'ENTREGA') => {
    const pl = placaVeiculo || 'VEÍCULO';
    const mod = modeloVeiculo || marcaVeiculo || 'Caminhão';
    const chassiM = maskChassi(chassiVeiculo);
    const codeStr = freight?.code ? `Frete #${freight.code}` : `Talão Nº ${talaoNumber}`;
    const timestampStr = new Date().toLocaleString('pt-BR');
    const appDomain = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://portaldefretes.com.br';

    if (stage === 'RETIRADA') {
      const respNome = origemNome || 'Responsável Coleta';
      const respCpfM = maskCpf(origemCpf);
      return (
        `📋 *COMPROVANTE DIGITAL DE VISTORIA E RETIRADA (SAÍDA)*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🏢 *ELO LOG TRANSPORTES LTDA*\n` +
        `🔖 *Talão Oficial:* Nº ${talaoNumber} (${codeStr})\n` +
        `📅 *Data/Hora:* ${timestampStr}\n\n` +
        `🚛 *DADOS DO VEÍCULO & CARGA:*\n` +
        `• Veículo: ${marcaVeiculo} ${mod}\n` +
        `• Placa: ${pl} | Chassi: ${chassiM}\n` +
        `• KM Retirada: ${kmRetirada || 'Conferido'}\n` +
        `• Local Coleta: ${localRetirada || 'Origem'}\n` +
        `• Condutor ELO: ${condutorNome || 'Motorista Designado'}\n\n` +
        `✍️ *VALIDAÇÃO DA ORIGEM (SAÍDA):*\n` +
        `• Conferente: ${respNome}\n` +
        `• Documento: ${respCpfM}\n` +
        `• Assinatura: ✅ Registrada e Bloqueada Digitalmente\n` +
        `• Fotos Anexadas: ${photos.length} fotos de vistoria\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🌐 *Acesso ao Portal:* ${appDomain}\n` +
        `🔒 *Comprovante autenticado no sistema ELO LOG.* Guarde este registro para conferência.`
      );
    } else {
      const respNome = destinoNome || 'Recebedor';
      const respCpfM = maskCpf(destinoCpf);
      return (
        `🏁 *COMPROVANTE DIGITAL DE ENTREGA E VISTORIA FINAL*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🏢 *ELO LOG TRANSPORTES LTDA*\n` +
        `🔖 *Talão Oficial:* Nº ${talaoNumber} (${codeStr})\n` +
        `📅 *Data/Hora:* ${timestampStr}\n\n` +
        `🚛 *RESUMO DA VIAGEM:*\n` +
        `• Veículo: ${marcaVeiculo} ${mod} (Placa: ${pl})\n` +
        `• KM Entrega: ${kmEntrega || 'Registrado'} (KM Coleta: ${kmRetirada || '0'})\n` +
        `• Local Descarga: ${localEntrega || 'Destino'}\n` +
        `• Condutor: ${condutorNome || 'Motorista ELO'}\n\n` +
        `✍️ *VALIDAÇÃO DE DESTINO (ENTREGA):*\n` +
        `• Recebedor: ${respNome}\n` +
        `• Documento: ${respCpfM}\n` +
        `• Status: ✅ Vistoria Final Aprovada e Assinada\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🌐 *Acesso ao Portal:* ${appDomain}\n` +
        `🔒 *Operação finalizada com sucesso no portal ELO LOG.*`
      );
    }
  };

  // SALVAR RASCUNHO / RETIRADA (1ª ETAPA)
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
      setIsDirty(false);

      // Check if device is offline when saving
      const isOff = isOfflineMode ? isOfflineMode() : !navigator.onLine;
      setIsOfflineDetected(isOff);

      // Trigger automatic dispatch and generate receipt for the origin party
      const receiptText = generateReceiptSummary('RETIRADA');
      const targetEmail = origemEmail || clienteEmail;
      const targetPhone = origemTelefone || clienteTelefone;

      if (isOff) {
        // Offline specific flow: open warning modal for driver to notify signer
        setShowOfflineOriginWarning(true);
      } else {
        try {
          const dispatchRes = await api.sendChecklistDispatch({
            responseId: response.id,
            stage: 'RETIRADA',
            talaoNumber,
            freightCode: freight?.code,
            recipientType: 'ORIGEM',
            recipientName: origemNome || cliente,
            recipientEmail: targetEmail,
            recipientPhone: targetPhone,
            receiptText
          });

          // Open Digital Receipt / Notification Modal
          setDispatchReceiptModal({
            open: true,
            stage: 'RETIRADA',
            recipientName: origemNome || cliente || 'Responsável pela Saída',
            recipientEmail: targetEmail,
            recipientPhone: targetPhone,
            emailStatus: dispatchRes.emailStatus,
            whatsappLink: dispatchRes.whatsappLink,
            receiptText
          });
        } catch (dispErr) {
          console.warn('Erro ao disparar recibo automático:', dispErr);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar rascunho de vistoria');
    } finally {
      setSavingDraft(false);
    }
  };

  // SUBMISSAO FINAL / ENTREGA (2ª ETAPA)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinoAssinado) {
      alert('Por favor, colete a assinatura de entrega (Destino) antes de concluir a vistoria final.');
      return;
    }

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
      setIsDirty(false);

      // Trigger automatic dispatch for destination
      const receiptText = generateReceiptSummary('ENTREGA');
      const targetEmail = destinoEmail || clienteEmail;
      const targetPhone = destinoTelefone || clienteTelefone;

      try {
        const dispatchRes = await api.sendChecklistDispatch({
          responseId: response.id,
          stage: 'ENTREGA',
          talaoNumber,
          freightCode: freight?.code,
          recipientType: 'DESTINO',
          recipientName: destinoNome || cliente,
          recipientEmail: targetEmail,
          recipientPhone: targetPhone,
          receiptText
        });

        setDispatchReceiptModal({
          open: true,
          stage: 'ENTREGA',
          recipientName: destinoNome || cliente || 'Recebedor no Destino',
          recipientEmail: targetEmail,
          recipientPhone: targetPhone,
          emailStatus: dispatchRes.emailStatus,
          whatsappLink: dispatchRes.whatsappLink,
          receiptText
        });
      } catch (dispErr) {
        console.warn('Erro ao disparar recibo automático de entrega:', dispErr);
      }

      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar vistoria completa');
    } finally {
      setSubmitting(false);
    }
  };

  // Real-time scanner processing interval for Barcode/QR & Plate OCR
  useEffect(() => {
    if (!isCameraOpen || capturedSnapshot) {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      return;
    }

    if (cameraMode === 'BARCODE_QR' || cameraMode === 'OCR_PLATE') {
      scanIntervalRef.current = setInterval(() => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (cameraMode === 'BARCODE_QR') {
          const scan = scanQrAndBarcodeFromCanvas(canvas);
          if (scan && scan.text) {
            setScanFeedback({
              type: 'success',
              message: `Código detectado: ${scan.text.slice(0, 32)}`
            });
            if (scan.text.length <= 15 && /^[A-Z0-9-]+$/i.test(scan.text)) {
              setTalaoNumber(scan.text);
            } else {
              setObservacoes(prev => prev ? `${prev}\n[Doc/Chave]: ${scan.text}` : `[Doc/Chave]: ${scan.text}`);
            }
            setIsDirty(true);
            setTimeout(() => {
              handleStopCamera();
            }, 1200);
          }
        } else if (cameraMode === 'OCR_PLATE') {
          // Plate recognition from image frame
          if (placaVeiculo) {
            const detected = parseBrazilianPlateFromText(placaVeiculo);
            if (detected) {
              setScanFeedback({
                type: 'success',
                message: `Placa validada: ${detected}`
              });
            }
          }
        }
      }, 700);
    }

    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [isCameraOpen, cameraMode, capturedSnapshot, placaVeiculo]);

  // PDF Export and WhatsApp Share Flow
  const handleExportPdf = async (action: 'DOWNLOAD' | 'PRINT' | 'SHARE_WHATSAPP') => {
    setIsExportingPdf(true);
    try {
      const answers = buildAnswersPayload(formStage !== 'COMPLETO');
      const responsePayload = {
        id: existingResponseId || `temp-${Date.now()}`,
        formId: form?.id || 'form-checklist-elolog',
        freightId,
        stage: formStage,
        answers,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await generateChecklistPdf(responsePayload as any, freight || undefined);

      if (action === 'DOWNLOAD') {
        const link = document.createElement('a');
        link.href = result.blobUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (action === 'PRINT') {
        const printWindow = window.open(result.blobUrl, '_blank');
        if (printWindow) {
          printWindow.focus();
        } else {
          window.print();
        }
      } else if (action === 'SHARE_WHATSAPP') {
        const summary = generateReceiptSummary(formStage === 'COMPLETO' ? 'ENTREGA' : 'RETIRADA');
        const phone = (formStage === 'COMPLETO' ? destinoTelefone : origemTelefone) || clienteTelefone;
        const cleanPhone = phone.replace(/\D/g, '');
        const phoneWithDDI = cleanPhone ? (cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`) : '';
        
        const fullMessage = `${summary}\n\n📄 *Laudo Oficial em PDF:* Checklist_ELOLOG_${talaoNumber}.pdf\n⬇️ *Documento salvo e validado digitalmente.*`;
        
        const whatsappUrl = phoneWithDDI 
          ? `https://api.whatsapp.com/send?phone=${phoneWithDDI}&text=${encodeURIComponent(fullMessage)}`
          : `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`;
        
        window.open(whatsappUrl, '_blank');
      }
    } catch (err: any) {
      console.error('Erro ao gerar laudo PDF:', err);
      alert('Falha ao processar PDF do checklist: ' + (err.message || 'Erro interno'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  // EXIT SAFETY GUARD: Checks if form has unsaved edits
  const handleRequestClose = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  // CAMERA VIEWFINDER HANDLERS
  const handleStartCamera = async () => {
    setIsCameraOpen(true);
    setCapturedSnapshot(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Could not access direct webcam stream, falling back to file input:', err);
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleStopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
    setCapturedSnapshot(null);
  };

  const handleCapturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedSnapshot(dataUrl);
      }
    }
  };

  const handleAcceptCapturedPhoto = () => {
    if (capturedSnapshot) {
      setPhotos(prev => [...prev, capturedSnapshot]);
      setIsDirty(true);
      handleStopCamera();
    }
  };

  // Handle standard file upload / camera capture from file input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(async (file: File) => {
        try {
          const compressed = await compressImageFile(file, { quality: 0.8, maxWidth: 1600, maxHeight: 1600 });
          setPhotos(prev => [...prev, compressed]);
          setIsDirty(true);
        } catch {
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            if (uploadEvent.target?.result) {
              setPhotos(prev => [...prev, uploadEvent.target!.result as string]);
              setIsDirty(true);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
    if (e.target) e.target.value = '';
  };

  // SIGNATURE CANVAS HANDLERS
  const handleOpenSignatureModal = (target: 'ORIGEM' | 'DESTINO') => {
    if (target === 'ORIGEM' && isOrigemLocked) return;
    if (target === 'DESTINO' && isDestinoLocked) return;

    setSignatureModalTarget(target);
    setTimeout(() => {
      if (signatureCanvasRef.current) {
        const canvas = signatureCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }
    }, 100);
  };

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const handleEndDraw = () => {
    setIsDrawing(false);
  };

  const handleClearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleConfirmSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas && signatureModalTarget) {
      const dataUrl = canvas.toDataURL('image/png');
      const now = new Date().toISOString();
      setIsDirty(true);
      if (signatureModalTarget === 'ORIGEM') {
        setOrigemAssinado(true);
        setOrigemDataAssinatura(now);
        setOrigemSignatureImage(dataUrl);
      } else {
        setDestinoAssinado(true);
        setDestinoDataAssinatura(now);
        setDestinoSignatureImage(dataUrl);
      }
      setSignatureModalTarget(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl max-w-4xl w-full my-auto max-h-[96vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden relative">
        
        {/* Hidden File Input for Mobile / Fallback Camera */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          capture="environment" 
          multiple
          className="hidden" 
          onChange={handleFileInputChange} 
        />

        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="bg-emerald-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded shrink-0">
              DIGITAL & IMPRESSÃO
            </span>
            <span className="text-xs sm:text-sm font-bold truncate">
              Checklist Oficial de Vistoria • ELO LOG
            </span>
            {lastSavedAt && (
              <span className="hidden lg:inline text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded shrink-0">
                Salvo às {lastSavedAt}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Via Selector Pill */}
            <div className="hidden sm:flex items-center bg-slate-800 p-1 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveVia('1_BRANCA')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${activeVia === '1_BRANCA' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'}`}
              >
                1ª Via (ELO)
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

            {/* Download PDF button */}
            <button
              type="button"
              onClick={() => handleExportPdf('DOWNLOAD')}
              disabled={isExportingPdf}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
              title="Baixar Laudo de Vistoria em PDF Oficial"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isExportingPdf ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>

            {/* Quick Save Etapa Button in Top Bar */}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={savingDraft || submitting}
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
              title="Salvar respostas preenchidas no banco de dados"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{savingDraft ? 'Salvando...' : 'Salvar Etapa'}</span>
            </button>

            {/* WhatsApp Integration Toggle Button */}
            <button
              type="button"
              onClick={() => handleExportPdf('SHARE_WHATSAPP')}
              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Compartilhar Laudo PDF via WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden md:inline">WhatsApp</span>
            </button>

            <button
              onClick={() => handleExportPdf('PRINT')}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Imprimir Modelo de Talão"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline">Imprimir</span>
            </button>

            <button
              onClick={handleRequestClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              title="Fechar (Validação de Salvamento)"
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
                  <span>Configurar API</span>
                </button>
              </div>
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
                <label className="block text-emerald-300 font-semibold mb-1">Mensagem Formatada (Dados Mascarados):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={whatsAppMessage}
                    onChange={e => setWhatsAppMessage(e.target.value)}
                    placeholder="Mensagem do comprovante..."
                    className="bg-emerald-900/50 border border-emerald-700 text-white px-2.5 py-1.5 rounded w-full focus:outline-hidden text-xs truncate"
                  />
                  <a
                    href={`https://api.whatsapp.com/send?phone=${whatsAppRecipient.replace(/\D/g, '')}&text=${encodeURIComponent(whatsAppMessage)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-xs shrink-0 cursor-pointer flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Abrir Zap</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 bg-slate-50 print:bg-white print:p-0 print:m-0 space-y-4">
          
          {/* IMMUTABILITY / STAGE STATUS BANNER */}
          {isOrigemLocked ? (
            <div className="bg-emerald-900 text-emerald-100 border border-emerald-700 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-800 text-emerald-300 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-1.5">
                    <span>🔒 Vistoria de Retirada (Origem) Assinada e Bloqueada</span>
                    <span className="bg-emerald-700 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">Talão #{talaoNumber}</span>
                  </div>
                  <p className="text-emerald-200 mt-0.5">
                    Para garantir a segurança jurídica entre as partes, os dados de saída e a 1ª assinatura foram congelados no banco de dados e não podem mais ser alterados.
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right font-mono text-[11px] text-emerald-300">
                {origemDataAssinatura && (
                  <span>Assinado em: {new Date(origemDataAssinatura).toLocaleDateString()} às {new Date(origemDataAssinatura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <span className="font-bold text-amber-950">Fluxo Oficial em 2 Etapas: </span>
                  <span className="text-amber-800">
                    Preencha e colete a assinatura de <strong>Retirada (Coleta)</strong>, clique em <strong>"Salvar Etapa (Completar no Término)"</strong> para iniciar a viagem com os dados gravados. Ao descarregar, colete a <strong>Assinatura de Entrega</strong>.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900">
                  ⏳ 1ª Etapa: Retirada / Saída
                </span>
              </div>
            </div>
          )}

          {/* Paper Container - styled like official document */}
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
                      disabled={isOrigemLocked}
                      value={talaoNumber}
                      onChange={e => {
                        setIsDirty(true);
                        setTalaoNumber(e.target.value);
                      }}
                      className="w-16 text-center bg-transparent focus:outline-hidden font-mono font-black disabled:opacity-80"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* 2. CLIENTE, CONTATOS E RETIRADA / ENTREGA */}
            <div className="border border-slate-400 rounded-lg p-3 bg-slate-50/50 space-y-2.5 text-xs">
              
              {/* Cliente, Email & Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="font-black text-slate-900 uppercase text-[11px] block mb-1">Cliente:</label>
                  <input
                    type="text"
                    disabled={isOrigemLocked}
                    value={cliente}
                    onChange={e => { setIsDirty(true); setCliente(e.target.value); }}
                    placeholder="Nome da empresa contratante ou cliente"
                    className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-900 focus:border-slate-800 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-[11px] block mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span>E-mail do Cliente / Notificação:</span>
                  </label>
                  <input
                    type="email"
                    disabled={isOrigemLocked}
                    value={clienteEmail}
                    onChange={e => { setIsDirty(true); setClienteEmail(e.target.value); }}
                    placeholder="cliente@empresa.com.br"
                    className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-900 focus:border-slate-800 focus:outline-hidden disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-[11px] block mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>Telefone / WhatsApp:</span>
                  </label>
                  <input
                    type="text"
                    disabled={isOrigemLocked}
                    value={clienteTelefone}
                    onChange={e => { setIsDirty(true); setClienteTelefone(e.target.value); }}
                    placeholder="(00) 00000-0000"
                    className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-900 focus:border-slate-800 focus:outline-hidden disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* Retirada (Etapa 1 - Início da Viagem) */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-amber-900 uppercase text-[11px] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>1. Retirada (Início da Viagem / Coleta)</span>
                    {isOrigemLocked && <Lock className="w-3 h-3 text-emerald-700 ml-1 inline" />}
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold">3ª Via Amarela</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-700 shrink-0">Data:</label>
                    <input
                      type="date"
                      disabled={isOrigemLocked}
                      value={dataRetirada}
                      onChange={e => { setIsDirty(true); setDataRetirada(e.target.value); }}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-medium text-slate-900 text-xs disabled:bg-slate-100"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-700 shrink-0">KM:</label>
                    <input
                      type="text"
                      disabled={isOrigemLocked}
                      value={kmRetirada}
                      onChange={e => { setIsDirty(true); setKmRetirada(e.target.value); }}
                      placeholder="Ex: 142.500"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-medium text-slate-900 text-xs font-mono font-bold disabled:bg-slate-100"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-700 shrink-0">Local:</label>
                    <input
                      type="text"
                      disabled={isOrigemLocked}
                      value={localRetirada}
                      onChange={e => { setIsDirty(true); setLocalRetirada(e.target.value); }}
                      placeholder="Cidade / Unidade"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-medium text-slate-900 text-xs disabled:bg-slate-100"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-700 shrink-0">Tel Coleta:</label>
                    <input
                      type="text"
                      disabled={isOrigemLocked}
                      value={origemTelefone}
                      onChange={e => { setIsDirty(true); setOrigemTelefone(e.target.value); }}
                      placeholder="(17) 99999-0000"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs disabled:bg-slate-100"
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
                    {isDestinoLocked && <Lock className="w-3 h-3 text-emerald-700 ml-1 inline" />}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">2ª Via Verde</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-700 shrink-0">Data:</label>
                    <input
                      type="date"
                      disabled={isDestinoLocked}
                      value={dataEntrega}
                      onChange={e => { setIsDirty(true); setDataEntrega(e.target.value); }}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-medium text-slate-900 text-xs disabled:bg-slate-100"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-700 shrink-0">KM:</label>
                    <input
                      type="text"
                      disabled={isDestinoLocked}
                      value={kmEntrega}
                      onChange={e => { setIsDirty(true); setKmEntrega(e.target.value); }}
                      placeholder="Ex: 143.200"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-medium text-slate-900 text-xs font-mono font-bold disabled:bg-slate-100"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-700 shrink-0">Local:</label>
                    <input
                      type="text"
                      disabled={isDestinoLocked}
                      value={localEntrega}
                      onChange={e => { setIsDirty(true); setLocalEntrega(e.target.value); }}
                      placeholder="Cidade / Unidade"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-medium text-slate-900 text-xs disabled:bg-slate-100"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-700 shrink-0">Tel Entrega:</label>
                    <input
                      type="text"
                      disabled={isDestinoLocked}
                      value={destinoTelefone}
                      onChange={e => { setIsDirty(true); setDestinoTelefone(e.target.value); }}
                      placeholder="(11) 98888-0000"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* 3. DADOS DO VEÍCULO */}
            <div className="border border-slate-400 rounded-lg p-3 bg-white space-y-2 text-xs">
              <div className="font-black text-slate-900 uppercase text-[11px] flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-700" />
                  <span>Veículo</span>
                </span>
                {isOrigemLocked && <span className="text-[10px] text-slate-500 font-mono">🔒 Bloqueado após saída</span>}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div>
                  <label className="font-bold text-slate-700 text-[11px] block">Marca:</label>
                  <select
                    disabled={isOrigemLocked}
                    value={marcaVeiculo}
                    onChange={e => { setIsDirty(true); setMarcaVeiculo(e.target.value); }}
                    className="w-full px-2 py-1 border border-slate-300 rounded font-medium text-slate-900 text-xs disabled:bg-slate-100"
                  >
                    <option value="Mercedes-Benz">Mercedes-Benz</option>
                    <option value="Volvo">Volvo</option>
                    <option value="Scania">Scania</option>
                    <option value="Volkswagen">Volkswagen</option>
                    <option value="Iveco">Iveco</option>
                    <option value="DAF">DAF</option>
                    <option value="Ford">Ford</option>
                    <option value="Outro">Outro...</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-[11px] block">Modelo:</label>
                  <input
                    type="text"
                    disabled={isOrigemLocked}
                    value={modeloVeiculo}
                    onChange={e => { setIsDirty(true); setModeloVeiculo(e.target.value); }}
                    placeholder="Ex: Actros 2651"
                    className="w-full px-2 py-1 border border-slate-300 rounded font-medium text-slate-900 text-xs disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-[11px] block">Cor:</label>
                  <input
                    type="text"
                    disabled={isOrigemLocked}
                    value={corVeiculo}
                    onChange={e => { setIsDirty(true); setCorVeiculo(e.target.value); }}
                    placeholder="Ex: Branco"
                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-[11px] block">Placa:</label>
                  <input
                    type="text"
                    disabled={isOrigemLocked}
                    value={placaVeiculo}
                    onChange={e => { setIsDirty(true); setPlacaVeiculo(e.target.value.toUpperCase()); }}
                    placeholder="ABC-1234"
                    className="w-full px-2 py-1 border border-slate-300 rounded font-mono font-bold text-slate-900 text-xs uppercase disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-[11px] block">Chassi (Final):</label>
                  <input
                    type="text"
                    disabled={isOrigemLocked}
                    value={chassiVeiculo}
                    onChange={e => { setIsDirty(true); setChassiVeiculo(e.target.value.toUpperCase()); }}
                    placeholder="9BWZZZ..."
                    className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-xs uppercase disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* 4. DOCUMENTOS CONFERIDOS */}
            <div className="border border-slate-400 rounded-lg p-3 bg-slate-50 text-xs space-y-1.5">
              <span className="font-black text-slate-900 uppercase text-[11px] block">Documentos Conferidos na Saída:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'CRLV', val: docCRLV, set: setDocCRLV },
                  { label: 'DANFE do Veículo', val: docDanfeVeiculo, set: setDocDanfeVeiculo },
                  { label: 'Manual do Proprietário', val: docManual, set: setDocManual },
                  { label: 'DANFE do Equipamento', val: docDanfeEquipamento, set: setDocDanfeEquipamento }
                ].map((doc, idx) => (
                  <label key={idx} className={`flex items-center gap-2 p-1.5 bg-white border rounded cursor-pointer ${isOrigemLocked ? 'opacity-80 cursor-not-allowed' : 'hover:bg-slate-100'}`}>
                    <input
                      type="checkbox"
                      disabled={isOrigemLocked}
                      checked={doc.val}
                      onChange={e => { setIsDirty(true); doc.set(e.target.checked); }}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-bold text-slate-800 text-[11px]">{doc.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 5. AVARIAS E ESTADO */}
            <div className="border border-slate-400 rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase text-[11px] flex items-center justify-between">
                <span>Vistoria de Avarias (S = Sim tem avaria / N = Não tem avaria)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 bg-white">
                {/* Coluna 1: Lataria, Pintura, Parabrisa */}
                <div className="divide-y divide-slate-200">
                  {[
                    { key: 'lataria', label: 'Lataria' },
                    { key: 'pintura', label: 'Pintura' },
                    { key: 'parabrisa', label: 'Parabrisa' }
                  ].map(av => (
                    <div key={av.key} className="p-2 flex items-center gap-2">
                      <span className="w-20 font-bold text-slate-900 shrink-0">{av.label}</span>
                      <div className="flex items-center gap-2 shrink-0 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <label className="flex items-center gap-1 font-bold text-rose-700 text-[11px]">
                          <input
                            type="radio"
                            disabled={isOrigemLocked}
                            name={`av_${av.key}`}
                            checked={(avarias as any)[av.key].hasAvaria === true}
                            onChange={() => {
                              setIsDirty(true);
                              setAvarias(prev => ({ ...prev, [av.key]: { ...(prev as any)[av.key], hasAvaria: true } }));
                            }}
                          />
                          <span>S</span>
                        </label>
                        <label className="flex items-center gap-1 font-bold text-emerald-700 text-[11px]">
                          <input
                            type="radio"
                            disabled={isOrigemLocked}
                            name={`av_${av.key}`}
                            checked={(avarias as any)[av.key].hasAvaria === false}
                            onChange={() => {
                              setIsDirty(true);
                              setAvarias(prev => ({ ...prev, [av.key]: { ...(prev as any)[av.key], hasAvaria: false } }));
                            }}
                          />
                          <span>N</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        disabled={isOrigemLocked}
                        placeholder={`Observações de ${av.label}...`}
                        value={(avarias as any)[av.key].obs}
                        onChange={e => {
                          setIsDirty(true);
                          setAvarias(prev => ({ ...prev, [av.key]: { ...(prev as any)[av.key], obs: e.target.value } }));
                        }}
                        className="flex-1 px-2 py-0.5 border border-slate-200 rounded text-xs disabled:bg-slate-100"
                      />
                    </div>
                  ))}
                </div>

                {/* Coluna 2: Interior, Pneus */}
                <div className="divide-y divide-slate-200">
                  {[
                    { key: 'interior', label: 'Interior' },
                    { key: 'pneus', label: 'Pneus' }
                  ].map(av => (
                    <div key={av.key} className="p-2 flex items-center gap-2">
                      <span className="w-20 font-bold text-slate-900 shrink-0">{av.label}</span>
                      <div className="flex items-center gap-2 shrink-0 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <label className="flex items-center gap-1 font-bold text-rose-700 text-[11px]">
                          <input
                            type="radio"
                            disabled={isOrigemLocked}
                            name={`av_${av.key}`}
                            checked={(avarias as any)[av.key].hasAvaria === true}
                            onChange={() => {
                              setIsDirty(true);
                              setAvarias(prev => ({ ...prev, [av.key]: { ...(prev as any)[av.key], hasAvaria: true } }));
                            }}
                          />
                          <span>S</span>
                        </label>
                        <label className="flex items-center gap-1 font-bold text-emerald-700 text-[11px]">
                          <input
                            type="radio"
                            disabled={isOrigemLocked}
                            name={`av_${av.key}`}
                            checked={(avarias as any)[av.key].hasAvaria === false}
                            onChange={() => {
                              setIsDirty(true);
                              setAvarias(prev => ({ ...prev, [av.key]: { ...(prev as any)[av.key], hasAvaria: false } }));
                            }}
                          />
                          <span>N</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        disabled={isOrigemLocked}
                        placeholder={`Observações de ${av.label}...`}
                        value={(avarias as any)[av.key].obs}
                        onChange={e => {
                          setIsDirty(true);
                          setAvarias(prev => ({ ...prev, [av.key]: { ...(prev as any)[av.key], obs: e.target.value } }));
                        }}
                        className="flex-1 px-2 py-0.5 border border-slate-200 rounded text-xs disabled:bg-slate-100"
                      />
                    </div>
                  ))}

                  <div className="p-2 bg-slate-50 flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-700 shrink-0">*Pneus Quant:</span>
                    <input
                      type="text"
                      disabled={isOrigemLocked}
                      value={avarias.pneusQuant}
                      onChange={e => { setIsDirty(true); setAvarias(prev => ({ ...prev, pneusQuant: e.target.value })); }}
                      className="w-16 px-2 py-0.5 bg-white border border-slate-300 rounded font-semibold text-center text-xs disabled:bg-slate-100"
                    />
                    <span className="font-bold text-slate-700 shrink-0">Marca:</span>
                    <input
                      type="text"
                      disabled={isOrigemLocked}
                      value={avarias.pneusMarca}
                      onChange={e => { setIsDirty(true); setAvarias(prev => ({ ...prev, pneusMarca: e.target.value })); }}
                      placeholder="Ex: Michelin / Pirelli"
                      className="flex-1 px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-semibold disabled:bg-slate-100"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* 6. TABELA DE EQUIPAMENTOS (17 ITENS OFICIAIS) */}
            <div className="border border-slate-400 rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-900 text-white px-3 py-1.5 font-black uppercase text-[11px] flex items-center justify-between">
                <span>Equipamentos e Acessórios Obrigatórios (17 Itens)</span>
                {!isOrigemLocked && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetAllEquipamentos(true)}
                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      ✓ Marcar Todos SIM
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAllEquipamentos(false)}
                      className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      ✗ Limpar
                    </button>
                  </div>
                )}
              </div>

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
                    { key: 'macaco', label: 'Macaco' }
                  ].map(item => (
                    <div key={item.key} className="px-3 py-1.5 flex items-center justify-between hover:bg-slate-50">
                      <span className="font-semibold text-slate-800">{item.label}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 font-bold text-emerald-700 text-[11px]">
                          <input
                            type="radio"
                            disabled={isOrigemLocked}
                            name={`eq_${item.key}`}
                            checked={equipamentos[item.key] === true}
                            onChange={() => { setIsDirty(true); setEquipamentos(prev => ({ ...prev, [item.key]: true })); }}
                          />
                          <span>SIM</span>
                        </label>
                        <label className="flex items-center gap-1 font-bold text-rose-700 text-[11px]">
                          <input
                            type="radio"
                            disabled={isOrigemLocked}
                            name={`eq_${item.key}`}
                            checked={equipamentos[item.key] === false}
                            onChange={() => { setIsDirty(true); setEquipamentos(prev => ({ ...prev, [item.key]: false })); }}
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
                    { key: 'estepe', label: 'Estepe (Pneu/Roda)' }
                  ].map(item => (
                    <div key={item.key} className="px-3 py-1.5 flex items-center justify-between hover:bg-slate-50">
                      <span className="font-semibold text-slate-800">{item.label}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 font-bold text-emerald-700 text-[11px]">
                          <input
                            type="radio"
                            disabled={isOrigemLocked}
                            name={`eq_${item.key}`}
                            checked={equipamentos[item.key] === true}
                            onChange={() => { setIsDirty(true); setEquipamentos(prev => ({ ...prev, [item.key]: true })); }}
                          />
                          <span>SIM</span>
                        </label>
                        <label className="flex items-center gap-1 font-bold text-rose-700 text-[11px]">
                          <input
                            type="radio"
                            disabled={isOrigemLocked}
                            name={`eq_${item.key}`}
                            checked={equipamentos[item.key] === false}
                            onChange={() => { setIsDirty(true); setEquipamentos(prev => ({ ...prev, [item.key]: false })); }}
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
                disabled={isOrigemLocked}
                value={observacoes}
                onChange={e => { setIsDirty(true); setObservacoes(e.target.value); }}
                placeholder="Ressalvas sobre o carregamento, condições climáticas, avarias pré-existentes ou instruções especiais..."
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-medium text-slate-900 text-xs focus:border-slate-800 focus:outline-hidden disabled:bg-slate-100"
              />
            </div>

            {/* 8. FOTOS COMPROBATÓRIAS (CÂMERA EM TEMPO REAL E VERIFICAÇÃO DE LEGIBILIDADE) */}
            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-800 uppercase text-[11px] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Fotos Comprobatórias da Vistoria ({photos.length})</span>
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Abrir Câmera ao Vivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold text-xs cursor-pointer transition-colors"
                  >
                    Galeria / Arquivo
                  </button>
                </div>
              </div>

              {photos.length === 0 ? (
                <div className="text-center py-4 bg-white border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs">
                  Nenhuma foto anexada. Use o botão acima para fotografar o veículo, avarias e hodômetro.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {photos.map((photoUrl, idx) => (
                    <div 
                      key={idx} 
                      className="group relative bg-white border border-slate-300 rounded-xl overflow-hidden shadow-xs hover:border-emerald-500 transition-all cursor-pointer"
                      onClick={() => setActivePhotoPreview(photoUrl)}
                    >
                      <img 
                        src={photoUrl} 
                        alt={`Vistoria ${idx + 1}`} 
                        className="w-full h-24 object-cover group-hover:scale-105 transition-transform" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        <span className="p-1.5 bg-white/90 text-slate-900 rounded-full font-bold text-xs" title="Ver foto">
                          <Eye className="w-3.5 h-3.5" />
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDirty(true);
                            setPhotos(photos.filter((_, i) => i !== idx));
                          }}
                          className="p-1.5 bg-rose-600 text-white rounded-full font-bold text-xs hover:bg-rose-700"
                          title="Excluir foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-1 bg-slate-100 text-[10px] font-bold text-slate-600 flex items-center justify-between">
                        <span>Foto #{idx + 1}</span>
                        <span className="text-emerald-700">Ver</span>
                      </div>
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
                    {isOrigemLocked && <Lock className="w-3 h-3 text-emerald-800 ml-1 inline" />}
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">3ª Via Amarela</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 text-[11px]">Nome do Conferente:</label>
                    <input
                      type="text"
                      disabled={isOrigemLocked}
                      value={origemNome}
                      onChange={e => { setIsDirty(true); setOrigemNome(e.target.value); }}
                      placeholder="Nome completo na coleta"
                      className="w-full px-2 py-1 border border-slate-300 rounded font-semibold text-slate-900 disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 text-[11px]">CPF:</label>
                    <input
                      type="text"
                      disabled={isOrigemLocked}
                      value={origemCpf}
                      onChange={e => { setIsDirty(true); setOrigemCpf(e.target.value); }}
                      placeholder="000.000.000-00"
                      className="w-full px-2 py-1 border border-slate-300 rounded font-mono disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 text-[11px]">E-mail para Cópia:</label>
                    <input
                      type="email"
                      disabled={isOrigemLocked}
                      value={origemEmail}
                      onChange={e => { setIsDirty(true); setOrigemEmail(e.target.value); }}
                      placeholder="origem@empresa.com"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 text-[11px]">Telefone / WhatsApp:</label>
                    <input
                      type="text"
                      disabled={isOrigemLocked}
                      value={origemTelefone}
                      onChange={e => { setIsDirty(true); setOrigemTelefone(e.target.value); }}
                      placeholder="(17) 99999-0000"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* Digital Signature Display (Origem) */}
                <div className={`border-2 border-dashed rounded-xl p-3 text-center space-y-2 transition-colors ${
                  origemAssinado ? 'border-amber-400 bg-amber-50' : 'border-slate-300 bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-amber-700" />
                      <span>{origemAssinado ? '✓ Assinatura de Retirada Gravada' : 'Assinatura Digital de Retirada'}</span>
                    </span>
                    {origemDataAssinatura && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(origemDataAssinatura).toLocaleTimeString('pt-BR')}
                      </span>
                    )}
                  </div>

                  <div className="h-18 bg-white border border-slate-200 rounded-lg flex items-center justify-center relative overflow-hidden p-1">
                    {origemSignatureImage ? (
                      <img src={origemSignatureImage} alt="Assinatura Origem" className="max-h-full max-w-full object-contain" />
                    ) : origemAssinado ? (
                      <div className="flex items-center gap-2 text-amber-900 font-black italic text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Assinado por {origemNome || 'Responsável Coleta'} ({maskCpf(origemCpf)})</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">
                        Clique abaixo para assinar na tela
                      </span>
                    )}
                  </div>

                  {!isOrigemLocked ? (
                    <button
                      type="button"
                      onClick={() => handleOpenSignatureModal('ORIGEM')}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        origemAssinado
                          ? 'bg-amber-200 text-amber-950 hover:bg-amber-300'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <PenTool className="w-3 h-3" />
                      <span>{origemAssinado ? 'Refazer Assinatura de Retirada' : 'Coletar 1ª Assinatura (Retirada)'}</span>
                    </button>
                  ) : (
                    <div className="py-1 px-2 bg-slate-100 text-slate-600 rounded text-[11px] font-bold flex items-center justify-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Assinatura Gravada e Bloqueada</span>
                    </div>
                  )}
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
                    {isDestinoLocked && <Lock className="w-3 h-3 text-emerald-800 ml-1 inline" />}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">2ª Via Verde</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 text-[11px]">Nome do Recebedor:</label>
                    <input
                      type="text"
                      disabled={isDestinoLocked}
                      value={destinoNome}
                      onChange={e => { setIsDirty(true); setDestinoNome(e.target.value); }}
                      placeholder="Nome completo na entrega"
                      className="w-full px-2 py-1 border border-slate-300 rounded font-semibold text-slate-900 disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 text-[11px]">CPF:</label>
                    <input
                      type="text"
                      disabled={isDestinoLocked}
                      value={destinoCpf}
                      onChange={e => { setIsDirty(true); setDestinoCpf(e.target.value); }}
                      placeholder="000.000.000-00"
                      className="w-full px-2 py-1 border border-slate-300 rounded font-mono disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 text-[11px]">E-mail para Cópia:</label>
                    <input
                      type="email"
                      disabled={isDestinoLocked}
                      value={destinoEmail}
                      onChange={e => { setIsDirty(true); setDestinoEmail(e.target.value); }}
                      placeholder="recebedor@destino.com"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 text-[11px]">Telefone / WhatsApp:</label>
                    <input
                      type="text"
                      disabled={isDestinoLocked}
                      value={destinoTelefone}
                      onChange={e => { setIsDirty(true); setDestinoTelefone(e.target.value); }}
                      placeholder="(11) 98888-0000"
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* Digital Signature Display (Destino) */}
                <div className={`border-2 border-dashed rounded-xl p-3 text-center space-y-2 transition-colors ${
                  destinoAssinado ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{destinoAssinado ? '✓ Assinatura de Entrega Gravada' : 'Assinatura Digital de Entrega'}</span>
                    </span>
                    {destinoDataAssinatura && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(destinoDataAssinatura).toLocaleTimeString('pt-BR')}
                      </span>
                    )}
                  </div>

                  <div className="h-18 bg-white border border-slate-200 rounded-lg flex items-center justify-center relative overflow-hidden p-1">
                    {destinoSignatureImage ? (
                      <img src={destinoSignatureImage} alt="Assinatura Destino" className="max-h-full max-w-full object-contain" />
                    ) : destinoAssinado ? (
                      <div className="flex items-center gap-2 text-emerald-950 font-black italic text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Assinado por {destinoNome || 'Recebedor'} ({maskCpf(destinoCpf)})</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">
                        Preenchido e assinado ao término da viagem
                      </span>
                    )}
                  </div>

                  {!isDestinoLocked ? (
                    <button
                      type="button"
                      onClick={() => handleOpenSignatureModal('DESTINO')}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        destinoAssinado
                          ? 'bg-emerald-200 text-emerald-950 hover:bg-emerald-300'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      <PenTool className="w-3 h-3" />
                      <span>{destinoAssinado ? 'Refazer Assinatura de Entrega' : 'Coletar 2ª Assinatura (Entrega)'}</span>
                    </button>
                  ) : (
                    <div className="py-1 px-2 bg-slate-100 text-slate-600 rounded text-[11px] font-bold flex items-center justify-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Assinatura Gravada e Bloqueada</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Condutor da ELO e Telefone do Motorista */}
            <div className="border border-slate-400 rounded-lg p-3 bg-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1">
                <label className="font-black text-slate-900 uppercase text-[11px] shrink-0">Condutor da ELO:</label>
                <input
                  type="text"
                  disabled={isOrigemLocked}
                  value={condutorNome}
                  onChange={e => { setIsDirty(true); setCondutorNome(e.target.value); }}
                  placeholder="Nome completo do motorista condutor"
                  className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-900 disabled:bg-slate-100"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="font-bold text-slate-700 text-[11px] shrink-0 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>Tel Motorista:</span>
                </label>
                <input
                  type="text"
                  disabled={isOrigemLocked}
                  value={condutorTelefone}
                  onChange={e => { setIsDirty(true); setCondutorTelefone(e.target.value); }}
                  placeholder="(17) 99999-0000"
                  className="w-36 px-2 py-1 bg-white border border-slate-300 rounded text-xs disabled:bg-slate-100"
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

        {/* Modal Actions Footer with Safety Buttons */}
        <div className="bg-slate-100 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            {isOrigemLocked ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Retirada gravada no banco • Preencha a entrega no destino para finalizar.</span>
              </span>
            ) : (
              <span>Preencha os dados de saída, assine e clique em "Salvar Etapa" para gravar a retirada.</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleRequestClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
            >
              Fechar
            </button>

            {/* BOTAO SALVAR ETAPA (RETIRADA / GRAVACAO NO BANCO) */}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={savingDraft || submitting}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              title="Grava os dados de saída e a assinatura de retirada no banco e dispara comprovante"
            >
              <Save className="w-4 h-4" />
              <span>{savingDraft ? 'Gravando no Banco...' : 'Salvar Etapa (Completar no Término)'}</span>
            </button>

            {/* BOTAO CONCLUIR VISTORIA FINAL */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || savingDraft}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Finalizando...' : 'Concluir Vistoria Final'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* =========================================================================
          MODAL 1: LIVE CAMERA VIEWFINDER & SCANNER (Visualização em Tempo Real)
          ========================================================================= */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
            <div className="p-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <span className="font-bold text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>
                  {cameraMode === 'PHOTO' && 'Câmera ao Vivo • Vistoria ELO LOG'}
                  {cameraMode === 'BARCODE_QR' && 'Leitor de QR Code / Código de Barras'}
                  {cameraMode === 'OCR_PLATE' && 'Scanner OCR de Placa Mercosul'}
                </span>
              </span>
              <button
                type="button"
                onClick={handleStopCamera}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                title="Fechar Câmera"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scanner Mode Selector Tabs */}
            <div className="bg-slate-950 px-3 py-2 flex items-center justify-center gap-1.5 border-b border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setCameraMode('PHOTO');
                  setCapturedSnapshot(null);
                  setScanFeedback(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  cameraMode === 'PHOTO' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Foto Vistoria</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCameraMode('BARCODE_QR');
                  setCapturedSnapshot(null);
                  setScanFeedback(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  cameraMode === 'BARCODE_QR' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR / Cód. Barras</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCameraMode('OCR_PLATE');
                  setCapturedSnapshot(null);
                  setScanFeedback(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  cameraMode === 'OCR_PLATE' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Scan className="w-3.5 h-3.5" />
                <span>Placa OCR</span>
              </button>
            </div>

            {/* Viewfinder Viewport with Overlay Frame */}
            <div className="relative bg-black flex items-center justify-center min-h-[320px] max-h-[60vh] overflow-hidden">
              {capturedSnapshot ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <img src={capturedSnapshot} alt="Snapshot Capturado" className="w-full max-h-[50vh] object-contain" />
                  <div className="absolute top-2 left-2 right-2 bg-slate-950/80 backdrop-blur-xs text-amber-300 text-xs px-3 py-1.5 rounded-lg text-center font-medium border border-amber-500/30">
                    🔍 Verifique se a imagem está nítida e legível (placa, hodômetro, avarias).
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Mode specific overlay */}
                  {cameraMode === 'PHOTO' && (
                    <div className="absolute inset-4 border-2 border-white/40 border-dashed rounded-xl pointer-events-none flex flex-col justify-between p-2">
                      <span className="text-[10px] text-white/80 bg-black/60 px-2 py-0.5 rounded self-start">
                        Enquadre a área a ser vistoriada
                      </span>
                      <span className="text-[10px] text-white/80 bg-black/60 px-2 py-0.5 rounded self-end">
                        Mantenha firme ao fotografar
                      </span>
                    </div>
                  )}

                  {cameraMode === 'BARCODE_QR' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6">
                      <div className="w-48 h-48 border-2 border-indigo-400 rounded-2xl relative animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                        <div className="absolute inset-x-2 top-1/2 h-0.5 bg-rose-500 shadow-[0_0_8px_#ef4444]" />
                      </div>
                      <span className="mt-3 text-xs bg-slate-950/90 text-indigo-300 px-3 py-1 rounded-full font-medium border border-indigo-500/30">
                        Aponte para o QR Code ou Código de Barras (Danfe/CRLV)
                      </span>
                    </div>
                  )}

                  {cameraMode === 'OCR_PLATE' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6">
                      <div className="w-64 h-24 border-2 border-amber-400 rounded-xl relative shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center justify-center">
                        <span className="text-[10px] uppercase tracking-widest text-amber-300 font-bold bg-black/70 px-2 py-0.5 rounded">
                          BRASIL • MERCOSUL
                        </span>
                      </div>
                      <span className="mt-3 text-xs bg-slate-950/90 text-amber-300 px-3 py-1 rounded-full font-medium border border-amber-500/30">
                        Enquadre a placa do veículo para leitura automática
                      </span>
                    </div>
                  )}

                  {scanFeedback && (
                    <div className="absolute bottom-3 inset-x-4 bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl text-center shadow-lg animate-bounce">
                      ✓ {scanFeedback.message}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              {capturedSnapshot ? (
                <>
                  <button
                    type="button"
                    onClick={() => setCapturedSnapshot(null)}
                    className="flex-1 px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Não Ficou Legível (Refazer)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptCapturedPhoto}
                    className="flex-1 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Foto Legível (Salvar)</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      handleStopCamera();
                      fileInputRef.current?.click();
                    }}
                    className="px-3.5 py-2 bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    title="Escolher imagem salva na galeria ou arquivos"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Galeria</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment');
                      handleStartCamera();
                    }}
                    className="px-3.5 py-2 bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Virar</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-transform"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Fotografar</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: PHOTO FULLSCREEN INSPECTOR & LEGIBILITY VERIFIER
          ========================================================================= */}
      {activePhotoPreview && (
        <div className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <span className="font-bold text-sm flex items-center gap-2">
                <ZoomIn className="w-4 h-4 text-emerald-400" />
                <span>Verificação de Legibilidade da Foto</span>
              </span>
              <button
                type="button"
                onClick={() => setActivePhotoPreview(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 bg-black flex items-center justify-center flex-1 overflow-auto max-h-[65vh]">
              <img src={activePhotoPreview} alt="Foto da Vistoria" className="max-w-full max-h-full object-contain rounded-lg" />
            </div>

            <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  setPhotos(photos.filter(p => p !== activePhotoPreview));
                  setActivePhotoPreview(null);
                  setIsDirty(true);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Foto (Ilegível)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActivePhotoPreview(null);
                    handleStartCamera();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Tirar Nova Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoPreview(null)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer"
                >
                  Foto Legível (Fechar)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: INTERACTIVE SIGNATURE DRAWING PAD
          ========================================================================= */}
      {signatureModalTarget && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-300">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-2">
                <PenTool className="w-4 h-4 text-emerald-400" />
                <span>Assinatura Digital ({signatureModalTarget === 'ORIGEM' ? '1. Retirada / Saída' : '2. Entrega / Destino'})</span>
              </span>
              <button
                type="button"
                onClick={() => setSignatureModalTarget(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-600">
                Desenhe a assinatura com o dedo ou mouse no espaço abaixo para confirmar a vistoria:
              </p>

              <div className="border-2 border-slate-400 rounded-xl bg-slate-50 overflow-hidden shadow-inner touch-none">
                <canvas
                  ref={signatureCanvasRef}
                  width={380}
                  height={160}
                  className="w-full h-40 bg-white cursor-crosshair block"
                  onMouseDown={handleStartDraw}
                  onMouseMove={handleDraw}
                  onMouseUp={handleEndDraw}
                  onMouseLeave={handleEndDraw}
                  onTouchStart={handleStartDraw}
                  onTouchMove={handleDraw}
                  onTouchEnd={handleEndDraw}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Signatário: {signatureModalTarget === 'ORIGEM' ? (origemNome || 'Responsável Coleta') : (destinoNome || 'Recebedor')}</span>
                <span>Documento: {maskCpf(signatureModalTarget === 'ORIGEM' ? origemCpf : destinoCpf)}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleClearSignatureCanvas}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSignatureModalTarget(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSignature}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Gravar Assinatura</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: SAFETY EXIT CONFIRMATION (Proteção contra perda de dados)
          ========================================================================= */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-amber-300 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">Salvar formulário antes de sair?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Você possui respostas ou assinaturas preenchidas que ainda não foram gravadas. Deseja salvar a etapa antes de fechar?
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  setShowExitConfirm(false);
                  await handleSaveDraft();
                  onClose();
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar e Sair</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Continuar Preenchendo
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  onClose();
                }}
                className="w-full py-1 text-slate-400 hover:text-rose-600 text-[11px] font-medium"
              >
                Sair sem salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: DIGITAL DISPATCH RECEIPT (Envio Automático via Email / WhatsApp)
          ========================================================================= */}
      {dispatchReceiptModal && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-300 flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {dispatchReceiptModal.stage === 'RETIRADA' ? 'Comprovante de Saída Registrado' : 'Comprovante de Entrega Concluída'}
                  </h3>
                  <span className="text-[11px] text-slate-400">Talão Oficial Nº {talaoNumber}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDispatchReceiptModal(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs overflow-y-auto max-h-[70vh]">
              {/* Email Delivery Status Card */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span>Envio por E-mail</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    dispatchReceiptModal.recipientEmail ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {dispatchReceiptModal.recipientEmail ? '✓ Transmitido' : 'E-mail não informado'}
                  </span>
                </div>
                {dispatchReceiptModal.recipientEmail ? (
                  <p className="text-slate-600">
                    O relatório com os dados da vistoria e termos foram enviados para <strong>{dispatchReceiptModal.recipientEmail}</strong>.
                  </p>
                ) : (
                  <p className="text-slate-500">
                    O e-mail do responsável não foi preenchido. Utilize o WhatsApp abaixo para enviar a cópia digital.
                  </p>
                )}
              </div>

              {/* WhatsApp Share Card with Masked Sensitive Data */}
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Cópia via WhatsApp (Responsável da Saída)</span>
                  </span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-semibold">
                    Dados LGPD Mascarados
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-2.5 max-h-36 overflow-y-auto font-mono text-[11px] text-slate-700 whitespace-pre-line leading-relaxed shadow-inner">
                  {dispatchReceiptModal.receiptText}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={dispatchReceiptModal.whatsappLink || `https://api.whatsapp.com/send?text=${encodeURIComponent(dispatchReceiptModal.receiptText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-center flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Enviar no WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(dispatchReceiptModal.receiptText);
                      setCopiedText(true);
                      setTimeout(() => setCopiedText(false), 2000);
                    }}
                    className="py-2 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedText ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setDispatchReceiptModal(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer"
              >
                Concluir e Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: AVISO AO MOTORISTA - MODO OFFLINE ATIVO (Assinatura de Retirada)
          ========================================================================= */}
      {showOfflineOriginWarning && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border-2 border-amber-400 flex flex-col">
            <div className="p-4 bg-amber-500 text-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black">
                  <WifiOff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wide">
                    Aviso ao Motorista • Modo Offline Ativo
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-900">
                    Vistoria de Retirada Gravada no Dispositivo
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOfflineOriginWarning(false)}
                className="p-1 text-slate-900 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 text-slate-800">
                    <p className="font-bold text-sm text-amber-950">
                      ⚠️ Instrução Obrigatória ao Motorista:
                    </p>
                    <p className="leading-relaxed">
                      Por favor, <strong>avise a pessoa que realizou a assinatura de retirada/origem ({origemNome || 'Responsável'})</strong> que o seu aplicativo está temporariamente sem sinal de internet (offline).
                    </p>
                    <p className="leading-relaxed text-slate-700">
                      • Assim que a conexão for restabelecida, o sistema <strong>enviará a cópia do checklist por e-mail automaticamente</strong> e validará os dados na nuvem da ELO LOG.
                    </p>
                    <p className="leading-relaxed text-slate-700">
                      • Caso ela precise da comprovação imediata na portaria ou não receba no prazo, <strong>compartilhe o arquivo PDF do laudo no WhatsApp dela agora mesmo</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons to share PDF directly */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    handleExportPdf('SHARE_WHATSAPP');
                  }}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Compartilhar Laudo PDF via WhatsApp Agora</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportPdf('DOWNLOAD')}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-slate-300"
                  >
                    <FileDown className="w-3.5 h-3.5 text-blue-600" />
                    <span>Baixar PDF no Celular</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowOfflineOriginWarning(false)}
                    className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Entendido / Continuar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Configuration Modal */}
      <WhatsAppConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </div>
  );
};
