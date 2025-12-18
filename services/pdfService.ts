
import { jsPDF } from 'jspdf';
import { EventData } from '../types';

export const generatePDF = async (event: EventData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const slotsPerPage = 25;
  const totalSlots = event.finalSeq - event.initialSeq + 1;
  const totalPages = Math.ceil(totalSlots / slotsPerPage);

  const margin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);
  
  // Cabeçalho ajustado: Se houver imagem, usamos um espaço fixo para ela
  const headerHeight = event.headerImage ? 80 : 95; 
  const spacing = 4;
  const gridStartY = margin + headerHeight + spacing;
  const gridHeight = pageHeight - margin - gridStartY - 4;

  const gridCols = 5;
  const gridRows = 5;
  const cellWidth = contentWidth / gridCols;
  const cellHeight = gridHeight / gridRows;

  const formatCurrency = (val: number) => 
    val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const cleanText = (text: string) => {
    if (!text) return "";
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") 
      .replace(/[^\x20-\x7E]/g, "") 
      .trim();
  };

  for (let p = 0; p < totalPages; p++) {
    if (p > 0) doc.addPage();

    if (event.headerImage) {
      // --- Caso exista imagem de cabeçalho ---
      try {
        doc.addImage(event.headerImage, 'JPEG', margin, margin, contentWidth, headerHeight, undefined, 'FAST');
      } catch (err) {
        console.error("Erro ao inserir imagem no PDF, revertendo para texto", err);
        drawFallbackHeader(doc, event, margin, contentWidth, headerHeight);
      }
    } else {
      // --- Caso não exista imagem (Fallback) ---
      drawFallbackHeader(doc, event, margin, contentWidth, headerHeight);
    }

    // --- Grade de Cartelas ---
    for (let i = 0; i < slotsPerPage; i++) {
      const slotNum = event.initialSeq + (p * slotsPerPage) + i;
      if (slotNum > event.finalSeq) break;

      const row = Math.floor(i / gridCols);
      const col = i % gridCols;
      const x = margin + (col * cellWidth);
      const y = gridStartY + (row * cellHeight);

      // Borda da Cartela
      doc.setDrawColor(210, 210, 220);
      doc.setLineWidth(0.05);
      doc.rect(x + 0.5, y + 0.5, cellWidth - 1, cellHeight - 1, 'S');

      // Número Centralizado
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(34); 
      doc.setFont('helvetica', 'bold');
      const numStr = slotNum.toString();
      const numWidth = doc.getTextWidth(numStr);
      doc.text(numStr, x + (cellWidth / 2) - (numWidth / 2), y + 13);

      // Campos de Preenchimento
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text("NOME:", x + 3, y + 21);
      doc.text("CEL:", x + 3, y + 26);
      
      doc.setDrawColor(235, 235, 235);
      doc.setLineWidth(0.15);
      doc.line(x + 13, y + 21, x + cellWidth - 3, y + 21);
      doc.line(x + 10, y + 26, x + cellWidth - 3, y + 26);

      // Rodapé da Cartela
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(110, 110, 110);
      doc.text(`Valor: R$ ${formatCurrency(event.value)}`, x + 3, y + cellHeight - 5.5);
      
      const prizeCartela = cleanText(event.prize);
      const prizeLinesCartela = doc.splitTextToSize(`Sorteio: ${prizeCartela}`, cellWidth - 6);
      doc.text(prizeLinesCartela, x + 3, y + cellHeight - 3);
    }

    // Rodapé da página
    doc.setFontSize(6);
    doc.setTextColor(180, 180, 180);
    doc.text(`Pagina ${p + 1} de ${totalPages} | Raffle Master`, margin, pageHeight - 3);
  }

  doc.save(`RIFA-${cleanText(event.title).toUpperCase().replace(/\s+/g, '-')}.pdf`);
};

function drawFallbackHeader(doc: jsPDF, event: EventData, margin: number, contentWidth: number, headerHeight: number) {
  const formatCurrency = (val: number) => 
    val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const cleanText = (text: string) => {
    if (!text) return "";
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "").trim();
  };

  // Fundo do Cabeçalho
  doc.setFillColor(255, 255, 255); 
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.1);
  doc.roundedRect(margin, margin, contentWidth, headerHeight, 2, 2, 'FD');
  
  // Título Centralizado
  const title = (cleanText(event.title).toUpperCase() || "SORTEIO");
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  const titleWidth = doc.getTextWidth(title);
  const centerX = margin + (contentWidth / 2);
  doc.text(title, centerX, margin + 15, { align: 'center' });
  
  // Linha de Destaque Centralizada
  doc.setDrawColor(79, 70, 229); // Indigo
  doc.setLineWidth(0.8);
  doc.line(centerX - 20, margin + 17, centerX + 20, margin + 17);

  // Espaço para Descrição Centralizada Verticalmente
  const infoBoxHeight = 18;
  const infoBoxY = margin + headerHeight - infoBoxHeight - 4;
  const descAreaTop = margin + 22;
  const descAreaBottom = infoBoxY - 2;
  const descAreaHeight = descAreaBottom - descAreaTop;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(80, 80, 100);
  
  const descText = cleanText(event.description) || "Participe deste sorteio e concorra a premios incriveis. Preencha seus dados corretamente na cartela abaixo.";
  const descLines = doc.splitTextToSize(descText, contentWidth - 20);
  
  // Cálculo de altura para centralização vertical
  const lineHeight = 5;
  const totalDescHeight = descLines.length * lineHeight;
  const descStartY = descAreaTop + (descAreaHeight / 2) - (totalDescHeight / 2) + 4;

  doc.text(descLines, centerX, descStartY, { align: 'center', maxWidth: contentWidth - 20 });

  // Quadro de Informações (Info Box)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + 3, infoBoxY, contentWidth - 6, infoBoxHeight, 1, 1, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const labelY = infoBoxY + 6;
  const valueY = infoBoxY + 12;

  // Colunas do Info Box
  const colWidth = (contentWidth - 6) / 4;

  doc.text("LOCAL:", margin + 6, labelY);
  doc.setFont('helvetica', 'normal');
  doc.text(cleanText(event.location).toUpperCase() || "NAO INFORMADO", margin + 6, valueY);

  doc.setFont('helvetica', 'bold');
  doc.text("DATA:", margin + 6 + colWidth, labelY);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(event.drawDate).toLocaleDateString(), margin + 6 + colWidth, valueY);

  doc.setFont('helvetica', 'bold');
  doc.text("VALOR:", margin + 6 + (colWidth * 2), labelY);
  doc.setTextColor(16, 185, 129); // Emerald Green
  doc.text(`R$ ${formatCurrency(event.value)}`, margin + 6 + (colWidth * 2), valueY);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text("PREMIO:", margin + 6 + (colWidth * 3), labelY);
  doc.setFont('helvetica', 'normal');
  const prizeText = cleanText(event.prize).toUpperCase() || "PREMIO SURPRESA";
  doc.text(doc.truncateText(prizeText, colWidth - 8), margin + 6 + (colWidth * 3), valueY);
}
