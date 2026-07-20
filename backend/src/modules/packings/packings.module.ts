import { Module } from '@nestjs/common';
import { PackingsController } from './packings.controller.js';
import { PackingsService } from './packings.service.js';

@Module({
  controllers: [PackingsController],
  providers: [PackingsService],
  exports: [PackingsService],
})
export class PackingsModule {}
