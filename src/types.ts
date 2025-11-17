export interface HistoryEntry {
  timestamp: number;
  fundingRate: number;
}

export interface FundingRate {
  exchange: string;
  symbol: string;
  fundingRate: number;
  fundingInterval: number; // in hours
  normalizedRate: number; // normalized to 8-hour interval
  timestamp: number;
  nextFundingTime?: number;
  cumulativeFunding7d?: number;
  cumulativeFunding30d?: number;
  history7d?: HistoryEntry[];
  history30d?: HistoryEntry[];
}

export interface ArbitrageOpportunity {
  symbol: string;
  longExchange: string;
  shortExchange: string;
  longRate: number;  // actual rate
  shortRate: number; // actual rate
  longInterval: number;  // funding interval in hours
  shortInterval: number; // funding interval in hours
  longNormalizedRate: number;  // normalized to 8h
  shortNormalizedRate: number; // normalized to 8h
  spread: number;  // spread of normalized rates
  spreadPercentage: number;
  timestamp: number;
}

export const EXCHANGES = ['gateio', 'bybit', 'kraken', 'bitget'] as const;
export type ExchangeName = typeof EXCHANGES[number];

// Funding interval in hours for each exchange
export const EXCHANGE_FUNDING_INTERVALS: Record<ExchangeName, number> = {
  gateio: 8,   // Every 8 hours (3 times/day)
  bitget: 4,   // Every 4 hours (6 times/day)
  bybit: 8,    // Every 8 hours (3 times/day)
  kraken: 4    // Every 4 hours (6 times/day)
};

export const XSTOCKS = [
  'aapl', 'amzn', 'coin', 'crcl', 'googl',
  'hood', 'mcd', 'meta', 'nvda', 'tsla',
  'spyx', 'qqq', 'qqqx'
] as const;
export type XStock = typeof XSTOCKS[number];
