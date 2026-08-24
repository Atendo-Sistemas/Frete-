import { jsPDF } from 'jspdf';
import { TripExpenseReport, TripExpenseItem } from '../types';

export interface GenerateExpensePdfOptions {
  download?: boolean;
  print?: boolean;
  returnBlob?: boolean;
  filename?: string;
}

export const CATEGORY_LABELS: Record<string, string> = {
  ABASTECIMENTO: 'Combustível / Abastecimento',
  HOSPEDAGEM: 'Hospedagem / Hotel',
  PEDAGIO: 'Pedágio',
  LOCOMOCAO_URBANA: 'Locomoção Urbana (Uber/Táxi/Ônibus)',
  PASSAGEM_AEREA: 'Passagem Aérea',
  PASSAGEM_RODOVIARIA: 'Passagem Rodoviária',
  ALIMENTACAO: 'Alimentação / Refeição',
  MANUTENCAO_BORRACHARIA: 'Manutenção / Borracharia',
  ESTACIONAMENTO: 'Estacionamento / Pernoite',
  OUTROS: 'Outras Despesas'
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  ADIANTAMENTO_EMPRESA: 'Adiantamento da Empresa',
  CARTAO_CORPORATIVO: 'Cartão Corporativo',
  DINHEIRO_PROPRIO: 'Recurso Próprio (Reembolso)',
  PIX_PROPRIO: 'Pix Próprio (Reembolso)',
  TAG_AUTOMATICA: 'Tag Automática (Sem Parar/Veloe)'
};

export const generateExpenseReportPdf = (
  report: TripExpenseReport,
  options: GenerateExpensePdfOptions = { download: true }
): { doc: jsPDF; blob?: Blob; blobUrl?: string; filename: string } => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const now = new Date().toLocaleString('pt-BR');
  const filename = options.filename || `Prestacao_Contas_ELO_${report.freightCode || report.id.slice(0, 6)}_${report.driverName.replace(/\s+/g, '_')}.pdf`;

  // Colors
  const darkSlate = [15, 23, 42]; // Slate 900
  const emerald = [5, 150, 105]; // Emerald 600
  const lightBg = [248, 250, 252]; // Slate 50
  const borderGray = [203, 213, 225]; // Slate 300

  // 1. Header Banner
  doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ELO LOG • PRESTAÇÃO DE CONTAS & DESPESAS DE VIAGEM', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Sistema Integrado de Gestão de Fretes e Viagens • Emissão: ${now}`, 14, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`RELATÓRIO: #${report.id.slice(0, 8).toUpperCase()}`, 196, 11, { align: 'right' });
  doc.setFontSize(8);
  doc.text(`STATUS: ${report.status}`, 196, 18, { align: 'right' });

  let y = 29;

  // 2. Resumo da Viagem & Motorista
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(12, y, 186, 36, 2, 2, 'FD');

  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('1. DADOS DA VIAGEM & CONDUTOR', 16, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  // Col 1
  doc.text(`Motorista: ${report.driverName || 'Não informado'}`, 16, y + 13);
  doc.text(`Cliente: ${report.clientName || 'Não informado'}`, 16, y + 19);
  doc.text(`Cód. Frete: ${report.freightCode || 'Frete Avulso'}`, 16, y + 25);
  doc.text(`Contato: ${report.driverPhone || 'N/D'}`, 16, y + 31);

  // Col 2
  doc.text(`Início da Viagem: ${report.startDate || 'N/D'}`, 80, y + 13);
  doc.text(`Término da Viagem: ${report.endDate || 'N/D'}`, 80, y + 19);
  doc.text(`Veículo: ${report.vehicleModel || 'N/D'}`, 80, y + 25);
  doc.text(`Placa: ${report.vehiclePlate || 'N/D'} / Chassi: ${report.chassis || 'N/D'}`, 80, y + 31);

  // Col 3
  doc.text(`Km Inicial: ${report.initialKm.toLocaleString('pt-BR')} km`, 144, y + 13);
  doc.text(`Km Final: ${report.finalKm.toLocaleString('pt-BR')} km`, 144, y + 19);
  doc.text(`Km Total Rodado: ${report.totalKm.toLocaleString('pt-BR')} km`, 144, y + 25);
  doc.setFont('helvetica', 'bold');
  doc.text(`Média Combustível: ${report.averageKmPerLiter > 0 ? `${report.averageKmPerLiter.toFixed(2)} km/L` : 'N/D'}`, 144, y + 31);

  y += 42;

  // 3. Resumo Financeiro & Apuração de Saldo
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(12, y, 186, 26, 2, 2, 'FD');

  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('2. APURAÇÃO FINANCEIRA & SALDO DA VIAGEM', 16, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  // Box 1: Adiantamento Recebido
  doc.text('Adiantamento (A):', 16, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`R$ ${report.advanceAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 16, y + 21);

  // Box 2: Total Despesas Realizadas
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('Despesas PG Motorista + Serviço (B):', 65, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(185, 28, 28);
  
  // Need to calculate driver expenses properly
  const isDriverPaid = (m: string) => ['ADIANTAMENTO_EMPRESA', 'DINHEIRO_PROPRIO', 'PIX_PROPRIO'].includes(m);
  const driverPaidExpenses = report.items.filter(it => isDriverPaid(it.paymentMethod)).reduce((acc, it) => acc + it.amount, 0);
  const driverLabor = report.driverLaborAmount || 0;
  const totalB = driverPaidExpenses + driverLabor;
  
  doc.text(`R$ ${totalB.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 65, y + 21);

  // Box 3: Saldo Final (A - B)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  
  const balance = report.advanceAmount - totalB;
  const isDevolver = balance >= 0;
  
  doc.text(isDevolver ? 'Motorista Devolve (Saldo):' : 'Elo Log Deve Motorista (Saldo):', 135, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  if (isDevolver) {
    doc.setTextColor(5, 150, 105); // Verde
  } else {
    doc.setTextColor(217, 119, 6); // Âmbar
  }
  doc.text(`R$ ${Math.abs(balance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 135, y + 21);

  y += 32;

  // 4. Tabela de Despesas Lançadas
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`3. DETALHAMENTO DE DESPESAS COMPROVADAS (${report.items.length} ITENS)`, 14, y);

  y += 4;

  // Table Header
  doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.rect(12, y, 186, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  
  doc.text('DATA', 15, y + 5);
  doc.text('DESCRIÇÃO DAS DESPESAS', 32, y + 5);
  doc.text('PG MOTORISTA', 115, y + 5);
  doc.text('ELO LOG PG', 145, y + 5);
  doc.text('OBSERVAÇÕES', 172, y + 5);

  y += 7;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  if (report.items.length === 0 && (!report.driverLaborAmount || report.driverLaborAmount === 0)) {
    doc.setTextColor(100, 116, 139);
    doc.text('Nenhuma despesa lançada nesta prestação de contas.', 16, y + 8);
    y += 14;
  } else {
    report.items.forEach((item, index) => {
      // New page check
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      const rowBg = index % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
      doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
      doc.rect(12, y, 186, 8.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(12, y + 8.5, 198, y + 8.5);

      doc.setTextColor(30, 41, 59);

      // Data
      const formattedDate = item.date ? item.date.split('-').reverse().join('/') : '-';
      doc.text(formattedDate, 15, y + 5.5);

      // Descrição Completa (Categoria + Detalhe)
      const catLabel = CATEGORY_LABELS[item.category] || item.category;
      let extraDesc = `${item.establishmentName || item.description || '-'}`;
      if (item.category === 'ABASTECIMENTO' && item.liters) {
        extraDesc += ` (${item.liters.toFixed(1)}L${item.arlaLiters ? `+Arla` : ''})`;
      }
      const fullDesc = `${catLabel} - ${extraDesc}`;
      doc.text(fullDesc.slice(0, 46), 32, y + 5.5);

      // Valores
      const isDriverPaidItem = ['ADIANTAMENTO_EMPRESA', 'DINHEIRO_PROPRIO', 'PIX_PROPRIO'].includes(item.paymentMethod);
      const strAmount = `R$ ${item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      
      doc.setFont('helvetica', 'bold');
      if (isDriverPaidItem) {
        doc.text(strAmount, 115, y + 5.5);
        doc.setFont('helvetica', 'normal');
        doc.text('R$ 0,00', 145, y + 5.5);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.text('R$ 0,00', 115, y + 5.5);
        doc.setFont('helvetica', 'bold');
        doc.text(strAmount, 145, y + 5.5);
      }
      doc.setFont('helvetica', 'normal');

      // Observações / Forma PG
      const payLabel = item.paymentMethod === 'ADIANTAMENTO_EMPRESA' ? 'Adiantamento' :
                       item.paymentMethod === 'CARTAO_CORPORATIVO' ? 'Cartão Corp.' :
                       item.paymentMethod === 'TAG_AUTOMATICA' ? 'Tag Auto' :
                       item.paymentMethod === 'PIX_PROPRIO' ? 'Pix' : 'Dinheiro Próprio';
      doc.text(payLabel.slice(0, 18), 172, y + 5.5);

      y += 8.5;
    });

    // Mão de Obra do Motorista (Se houver)
    if (report.driverLaborAmount && report.driverLaborAmount > 0) {
      doc.setFillColor(255, 255, 255);
      doc.rect(12, y, 186, 8.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(12, y + 8.5, 198, y + 8.5);

      doc.setTextColor(30, 41, 59);
      doc.text('-', 15, y + 5.5);
      doc.setFont('helvetica', 'bold');
      doc.text('VALOR MÃO DE OBRA MOTORISTA KM', 32, y + 5.5);
      doc.text(`R$ ${report.driverLaborAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 115, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.text('R$ 0,00', 145, y + 5.5);
      doc.text('Serviço', 172, y + 5.5);
      y += 8.5;
    }
  }

  // 5. Total Row
  doc.setFillColor(241, 245, 249);
  doc.rect(12, y, 186, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL GASTOS + SERVIÇOS:', 15, y + 5.5);
  
  const totalMotorista = totalB;
  const totalEmpresa = report.totalExpenses - driverPaidExpenses; // company paid
  
  doc.text(`R$ ${totalMotorista.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 115, y + 5.5);
  doc.text(`R$ ${totalEmpresa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 145, y + 5.5);

  y += 14;

  // 6. Observações & Assinaturas
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  if (report.generalNotes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text('Observações do Motorista:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(report.generalNotes, 14, y + 5, { maxWidth: 182 });
    y += 14;
  }

  // Assinaturas
  y = Math.max(y, 245);
  doc.setDrawColor(148, 163, 184);
  doc.line(20, y + 15, 90, y + 15);
  doc.line(120, y + 15, 190, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(report.driverName, 55, y + 19, { align: 'center' });
  doc.text('Assinatura do Motorista / Prestador', 55, y + 23, { align: 'center' });

  doc.text('ELO LOG • Financeiro / Controladoria', 155, y + 19, { align: 'center' });
  doc.text('Aprovação e Quitação de Saldo', 155, y + 23, { align: 'center' });

  // 7. Galeria de Comprovantes Fiscais Anexados (Se houver comprovantes em imagem)
  const allPhotos: { item: TripExpenseItem, url: string }[] = [];
  report.items.forEach(item => {
    const urls = item.receiptPhotoUrls || (item.receiptPhotoUrl ? [item.receiptPhotoUrl] : []);
    urls.forEach(url => {
      if (url.startsWith('data:image')) {
        allPhotos.push({ item, url });
      }
    });
  });

  if (allPhotos.length > 0) {
    doc.addPage();
    doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.rect(0, 0, 210, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ANEXO: COMPROVANTES & NOTAS FISCAIS DIGITALIZADAS', 14, 12);

    let photoY = 26;
    let photoCount = 0;
    allPhotos.forEach(({ item, url }, idx) => {
      // Limit to max 6 photos per PDF to prevent huge files in frontend (optional)
      if (photoCount >= 6) return;

      if (idx > 0 && idx % 2 === 0) {
        doc.addPage();
        photoY = 26;
      }

      try {
        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`Comprovante #${idx + 1}: ${CATEGORY_LABELS[item.category] || item.category} - R$ ${item.amount.toFixed(2)} (${item.establishmentName || item.description})`, 14, photoY);
        
        doc.addImage(url, 'JPEG', 14, photoY + 3, 100, 110, undefined, 'FAST');
        
        photoY += 125;
        photoCount++;
      } catch (imgErr) {
        console.warn('Erro ao inserir comprovante no PDF:', imgErr);
      }
    });
  }

  // Finalize
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  if (options.download) {
    doc.save(filename);
  }

  return { doc, blob, blobUrl, filename };
};
