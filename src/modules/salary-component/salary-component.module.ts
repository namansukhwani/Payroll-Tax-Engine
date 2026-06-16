import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountryModule } from '../country/country.module';
import { ComponentCondition } from './entities/component-condition.entity';
import { SalaryComponent } from './entities/salary-component.entity';
import { SalaryComponentController } from './salary-component.controller';
import { SalaryComponentService } from './salary-component.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalaryComponent, ComponentCondition]),
    CountryModule,
  ],
  controllers: [SalaryComponentController],
  providers: [SalaryComponentService],
  exports: [SalaryComponentService],
})
export class SalaryComponentModule {}
