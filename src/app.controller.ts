import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get('health')
  health(): {
    status: string;
    database: string;
    uptime: number;
    timestamp: string;
  } {
    const databaseStatus = this.dataSource.isInitialized
      ? 'connected'
      : 'disconnected';
    return {
      status: 'ok',
      database: databaseStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
