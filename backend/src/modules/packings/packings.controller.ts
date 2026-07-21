import { Body, Controller, Get, Param, Post, BadRequestException } from '@nestjs/common';
import { PackingsService } from './packings.service.js';

@Controller('packings')
export class PackingsController {
  constructor(private service: PackingsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
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
}
