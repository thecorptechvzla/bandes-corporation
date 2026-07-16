import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { ClientsModule } from './modules/clients/clients.module.js';
import { BarsModule } from './modules/bars/bars.module.js';
import { MaterialExitsModule } from './modules/material-exits/material-exits.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';

@Module({
  imports: [
    PrismaModule,
    ClientsModule,
    BarsModule,
    MaterialExitsModule,
    ReportsModule,
  ],
})
export class AppModule {}
