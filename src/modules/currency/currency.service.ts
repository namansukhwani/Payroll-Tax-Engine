import { Injectable, BadRequestException } from '@nestjs/common';
import { ExchangeRateProvider } from '../../common/interfaces/exchange-rate-provider.interface';
import { EXCHANGE_RATES } from '../../common/constants/exchange-rates.constant';
import { ErrorCode } from '../../common/constants/error-codes.constant';

@Injectable()
export class CurrencyService implements ExchangeRateProvider {
  getSupportedCurrencies(): string[] {
    return Object.keys(EXCHANGE_RATES);
  }

  validateCurrency(code: string): void {
    if (!EXCHANGE_RATES[code]) {
      throw new BadRequestException(ErrorCode.UNSUPPORTED_CURRENCY);
    }
  }

  async getRate(from: string, to: string, _date?: Date): Promise<number> {
    if (from === to) return 1;

    this.validateCurrency(from);
    this.validateCurrency(to);

    const direct = EXCHANGE_RATES[from]?.[to];
    if (direct !== undefined) {
      return direct;
    }

    // Try inverse rate: 1 / EXCHANGE_RATES[to][from]
    const inverse = EXCHANGE_RATES[to]?.[from];
    if (inverse !== undefined && inverse !== 0) {
      return 1 / inverse;
    }

    throw new BadRequestException(
      `No exchange rate found for ${from} to ${to}`,
    );
  }

  async convert(amount: number, from: string, to: string): Promise<number> {
    if (from === to) return amount;
    const rate = await this.getRate(from, to);
    return Math.round(amount * rate * 100) / 100;
  }
}
