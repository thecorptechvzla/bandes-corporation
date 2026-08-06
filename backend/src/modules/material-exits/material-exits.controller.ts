import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MaterialExitsService } from './material-exits.service.js';

@Controller('material-exits')
export class MaterialExitsController {
  constructor(private service: MaterialExitsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('report')
  report(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('type') type?: string,
    @Query('clientId') clientId?: string,
  ) {
    const reportType = type === 'detallado' ? 'detallado' : 'resumido';
    return this.service.getReportData(from, to, reportType, clientId);
  }

  @Post()
  create(
    @Body()
    body: {
      destination: string;
      lotIds?: string[];
      barIds?: string[];
    },
  ) {
    return this.service.create(body);
  }

  @Get(':id/traceability')
  traceability(@Param('id') id: string) {
    return this.service.traceability(id);
  }
}
