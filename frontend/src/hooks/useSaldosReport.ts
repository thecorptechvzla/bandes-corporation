import type { Bar, Client, Lot, MaterialExit, Packing } from '@/types/api';
import type { BarraEnBoveda, SaldoDetailedRecord, SaldoRecord } from '@/components/reportes/saldos/types';
import { computeClientEgresoBR } from '@/lib/prorateEgresoBR';

interface ComputeSaldosParams {
  clients: Client[];
  bars: Bar[];
  lots: Lot[];
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
  lots,
  exits,
  packings,
  from,
  to,
  clientId,
}: ComputeSaldosParams): ComputeSaldosResult {
  const fromT = new Date(`${from}T00:00:00`).getTime();
  const toT = new Date(`${to}T23:59:59.999`).getTime();

  const exitDateByBar = new Map<string, string>();
  const exitDateByBarNumber = new Map<string, string>();
  const exitDateByLot = new Map<string, string>();
  exits.forEach((exit) => {
    exit.exitDetails?.forEach((det) => {
      if (det.lotId) {
        exitDateByLot.set(det.lotId, exit.createdAt);
      }
      det.bars?.forEach((b) => {
        if (b.id) exitDateByBar.set(b.id, exit.createdAt);
        if (b.barNumber) exitDateByBarNumber.set(b.barNumber, exit.createdAt);
      });
    });
    exit.bars?.forEach((b) => {
      if (b.id) exitDateByBar.set(b.id, exit.createdAt);
      if (b.barNumber) exitDateByBarNumber.set(b.barNumber, exit.createdAt);
    });
  });

  const resolveExitDate = (b: Bar): string | null =>
    exitDateByBar.get(b.id)
    ?? exitDateByBarNumber.get(b.barNumber)
    ?? (b.lotId ? exitDateByLot.get(b.lotId) ?? null : null);

  const packingLabel = new Map<string, string>();
  packings.forEach((p) => {
    packingLabel.set(
      p.id,
      p.packingNumber != null ? `PKG-${padNumber(p.packingNumber)}` : p.fileName
    );
  });

  const lotById = new Map<string, Lot>();
  lots.forEach((l) => lotById.set(l.id, l));

  const esExitEnPeriodo = (e: MaterialExit) => {
    const t = new Date(e.createdAt).getTime();
    return t >= fromT && t <= toT;
  };

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
      const exitDate = resolveExitDate(b);
      if (!exitDate || b.status !== 'EXITED') return false;
      const t = new Date(exitDate).getTime();
      return t >= fromT && t <= toT;
    });
    const egresadoGross = egresado.reduce((s, b) => s + Number(b.grossWeight ?? 0), 0);

    const egresadoBR = exits
      .filter(esExitEnPeriodo)
      .reduce((sum, e) => sum + computeClientEgresoBR(e, client.id), 0);
    const merma = egresadoGross - egresadoBR;

    const saldoActual = receivedGross - egresadoBR;
    const barrasEnBoveda = received.length - egresado.length;

    const record: SaldoRecord = {
      cliente: client.name,
      totalRecibido: receivedGross,
      totalBarrasRecibidas: received.length,
      totalEgresado: egresadoGross,
      totalEgresadoBR: egresadoBR,
      merma,
      totalBarrasEgresadas: egresado.length,
      saldoActual,
      barrasEnBoveda,
      estatusCustodia: barrasEnBoveda > 1 ? 'Con Stock' : barrasEnBoveda === 1 ? 'Saldo Mínimo' : 'Sin Stock',
    };

    if (received.length === 0 && egresado.length === 0) return;

    records.push(record);

    const enteredLots = new Set<string>();
    const barras: BarraEnBoveda[] = [];

    received.forEach((b) => {
      const lot = b.lotId ? lotById.get(b.lotId) : undefined;

      // Material refundido: el lote calibrado es LA unidad física de inventario.
      if (lot && lot.fineWeight != null) {
        if (enteredLots.has(lot.id)) return;
        enteredLots.add(lot.id);

        const lotBars = received.filter((x) => x.lotId === lot.id);
        const firstBar = lotBars[0];
        const grosInput = lotBars.reduce((s, x) => s + Number(x.grossWeight ?? 0), 0);
        const exitDate = exitDateByLot.get(lot.id) ?? null;

        barras.push({
          loteId: lot.name,
          packingOrigen: firstBar?.packingId ? (packingLabel.get(firstBar.packingId) ?? '') : '',
          fechaRecepcion: firstBar?.createdAt.slice(0, 10) ?? '',
          pesoBrutoRecibido: grosInput,
          ley: Number(lot.purity ?? 0),
          pesoFinoDisponible: Number(lot.fineWeight ?? 0),
          pesoBrutoEnBoveda: Number(lot.recovered ?? grosInput),
          fechaEgreso: exitDate ? exitDate.slice(0, 10) : null,
          fueEgresado: !!exitDate,
        });
        return;
      }

      const exitDate = resolveExitDate(b);
      barras.push({
        loteId: b.barNumber,
        packingOrigen: b.packingId ? (packingLabel.get(b.packingId) ?? '') : '',
        fechaRecepcion: b.createdAt.slice(0, 10),
        pesoBrutoRecibido: Number(b.grossWeight ?? 0),
        ley: Number(b.purity ?? 0),
        pesoFinoDisponible: Number(b.fineWeight ?? 0),
        pesoBrutoEnBoveda: Number(b.grossWeight ?? 0),
        fechaEgreso: exitDate ? exitDate.slice(0, 10) : null,
        fueEgresado: b.status === 'EXITED' && !!exitDate,
      });
    });

    detailed.push({ ...record, barras });
  });

  records.sort((a, b) => a.cliente.localeCompare(b.cliente));
  detailed.sort((a, b) => a.cliente.localeCompare(b.cliente));

  return { records, detailed };
}
