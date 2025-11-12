export interface HistoryEntry {
  timestamp: number;
  fundingRate: number;
}

export interface FundingRate {
  exchange: string;
  symbol: string;
  fundingRate: number;
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
  longRate: number;
  shortRate: number;
  spread: number;
  spreadPercentage: number;
  timestamp: number;
}

export const EXCHANGES = ['gateio', 'bybit', 'kraken', 'bitget'] as const;
export type ExchangeName = typeof EXCHANGES[number];

export const XSTOCKS = [
  'aapl', 'amzn', 'coin', 'crcl', 'googl',
  'hood', 'mcd', 'meta', 'nvda', 'tsla',
  'spyx', 'qqq', 'qqqx'
] as const;
export type XStock = typeof XSTOCKS[number];
