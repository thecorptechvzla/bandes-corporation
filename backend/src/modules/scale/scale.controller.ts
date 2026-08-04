import { Controller, Get } from '@nestjs/common';
import { ScaleService } from './scale.service.js';

@Controller('scale')
export class ScaleController {
  constructor(private service: ScaleService) {}

  @Get('weight')
  readWeight() {
    return this.service.readWeight();
  }
}
