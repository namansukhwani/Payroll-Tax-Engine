export const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  USD: { INR: 83.5, GBP: 0.79, EUR: 0.92, JPY: 149.5 },
  INR: { USD: 0.012, GBP: 0.0095, EUR: 0.011, JPY: 1.79 },
  GBP: { USD: 1.27, INR: 105.26, EUR: 1.17, JPY: 189.24 },
  EUR: { USD: 1.09, INR: 90.72, GBP: 0.86, JPY: 162.5 },
};

export const BASE_CURRENCY = 'USD';
