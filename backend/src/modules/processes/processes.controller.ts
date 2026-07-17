import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProcessesService } from './processes.service.js';

@Controller('processes')
export class ProcessesController {
  constructor(private service: ProcessesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.service.findByClient(clientId);
  }

  @Post()
  create(@Body() body: { name: string; clientId: string }) {
    return this.service.create(body);
  }
}
