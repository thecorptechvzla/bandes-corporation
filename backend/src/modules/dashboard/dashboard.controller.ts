import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get('metrics')
  getMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('supplierId') supplierId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.service.getMetrics({ startDate, endDate, supplierId, clientId });
  }
}
