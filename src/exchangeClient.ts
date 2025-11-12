import * as ccxt from 'ccxt';
import { FundingRate, ExchangeName, XStock, HistoryEntry } from './types';

export class ExchangeClient {
  private exchanges: Map<ExchangeName, any>;
  private symbolCache: Map<string, string | null> = new Map();

  constructor() {
    this.exchanges = new Map();
  }

  async initialize(): Promise<void> {
    // Initialize exchanges that support fetchFundingRate for tokenized stocks
    // Note: Bybit only offers tokenized stocks as Spot trading (no funding rates)
    // Note: Kraken does not support fetchFundingRate for perpetual futures
    this.exchanges.set('gateio', new ccxt.gateio({ enableRateLimit: true }));
    // this.exchanges.set('bybit', new ccxt.bybit({ enableRateLimit: true })); // Spot only, no funding rates
    this.exchanges.set('bitget', new ccxt.bitget({ enableRateLimit: true }));

    // Load markets for all exchanges
    console.log('Loading markets from exchanges...');
    for (const [name, exchange] of this.exchanges.entries()) {
      try {
        await exchange.loadMarkets();
        console.log(`✓ ${name} markets loaded`);
      } catch (error: any) {
        console.error(`✗ Failed to load ${name} markets:`, error.message);
      }
    }
  }

  private async findSymbol(exchange: ExchangeName, stock: XStock): Promise<string | null> {
    const cacheKey = `${exchange}:${stock}`;

    // Check cache first
    if (this.symbolCache.has(cacheKey)) {
      return this.symbolCache.get(cacheKey)!;
    }

    const exchangeInstance = this.exchanges.get(exchange);
    if (!exchangeInstance || !exchangeInstance.markets) {
      return null;
    }

    const upperStock = stock.toUpperCase();
    const markets = exchangeInstance.markets;

    // Try different symbol patterns based on exchange
    const patterns: string[] = [];

    // GateIO uses "X" suffix (AAPLX, AMZNX, etc.)
    if (exchange === 'gateio') {
      patterns.push(
        `${upperStock}X/USDT:USDT`,
        `${upperStock}X_USDT:USDT`
      );
    }

    // Bybit uses "1000" suffix for some stocks
    if (exchange === 'bybit') {
      patterns.push(
        `${upperStock}1000/USDT:USDT`,
        `1000${upperStock}/USDT:USDT`,
        `${upperStock}1000USDT`,
        `1000${upperStock}USDT`
      );
    }

    // Standard patterns for other exchanges
    patterns.push(
      `${upperStock}/USDT:USDT`,
      `${upperStock}USDT`,
      `${upperStock}/USDT`,
      `${upperStock}_USDT:USDT`,
      `${upperStock}/USD:USD`,
      `${upperStock}USD`,
      `${upperStock}/USD`
    );

    // Debug: Log available markets containing the stock symbol
    const relevantMarkets = Object.keys(markets).filter(m =>
      m.toUpperCase().includes(upperStock)
    );
    if (relevantMarkets.length > 0 && exchange === 'bybit') {
      console.log(`\n[DEBUG] ${exchange} markets containing ${upperStock}:`, relevantMarkets);
    }

    for (const pattern of patterns) {
      if (markets[pattern] && markets[pattern].swap && markets[pattern].active) {
        console.log(`✓ Found ${exchange} symbol: ${pattern} for ${stock}`);
        this.symbolCache.set(cacheKey, pattern);
        return pattern;
      }
    }

    // If not found, log for debugging
    if (relevantMarkets.length > 0) {
      console.log(`⚠️  ${exchange}: Could not match ${stock} with patterns. Available: ${relevantMarkets.slice(0, 3).join(', ')}`);
    }

    this.symbolCache.set(cacheKey, null);
    return null;
  }

  async getFundingRateHistory(exchange: ExchangeName, stock: XStock, days: number): Promise<HistoryEntry[]> {
    try {
      const exchangeInstance = this.exchanges.get(exchange);
      if (!exchangeInstance || !exchangeInstance.has['fetchFundingRateHistory']) {
        console.log(`⚠️  ${exchange} does not support fetchFundingRateHistory for ${stock}`);
        return [];
      }

      const symbol = await this.findSymbol(exchange, stock);
      if (!symbol) {
        return [];
      }

      const since = Date.now() - (days * 24 * 60 * 60 * 1000);
      // Funding rates occur every 8 hours (3 times per day)
      // Add generous limit: 7 days = 21, 30 days = 90, use 200 for safety
      const limit = 200;
      const history = await exchangeInstance.fetchFundingRateHistory(symbol, since, limit);

      console.log(`✓ Fetched ${history.length} funding rate history entries for ${stock} on ${exchange} (${days} days, limit: ${limit})`);
      return history.map((h: any) => ({
        timestamp: h.timestamp || Date.now(),
        fundingRate: h.fundingRate || 0
      }));
    } catch (error: any) {
      console.error(`Error fetching funding history for ${stock} on ${exchange}:`, error.message);
      return [];
    }
  }

  async getFundingRate(exchange: ExchangeName, stock: XStock): Promise<FundingRate | null> {
    try {
      const exchangeInstance = this.exchanges.get(exchange);
      if (!exchangeInstance) {
        return null;
      }

      // Check if exchange supports funding rates
      if (!exchangeInstance.has['fetchFundingRate']) {
        return null;
      }

      const symbol = await this.findSymbol(exchange, stock);
      if (!symbol) {
        return null;
      }

      // Fetch funding rate
      const fundingRate = await exchangeInstance.fetchFundingRate(symbol);

      // Fetch funding rate history for cumulative calculations
      const history7d = await this.getFundingRateHistory(exchange, stock, 7);
      const history30d = await this.getFundingRateHistory(exchange, stock, 30);

      const cumulativeFunding7d = history7d.length > 0
        ? history7d.reduce((sum, entry) => sum + entry.fundingRate, 0)
        : undefined;

      const cumulativeFunding30d = history30d.length > 0
        ? history30d.reduce((sum, entry) => sum + entry.fundingRate, 0)
        : undefined;

      return {
        exchange,
        symbol: stock,
        fundingRate: fundingRate.fundingRate || 0,
        timestamp: fundingRate.timestamp || Date.now(),
        nextFundingTime: fundingRate.fundingTimestamp,
        cumulativeFunding7d,
        cumulativeFunding30d,
        history7d,
        history30d
      };
    } catch (error: any) {
      // Only log non-silent errors
      if (!error.message.includes('does not support')) {
        console.error(`Error fetching funding rate for ${stock} on ${exchange}:`, error.message);
      }
      return null;
    }
  }

  async getAllFundingRates(stock: XStock): Promise<FundingRate[]> {
    const promises = Array.from(this.exchanges.keys()).map(exchange =>
      this.getFundingRate(exchange, stock)
    );

    const results = await Promise.allSettled(promises);

    return results
      .filter((result): result is PromiseFulfilledResult<FundingRate | null> =>
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value as FundingRate);
  }

  async getAllStocksFundingRates(stocks: readonly XStock[]): Promise<FundingRate[]> {
    const promises = stocks.map(stock => this.getAllFundingRates(stock));
    const results = await Promise.all(promises);
    return results.flat();
  }

  async close(): Promise<void> {
    for (const exchange of this.exchanges.values()) {
      await exchange.close();
    }
  }
}
