import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ClientsService } from './clients.service.js';

@Controller('clients')
export class ClientsController {
  constructor(private service: ClientsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: { name: string }) {
    return this.service.create(body);
  }

  @Get(':id/balance')
  balance(@Param('id') id: string) {
    return this.service.balance(id);
  }
}
