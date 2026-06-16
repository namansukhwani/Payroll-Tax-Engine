export interface ExchangeRateProvider {
  getRate(from: string, to: string, date?: Date): Promise<number>;
  getSupportedCurrencies(): string[];
}

export const EXCHANGE_RATE_PROVIDER = 'EXCHANGE_RATE_PROVIDER';
