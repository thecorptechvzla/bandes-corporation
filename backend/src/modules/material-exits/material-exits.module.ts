import { Module } from '@nestjs/common';
import { MaterialExitsController } from './material-exits.controller.js';
import { MaterialExitsService } from './material-exits.service.js';

@Module({
  controllers: [MaterialExitsController],
  providers: [MaterialExitsService],
  exports: [MaterialExitsService],
})
export class MaterialExitsModule {}
