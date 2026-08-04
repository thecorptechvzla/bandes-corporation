import { Module } from '@nestjs/common';
import { ScaleController } from './scale.controller.js';
import { ScaleService } from './scale.service.js';

@Module({
  controllers: [ScaleController],
  providers: [ScaleService],
})
export class ScaleModule {}
