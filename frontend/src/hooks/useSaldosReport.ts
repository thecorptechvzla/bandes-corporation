import type { Bar, Client, MaterialExit, Packing } from '@/types/api';
import type { BarraEnBoveda, SaldoDetailedRecord, SaldoRecord } from '@/components/reportes/saldos/types';

interface ComputeSaldosParams {
  clients: Client[];
  bars: Bar[];
  exits: MaterialExit[];
  packings: Packing[];
  from: string;
  to: string;
  clientId?: string;
}

interface ComputeSaldosResult {
  records: SaldoRecord[];
  detailed: SaldoDetailedRecord[];
}

function padNumber(n: number): string {
  return String(n).padStart(3, '0');
}

export function computeSaldosReport({
  clients,
  bars,
  exits,
  packings,
  from,
  to,
  clientId,
}: ComputeSaldosParams): ComputeSaldosResult {
  const fromT = new Date(`${from}T00:00:00`).getTime();
  const toT = new Date(`${to}T23:59:59.999`).getTime();

  const exitDateByBar = new Map<string, string>();
  exits.forEach((exit) => {
    exit.exitDetails?.forEach((det) => det.bars?.forEach((b) => exitDateByBar.set(b.id, exit.createdAt)));
    exit.bars?.forEach((b) => exitDateByBar.set(b.id, exit.createdAt));
  });

  const packingLabel = new Map<string, string>();
  packings.forEach((p) => {
    packingLabel.set(
      p.id,
      p.packingNumber != null ? `PKG-${padNumber(p.packingNumber)}` : p.fileName
    );
  });

  const targetClients = clientId ? clients.filter((c) => c.id === clientId) : clients;

  const records: SaldoRecord[] = [];
  const detailed: SaldoDetailedRecord[] = [];

  targetClients.forEach((client) => {
    const clientBars = bars.filter((b) => b.clientId === client.id);

    const received = clientBars.filter((b) => {
      const t = new Date(b.createdAt).getTime();
      return t >= fromT && t <= toT;
    });
    const receivedGross = received.reduce((s, b) => s + Number(b.grossWeight ?? 0), 0);

    const egresado = clientBars.filter((b) => {
      const exitDate = exitDateByBar.get(b.id);
      if (!exitDate || b.status !== 'EXITED') return false;
      const t = new Date(exitDate).getTime();
      return t >= fromT && t <= toT;
    });
    const egresadoGross = egresado.reduce((s, b) => s + Number(b.grossWeight ?? 0), 0);

    const saldoActual = receivedGross - egresadoGross;
    const barrasEnBoveda = received.length - egresado.length;

    const record: SaldoRecord = {
      cliente: client.name,
      totalRecibido: receivedGross,
      totalBarrasRecibidas: received.length,
      totalEgresado: egresadoGross,
      totalBarrasEgresadas: egresado.length,
      saldoActual,
      barrasEnBoveda,
      estatusCustodia: barrasEnBoveda > 1 ? 'Con Stock' : barrasEnBoveda === 1 ? 'Saldo Mínimo' : 'Sin Stock',
    };

    if (received.length === 0 && egresado.length === 0) return;

    records.push(record);

    const barras: BarraEnBoveda[] = received.map((b) => {
      const exitDate = exitDateByBar.get(b.id);
      return {
        loteId: b.barNumber,
        packingOrigen: b.packingId ? (packingLabel.get(b.packingId) ?? '') : '',
        fechaRecepcion: b.createdAt.slice(0, 10),
        pesoBrutoRecibido: Number(b.grossWeight ?? 0),
        ley: Number(b.purity ?? 0) / 1000,
        pesoFinoDisponible: Number(b.fineWeight ?? 0),
        pesoBrutoEnBoveda: Number(b.grossWeight ?? 0),
        fechaEgreso: exitDate ? exitDate.slice(0, 10) : null,
        fueEgresado: b.status === 'EXITED' && !!exitDate,
      };
    });

    detailed.push({ ...record, barras });
  });

  records.sort((a, b) => a.cliente.localeCompare(b.cliente));
  detailed.sort((a, b) => a.cliente.localeCompare(b.cliente));

  return { records, detailed };
}
