import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LotsService } from './lots.service.js';

@Controller('lots')
export class LotsController {
  constructor(private service: LotsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('process/:processId')
  findByProcess(@Param('processId') processId: string) {
    return this.service.findByProcess(processId);
  }

  @Post()
  create(@Body() body: { name: string; processId: string }) {
    return this.service.create(body);
  }
}
