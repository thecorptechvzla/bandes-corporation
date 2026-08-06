import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import type { PackingReportData, ReportType } from '@/components/reportes/packing/mockData';

interface GeneratePackingReportPDFParams {
  data: PackingReportData;
  reportId: string;
  generatedAt: string;
  dateFrom: string;
  dateTo: string;
  clientName: string;
  reportType: ReportType;
}

const PIXEL_RATIO = 2;

function drawFooter(pdf: jsPDF, pageNum: number, totalPages: number, pw: number, ph: number) {
  const yLine = ph - 14;
  const yText = ph - 9;

  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.2);
  pdf.line(10, yLine, pw - 10, yLine);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(136, 136, 136);
  pdf.text('Documento generado automáticamente por el Sistema de Custodia y Control - BANDES.', 10, yText);
  pdf.text(`Página ${pageNum} de ${totalPages}`, pw - 10, yText, { align: 'right' });
}

export async function generatePackingReportPDF(params: GeneratePackingReportPDFParams) {
  const element = document.getElementById('packing-pdf-template');
  if (!element) return;

  const { reportType } = params;
  const isLandscape = reportType === 'detallado';

  // Force container width to 750px for consistent capture
  const CAPTURE_WIDTH = 750;
  const originalWidth = element.style.width;
  const originalMinWidth = element.style.minWidth;
  const originalMaxWidth = element.style.maxWidth;
  element.style.width = CAPTURE_WIDTH + 'px';
  element.style.minWidth = CAPTURE_WIDTH + 'px';
  element.style.maxWidth = CAPTURE_WIDTH + 'px';

  const cssW = CAPTURE_WIDTH;
  const cssH = element.scrollHeight;

  const imgData = await toPng(element, {
    backgroundColor: '#ffffff',
    pixelRatio: PIXEL_RATIO,
    width: cssW,
    height: cssH,
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top left',
      width: cssW + 'px',
      height: cssH + 'px',
    },
  });

  // Restore original styles
  element.style.width = originalWidth;
  element.style.minWidth = originalMinWidth;
  element.style.maxWidth = originalMaxWidth;

  // Letter: Portrait 215.9x279.4, Landscape 279.4x215.9
  const orientation = isLandscape ? 'l' : 'p';
  const pw = isLandscape ? 279.4 : 215.9;
  const ph = isLandscape ? 215.9 : 279.4;
  const mx = 10;
  const my = 8;
  const cw = pw - mx * 2;
  const footerReserve = 16;
  const maxImgH = ph - my * 2 - footerReserve;

  const pdf = new jsPDF(orientation, 'mm', 'letter');

  // Scale: CSS pixels → mm
  const imgW = cw;
  const imgH = (cssH / cssW) * imgW;

  // Pre-load the image once
  const img = new Image();
  img.src = imgData;
  await new Promise<void>((resolve) => { img.onload = () => resolve(); });

  if (imgH <= maxImgH) {
    pdf.addImage(imgData, 'PNG', mx, my, imgW, imgH);
    drawFooter(pdf, 1, 1, pw, ph);
  } else {
    const totalPages = Math.ceil(imgH / maxImgH);

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) pdf.addPage();

      const cssSliceY = (p * maxImgH / imgH) * cssH;
      const cssSliceH = Math.min((maxImgH / imgH) * cssH, cssH - cssSliceY);
      const pdfSliceH = (cssSliceH / cssH) * imgH;

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = cssW;
      sliceCanvas.height = Math.ceil(cssSliceH);
      const ctx = sliceCanvas.getContext('2d');
      if (!ctx) continue;

      ctx.drawImage(
        img,
        0, cssSliceY, cssW, cssSliceH,
        0, 0, cssW, cssSliceH,
      );

      const sliceData = sliceCanvas.toDataURL('image/png');
      pdf.addImage(sliceData, 'PNG', mx, my, imgW, pdfSliceH);
      drawFooter(pdf, p + 1, totalPages, pw, ph);
    }
  }

  pdf.save(`Reporte_Packings_BANDES_${params.reportId.replace('#', '')}.pdf`);
}
