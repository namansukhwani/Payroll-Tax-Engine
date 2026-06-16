import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountryModule } from '../country/country.module';
import { StatutoryContribution } from './entities/statutory-contribution.entity';
import { StatutoryContributionController } from './statutory-contribution.controller';
import { StatutoryContributionService } from './statutory-contribution.service';

@Module({
  imports: [TypeOrmModule.forFeature([StatutoryContribution]), CountryModule],
  controllers: [StatutoryContributionController],
  providers: [StatutoryContributionService],
  exports: [StatutoryContributionService],
})
export class StatutoryContributionModule {}
