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
    @Query('clientId') clientId?: string,
  ) {
    return this.service.getReportData(from, to, clientId);
  }

  @Post()
  create(
    @Body()
    body: {
      destination: string;
      clientId?: string;
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
