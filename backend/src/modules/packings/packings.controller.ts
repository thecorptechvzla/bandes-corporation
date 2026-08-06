import { Body, Controller, Get, Param, Post, Query, BadRequestException } from '@nestjs/common';
import { PackingsService } from './packings.service.js';

@Controller('packings')
export class PackingsController {
  constructor(private service: PackingsService) {}

  @Get('next-info/:clientId')
  getNextInfo(@Param('clientId') clientId: string) {
    return this.service.getNextInfo(clientId);
  }

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(
    @Body()
    body: {
      fileName: string;
      clientId: string;
    },
  ) {
    if (!body.fileName?.trim()) throw new BadRequestException('Nombre del packing requerido');
    if (!body.clientId) throw new BadRequestException('Cliente requerido');
    return this.service.create(body);
  }

  @Post(':id/validate')
  validate(
    @Param('id') id: string,
    @Body()
    body: {
      bars: Array<{
        barId: string;
        barNumber?: string;
        grossWeight: number;
        purity: number;
        leyAg?: number;
        photoUrl?: string;
      }>;
    },
  ) {
    if (!body.bars?.length) {
      throw new BadRequestException('Se requiere al menos una barra para validar');
    }
    return this.service.validate(id, body.bars);
  }

  @Post(':id/finalize')
  finalize(@Param('id') id: string) {
    return this.service.finalize(id);
  }
}
