import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import type { PackingReportData, ReportType } from '@/components/reportes/packing/types';

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

  // Esperar a que fuentes y el último commit de React hayan renderizado el DOM
  // antes de capturarlo, para que el PDF refleje siempre los datos reales.
  await document.fonts.ready;
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

  const { reportType } = params;
  // Landscape solo para el reporte detallado (tabla con muchos datos financieros)
  const isLandscape = reportType === 'detallado';

  // Ancho base de captura (px CSS). 780px da respiro a las columnas numéricas.
  const CAPTURE_WIDTH = 780;

  // Fijar el ancho con prioridad máxima para que el CSS !important
  // (.pdf-container, .pdf-container-detailed) no lo pise y capture
  // con un ancho distinto al que luego se escala.
  const originalWidth = element.style.width;
  const originalMinWidth = element.style.minWidth;
  const originalMaxWidth = element.style.maxWidth;
  element.style.setProperty('width', CAPTURE_WIDTH + 'px', 'important');
  element.style.setProperty('minWidth', CAPTURE_WIDTH + 'px', 'important');
  element.style.setProperty('maxWidth', CAPTURE_WIDTH + 'px', 'important');

  // Usar el ancho de contenido real (scrollWidth) como referencia de captura:
  // evita que si alguna columna desborda, se recorte a la derecha.
  const cssW = element.scrollWidth;
  const cssH = element.scrollHeight;

  const imgData = await toPng(element, {
    backgroundColor: '#ffffff',
    pixelRatio: PIXEL_RATIO,
    width: cssW,
    height: cssH,
    cacheBust: true,
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top left',
    },
  });

  // Restaurar estilos originales
  element.style.width = originalWidth;
  element.style.minWidth = originalMinWidth;
  element.style.maxWidth = originalMaxWidth;

  // Letter: Portrait 215.9x279.4, Landscape 279.4x215.9
  const orientation = isLandscape ? 'l' : 'p';
  const pw = isLandscape ? 279.4 : 215.9;
  const ph = isLandscape ? 215.9 : 279.4;
  const mx = isLandscape ? 8 : 10;
  const my = 8;
  const cw = pw - mx * 2;
  const footerReserve = 16;
  const maxImgH = ph - my * 2 - footerReserve;

  const pdf = new jsPDF(orientation, 'mm', 'letter');

  // La imagen ocupa SIEMPRE el 100% del ancho útil (cw): el contenido se
  // reduce proporcionalmente, nunca se desborda a la derecha.
  const imgW = cw;
  const imgH = (cssH / cssW) * imgW;

  // Pre-load the image once
  const img = new Image();
  img.src = imgData;
  await new Promise<void>((resolve) => { img.onload = () => resolve(); });

  const placeSlice = (p: number, totalPages: number) => {
    const cssSliceY = (p * maxImgH / imgH) * cssH;
    const cssSliceH = Math.min((maxImgH / imgH) * cssH, cssH - cssSliceY);
    const pdfSliceH = (cssSliceH / cssH) * imgH;

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = cssW * PIXEL_RATIO;
    sliceCanvas.height = Math.ceil(cssSliceH * PIXEL_RATIO);
    const ctx = sliceCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      img,
      0, cssSliceY * PIXEL_RATIO, cssW * PIXEL_RATIO, cssSliceH * PIXEL_RATIO,
      0, 0, cssW * PIXEL_RATIO, cssSliceH * PIXEL_RATIO,
    );

    const sliceData = sliceCanvas.toDataURL('image/png');
    pdf.addImage(sliceData, 'PNG', mx, my, imgW, pdfSliceH);
    drawFooter(pdf, p + 1, totalPages, pw, ph);
  };

  if (imgH <= maxImgH) {
    pdf.addImage(imgData, 'PNG', mx, my, imgW, imgH);
    drawFooter(pdf, 1, 1, pw, ph);
  } else {
    const totalPages = Math.ceil(imgH / maxImgH);

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) pdf.addPage();
      placeSlice(p, totalPages);
    }
  }

  pdf.save(`Reporte_Packings_BANDES_${params.reportId.replace('#', '')}.pdf`);
}
