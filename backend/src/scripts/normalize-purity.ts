import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL no está definida');
}

const adapter = new PrismaPg({
  connectionString: url,
  max: 1,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});
const prisma = new PrismaClient({ adapter });

const degenerate: Prisma.DecimalFilter = { gte: 0.000001, lte: 1 };

async function main() {
  const [barCount, lotCount] = await Promise.all([
    prisma.bar.count({ where: { purity: degenerate } }),
    prisma.lot.count({ where: { purity: degenerate } }),
  ]);
  console.log(`Barras con purity <= 1 (escala fracción): ${barCount}`);
  console.log(`Lotes con purity <= 1 (escala fracción): ${lotCount}`);

  if (barCount > 0) {
    const res = await prisma.bar.updateMany({
      where: { purity: degenerate },
      data: { purity: { multiply: new Prisma.Decimal(1000) } },
    });
    console.log(`Baras corregidas a ‰: ${res.count}`);
  }

  if (lotCount > 0) {
    const res = await prisma.lot.updateMany({
      where: { purity: degenerate },
      data: { purity: { multiply: new Prisma.Decimal(1000) } },
    });
    console.log(`Lotes corregidos a ‰: ${res.count}`);
  }

  console.log('Normalización de pureza finalizada.');
}

main()
  .catch((error) => {
    console.error('Error ejecutando normalize-purity:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());