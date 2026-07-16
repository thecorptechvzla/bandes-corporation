import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service.js';

@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('client/:id')
  async clientReport(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.service.clientReport(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-cliente-${id.slice(0, 8)}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  @Get('company')
  async companyReport(@Res() res: Response) {
    const pdf = await this.service.companyReport();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="reporte-trazabilidad.pdf"',
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}
