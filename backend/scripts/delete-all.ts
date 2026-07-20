import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL!;
console.log('Connecting to DB...');
const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Deleting all data in FK-safe order...\n');

  const steps: [string, () => Promise<{ count: number }>][] = [
    ['ExitDetail',    () => prisma.exitDetail.deleteMany()],
    ['MaterialExit',  () => prisma.materialExit.deleteMany()],
    ['Bar',           () => prisma.bar.deleteMany()],
    ['Lot',           () => prisma.lot.deleteMany()],
    ['Packing',       () => prisma.packing.deleteMany()],
    ['Process',       () => prisma.process.deleteMany()],
    ['Client',        () => prisma.client.deleteMany()],
  ];

  for (const [name, fn] of steps) {
    const result = await fn();
    console.log(`  ${name}: ${result.count} registros eliminados`);
  }

  console.log('\nListo.');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
