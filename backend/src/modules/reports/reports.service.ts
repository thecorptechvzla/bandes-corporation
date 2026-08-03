import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async clientReport(clientId: string): Promise<Buffer> {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Client not found');

    const [receivedAgg, exitedAgg, bars] = await Promise.all([
      this.prisma.bar.aggregate({
        where: { clientId },
        _sum: { fineWeight: true },
      }),
      this.prisma.bar.aggregate({
        where: { clientId, status: 'EXITED' },
        _sum: { fineWeight: true },
      }),
      this.prisma.bar.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
        include: { lot: { select: { process: { select: { isMixed: true } } } } },
      }),
    ]);

    const totalReceived = Number(receivedAgg._sum.fineWeight ?? 0);
    const totalExited = Number(exitedAgg._sum.fineWeight ?? 0);
    const balance = totalReceived - totalExited;

    let fundidoPuro = 0;
    let fundidoMixto = 0;
    for (const bar of bars) {
      const mix = bar.lot?.process?.isMixed;
      if (mix === true) fundidoMixto += Number(bar.fineWeight);
      else if (mix === false) fundidoPuro += Number(bar.fineWeight);
    }

    return this.generatePdf((doc) => {
      doc.fontSize(20).text('Gold Command Center', { align: 'center' });
      doc.fontSize(16).text(`Reporte de Cliente: ${client.name}`, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(12).text(`Peso recibido total: ${totalReceived.toFixed(4)} g`);
      doc.text(`Peso entregado total: ${totalExited.toFixed(4)} g`);
      doc.text(`Saldo actual: ${balance.toFixed(4)} g`);
      doc.moveDown();
      doc.fontSize(12).text(`Fundido estándar (1 proveedor): ${fundidoPuro.toFixed(4)} g`);
      doc.text(`Fundido mixto (2+ proveedores): ${fundidoMixto.toFixed(4)} g`);
      doc.moveDown();

      doc.fontSize(14).text('Historial de Barras:');
      for (const bar of bars) {
        doc.fontSize(10).text(
          `#${bar.barNumber} — Bruto: ${Number(bar.grossWeight).toFixed(4)} g, ` +
          `Fineza: ${Number(bar.purity).toFixed(2)}‰, ` +
          `FA: ${Number(bar.fineWeight).toFixed(4)} g — ${bar.status}`,
        );
      }
    });
  }

  async companyReport(): Promise<Buffer> {
    const exits = await this.prisma.materialExit.findMany({
      include: {
        exitDetails: {
          include: {
            lot: {
              include: {
                process: {
                  include: { client: { select: { name: true } } },
                },
              },
            },
            bars: {
              select: {
                barNumber: true,
                clientId: true,
                grossWeight: true,
                fineWeight: true,
                client: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.generatePdf((doc) => {
      doc.fontSize(20).text('Gold Command Center', { align: 'center' });
      doc.fontSize(16).text('Reporte de Trazabilidad — Empresa', { align: 'center' });
      doc.moveDown(2);

      for (const exit of exits) {
        doc.fontSize(14).text(`Egreso ID-${exit.id.slice(0, 8)}`);
        doc.fontSize(10).text(`Destino: ${exit.destination}`);
        doc.text(`Peso Total: ${Number(exit.totalWeight).toFixed(4)} g`);
        doc.text(`Fecha: ${exit.createdAt.toISOString().split('T')[0]}`);
        doc.moveDown(0.5);

for (const detail of exit.exitDetails) {
          const clientName = detail.lot?.process?.client?.name ?? 'N/A';
          const isMixed = detail.lot?.process?.isMixed ?? false;
          const typeLabel = isMixed ? 'MIXTO' : 'ESTÁNDAR';
          doc.text(
            `  → ${clientName} (${typeLabel}) — ${Number(detail.weightAported).toFixed(2)} g ` +
            `— Barras: [${detail.bars.map((b) => `#${b.barNumber}`).join(', ')}]`,
          );
          if (isMixed) {
            const byProvider = new Map<string, { count: number; gross: number; fine: number }>();
            for (const b of detail.bars) {
              const pname = b.client?.name ?? 'N/A';
              const cur = byProvider.get(pname) || { count: 0, gross: 0, fine: 0 };
              cur.count += 1;
              cur.gross += Number(b.grossWeight || 0);
              cur.fine += Number(b.fineWeight || 0);
              byProvider.set(pname, cur);
            }
            for (const [pname, agg] of byProvider) {
              doc.text(
                `      └ ${pname}: bruto ${agg.gross.toFixed(2)} g / fino ${agg.fine.toFixed(2)} g (${agg.count} barra${agg.count !== 1 ? 's' : ''})`,
              );
            }
          }
        }
        doc.moveDown();
      }
    });
  }

  private generatePdf(contents: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      contents(doc);
      doc.end();
    });
  }
}
