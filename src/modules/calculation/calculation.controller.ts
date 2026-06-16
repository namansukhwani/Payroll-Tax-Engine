import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CalculationOrchestratorService } from './services/calculation-orchestrator.service';
import { CalculatePayrollDto } from './dto/calculate-payroll.dto';
import { PayrollBreakdown } from './dto/payroll-breakdown.dto';

@Controller('calculate')
export class CalculationController {
  constructor(private readonly orchestrator: CalculationOrchestratorService) {}

  @Post('payroll')
  @HttpCode(HttpStatus.OK)
  async calculatePayroll(@Body() dto: CalculatePayrollDto): Promise<PayrollBreakdown> {
    return this.orchestrator.calculatePayroll(dto);
  }
}
