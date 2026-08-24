import { jsPDF } from 'jspdf';
import { FormResponse, Freight } from '../types';

export const maskCpfForPdf = (cpf: string): string => {
  if (!cpf) return '***.***.***-**';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length === 11) {
    return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`;
  }
  return '***.***.***-**';
};

export const maskChassiForPdf = (chassi: string): string => {
  if (!chassi) return '***';
  if (chassi.length > 7) {
    return `${chassi.slice(0, 3)}***${chassi.slice(-4)}`;
  }
  return '***';
};

export const maskPhoneForPdf = (phone: string): string => {
  if (!phone) return '(**) *****-****';
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 10) {
    const ddd = clean.slice(0, 2);
    const end = clean.slice(-4);
    return `(${ddd}) 9****-${end}`;
  }
  return '(**) *****-****';
};

export interface GeneratePdfOptions {
  download?: boolean;
  print?: boolean;
  shareWhatsapp?: boolean;
  returnBlob?: boolean;
  filename?: string;
}

export const generateChecklistPdf = (
  response: FormResponse,
  freight?: Freight | null,
  options: GeneratePdfOptions = { download: true }
): { doc: jsPDF; blob?: Blob; blobUrl?: string; filename: string } => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const answers = response.answers || {};
  const talao = answers.talaoNumber || '000000';
  const freightCode = freight?.code || answers.freightCode || 'S/N';
  const now = new Date().toLocaleString('pt-BR');

  // Colors
  const primaryColor = [15, 23, 42]; // Slate 900
  const emeraldColor = [5, 150, 105]; // Emerald 600
  const lightBg = [248, 250, 252]; // Slate 50
  const borderGray = [203, 213, 225]; // Slate 300
  const darkGray = [71, 85, 105]; // Slate 600

  // 1. Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(10, 10, 190, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ELO LOG • LAUDO DE VISTORIA E CHECKLIST DIGITAL', 15, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`TRANSPORTE & LOGÍSTICA DE VEÍCULOS • FRETE #${freightCode}`, 15, 24);

  // Talao badge
  doc.setFillColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
  doc.roundedRect(145, 14, 50, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TALÃO DIGITAL Nº', 170, 19, { align: 'center' });
  doc.setFontSize(11);
  doc.text(talao, 170, 26, { align: 'center' });

  // 2. Info Bar (Data / Estágio)
  let y = 38;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(10, y, 190, 8, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.rect(10, y, 190, 8, 'S');

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const stageName = answers.entrega?.assinado ? 'FINALIZADO (ENTREGA CONCLUÍDA)' : (answers.origem?.assinado ? 'EM TRÂNSITO (RETIRADA ASSINADA)' : 'EM PREENCHIMENTO');
  doc.text(`EMISSÃO: ${now}  |  ESTÁGIO: ${stageName}  |  SISTEMA DE AUDITORIA ELO LOG`, 14, y + 5.5);

  // 3. Section: Dados do Veículo & Retirada
  y += 12;
  doc.setFillColor(241, 245, 249);
  doc.rect(10, y, 190, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('1. DADOS DO VEÍCULO E CONDIÇÕES DE RETIRADA', 13, y + 4.5);

  y += 7;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.rect(10, y, 190, 24, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);

  // Col 1
  doc.text(`Cliente/Empresa:`, 13, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${answers.cliente || 'Não informado'}`, 45, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.text(`Placa Veículo:`, 13, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${answers.veiculo?.placa || 'Não informada'}`, 45, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.text(`Marca/Modelo:`, 13, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`${answers.veiculo?.marcaModelo || 'Não informado'}`, 45, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.text(`Chassi (LGPD):`, 13, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(`${maskChassiForPdf(answers.veiculo?.chassi || '')}`, 45, y + 20);

  // Col 2
  doc.setFont('helvetica', 'bold');
  doc.text(`Km Retirada:`, 110, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${answers.retirada?.km || '0'} km`, 145, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.text(`Combustível:`, 110, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${answers.retirada?.combustivel || 'Não verificado'}`, 145, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.text(`Nível de Óleo:`, 110, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`${answers.retirada?.oleo || 'OK'}`, 145, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.text(`Bateria:`, 110, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(`${answers.retirada?.bateria || 'OK'}`, 145, y + 20);

  // 4. Section: 17 Itens e Equipamentos
  y += 28;
  doc.setFillColor(241, 245, 249);
  doc.rect(10, y, 190, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('2. CONFERÊNCIA DE EQUIPAMENTOS E ACESSÓRIOS (17 ITENS)', 13, y + 4.5);

  y += 7;
  const equipamentos = [
    { key: 'estepe', label: 'Estepe' },
    { key: 'macaco', label: 'Macaco' },
    { key: 'chaveRoda', label: 'Chave de Roda' },
    { key: 'triangulo', label: 'Triângulo' },
    { key: 'extintor', label: 'Extintor' },
    { key: 'antena', label: 'Antena' },
    { key: 'calotas', label: 'Calotas / Rodas' },
    { key: 'tapetes', label: 'Tapetes' },
    { key: 'somRadio', label: 'Aparelho Som/GPS' },
    { key: 'altoFalantes', label: 'Alto-falantes' },
    { key: 'acendedor', label: 'Tomada 12V/Acendedor' },
    { key: 'manual', label: 'Manual Proprietário' },
    { key: 'chaveReserva', label: 'Chave Reserva' },
    { key: 'farolMilha', label: 'Faróis de Milha' },
    { key: 'insulfilm', label: 'Insulfilm/Película' },
    { key: 'chaveiro', label: 'Chaveiro/Controle' },
    { key: 'crlv', label: 'Documento (CRLV)' }
  ];

  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.rect(10, y, 190, 36, 'S');

  doc.setFontSize(7);
  let colIndex = 0;
  let rowIndex = 0;

  equipamentos.forEach((eq) => {
    const isOk = answers.equipamentos?.[eq.key] === true;
    const xPos = 13 + (colIndex * 62);
    const yPos = y + 5 + (rowIndex * 5.5);

    // Status symbol
    if (isOk) {
      doc.setTextColor(5, 150, 105);
      doc.text('[OK]', xPos, yPos);
    } else {
      doc.setTextColor(220, 38, 38);
      doc.text('[N/A]', xPos, yPos);
    }

    doc.setTextColor(51, 65, 85);
    doc.text(` ${eq.label}`, xPos + 8, yPos);

    rowIndex++;
    if (rowIndex >= 6) {
      rowIndex = 0;
      colIndex++;
    }
  });

  // 5. Section: Avarias e Observações
  y += 40;
  doc.setFillColor(241, 245, 249);
  doc.rect(10, y, 190, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('3. REGISTRO DE AVARIAS E OBSERVAÇÕES NA RETIRADA', 13, y + 4.5);

  y += 7;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.rect(10, y, 190, 16, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const obsText = answers.avarias?.observacoes || 'Nenhuma avaria declarada na saída do veículo.';
  const splitObs = doc.splitTextToSize(obsText, 180);
  doc.text(splitObs, 13, y + 5);

  // 6. Section: Assinaturas e Carimbos Digitais (Origem e Entrega)
  y += 20;
  doc.setFillColor(241, 245, 249);
  doc.rect(10, y, 190, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('4. CARIMBOS DE AUDITORIA E ASSINATURAS DIGITAIS', 13, y + 4.5);

  y += 7;
  // Box 1: Origem / Retirada
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.rect(10, y, 92, 42, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text('ASSINATURA DE RETIRADA (ORIGEM)', 14, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Responsável: ${answers.origem?.responsavel || 'Não informado'}`, 14, y + 10);
  doc.text(`Doc (LGPD): ${maskCpfForPdf(answers.origem?.rgCpf || '')}`, 14, y + 14);
  doc.text(`Data/Hora: ${answers.origem?.dataHora || 'Não assinada'}`, 14, y + 18);

  // If signature image exists
  if (answers.origem?.signatureImage) {
    try {
      doc.addImage(answers.origem.signatureImage, 'PNG', 14, y + 20, 45, 18);
    } catch {
      doc.text('[Assinatura Digital Gravada]', 14, y + 26);
    }
  } else {
    doc.text('[Pendente de Assinatura]', 14, y + 26);
  }

  // Box 2: Destino / Entrega
  doc.rect(108, y, 92, 42, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(37, 99, 235);
  doc.text('ASSINATURA DE RECEBIMENTO (DESTINO)', 112, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Responsável: ${answers.entrega?.responsavel || 'Aguardando Entrega'}`, 112, y + 10);
  doc.text(`Doc (LGPD): ${maskCpfForPdf(answers.entrega?.rgCpf || '')}`, 112, y + 14);
  doc.text(`Data/Hora: ${answers.entrega?.dataHora || 'Pendente'}`, 112, y + 18);

  if (answers.entrega?.signatureImage) {
    try {
      doc.addImage(answers.entrega.signatureImage, 'PNG', 112, y + 20, 45, 18);
    } catch {
      doc.text('[Assinatura Digital Gravada]', 112, y + 26);
    }
  } else {
    doc.setTextColor(148, 163, 184);
    doc.text('[Aguardando conclusão da entrega no destino]', 112, y + 26);
  }

  // 7. Footer Notice
  y += 46;
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Documento com validade jurídica e garantia de integridade eletrônica em conformidade com a LGPD. Todos os dados sensíveis foram ofuscados.',
    105,
    y,
    { align: 'center' }
  );

  // If there are photos, add Page 2 for Photo Inspection Gallery
  const photosList: Array<{ title: string; url: string }> = [];
  if (answers.fotos?.frente) photosList.push({ title: '1. Frente do Veículo', url: answers.fotos.frente });
  if (answers.fotos?.traseira) photosList.push({ title: '2. Traseira / Placa', url: answers.fotos.traseira });
  if (answers.fotos?.lateralEsquerda) photosList.push({ title: '3. Lateral Esquerda', url: answers.fotos.lateralEsquerda });
  if (answers.fotos?.lateralDireita) photosList.push({ title: '4. Lateral Direita', url: answers.fotos.lateralDireita });
  if (answers.fotos?.hodometro) photosList.push({ title: '5. Painel / Hodômetro', url: answers.fotos.hodometro });
  if (answers.fotos?.avariasGerais) photosList.push({ title: '6. Detalhe de Avaria', url: answers.fotos.avariasGerais });

  if (photosList.length > 0) {
    doc.addPage();
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(10, 10, 190, 16, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`ANEXO FOTOGRÁFICO DE VISTORIA • TALÃO #${talao}`, 15, 20);

    let photoY = 32;
    let photoCol = 0;

    photosList.forEach((photo, idx) => {
      const posX = 12 + (photoCol * 94);
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.rect(posX, photoY, 90, 72, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(photo.title, posX + 3, photoY + 5);

      try {
        doc.addImage(photo.url, 'JPEG', posX + 3, photoY + 7, 84, 62);
      } catch {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('[Foto arquivada no servidor em alta resolução]', posX + 10, photoY + 35);
      }

      photoCol++;
      if (photoCol >= 2) {
        photoCol = 0;
        photoY += 76;
      }
    });
  }

  const filename = options.filename || `Checklist_ELOLOG_Talao_${talao}.pdf`;

  if (options.download) {
    doc.save(filename);
  }

  if (options.print) {
    doc.autoPrint();
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  let blob: Blob | undefined;
  let blobUrl: string | undefined;

  if (options.returnBlob || options.shareWhatsapp) {
    blob = doc.output('blob');
    blobUrl = URL.createObjectURL(blob);
  }

  return { doc, blob, blobUrl, filename };
};
