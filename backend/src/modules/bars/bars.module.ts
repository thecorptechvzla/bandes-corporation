import { Module } from '@nestjs/common';
import { BarsController } from './bars.controller.js';
import { BarsService } from './bars.service.js';

@Module({
  controllers: [BarsController],
  providers: [BarsService],
  exports: [BarsService],
})
export class BarsModule {}
