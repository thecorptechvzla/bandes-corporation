import { Body, Controller, Get, Param, Post, Query, HttpCode } from '@nestjs/common';
import { BarsService } from './bars.service.js';

@Controller('bars')
export class BarsController {
  constructor(private service: BarsService) {}

  @Get()
  findAll(@Query('status') status?: string, @Query('clientId') clientId?: string) {
    return this.service.findAll({ status, clientId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('auto-select')
  @HttpCode(200)
  autoSelect(@Body() body: { clientId: string; requiredWeight: number }) {
    return this.service.autoSelect(body);
  }

  @Post()
  create(
    @Body()
    body: {
      barNumber: string;
      grossWeight: number;
      purity: number;
      clientId: string;
    },
  ) {
    return this.service.create(body);
  }
}
