import { Module, Global } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { EXCHANGE_RATE_PROVIDER } from '../../common/interfaces/exchange-rate-provider.interface';

@Global()
@Module({
  providers: [
    CurrencyService,
    { provide: EXCHANGE_RATE_PROVIDER, useExisting: CurrencyService },
  ],
  exports: [CurrencyService, EXCHANGE_RATE_PROVIDER],
})
export class CurrencyModule {}
