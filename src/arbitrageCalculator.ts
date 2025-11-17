import { FundingRate, ArbitrageOpportunity } from './types';

export class ArbitrageCalculator {
  private minSpreadThreshold: number;

  constructor(minSpreadThreshold: number = 0.0001) {
    this.minSpreadThreshold = minSpreadThreshold;
  }

  calculateArbitrageOpportunities(fundingRates: FundingRate[]): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    // Group funding rates by symbol
    const ratesBySymbol = this.groupBySymbol(fundingRates);

    // For each symbol, find arbitrage opportunities
    for (const [symbol, rates] of ratesBySymbol.entries()) {
      if (rates.length < 2) continue;

      // Sort rates to find highest and lowest (using normalized rates for fair comparison)
      const sortedRates = [...rates].sort((a, b) => b.normalizedRate - a.normalizedRate);

      const highestRate = sortedRates[0];
      const lowestRate = sortedRates[sortedRates.length - 1];

      const spread = highestRate.normalizedRate - lowestRate.normalizedRate;
      const spreadPercentage = spread * 100;

      // Only include if spread is significant
      if (Math.abs(spread) >= this.minSpreadThreshold) {
        opportunities.push({
          symbol,
          longExchange: lowestRate.exchange,
          shortExchange: highestRate.exchange,
          longRate: lowestRate.fundingRate,
          shortRate: highestRate.fundingRate,
          longInterval: lowestRate.fundingInterval,
          shortInterval: highestRate.fundingInterval,
          longNormalizedRate: lowestRate.normalizedRate,
          shortNormalizedRate: highestRate.normalizedRate,
          spread,
          spreadPercentage,
          timestamp: Date.now()
        });
      }
    }

    // Sort by absolute spread (best opportunities first)
    return opportunities.sort((a, b) => Math.abs(b.spread) - Math.abs(a.spread));
  }

  private groupBySymbol(fundingRates: FundingRate[]): Map<string, FundingRate[]> {
    const grouped = new Map<string, FundingRate[]>();

    for (const rate of fundingRates) {
      if (!grouped.has(rate.symbol)) {
        grouped.set(rate.symbol, []);
      }
      grouped.get(rate.symbol)!.push(rate);
    }

    return grouped;
  }

  formatOpportunity(opp: ArbitrageOpportunity): string {
    const arrow = opp.spread > 0 ? '→' : '←';
    return [
      `\n${'='.repeat(60)}`,
      `Symbol: ${opp.symbol.toUpperCase()}`,
      `Strategy: Long ${opp.longExchange.toUpperCase()} ${arrow} Short ${opp.shortExchange.toUpperCase()}`,
      `Long Rate: ${(opp.longRate * 100).toFixed(4)}% (${opp.longInterval}h) → Normalized: ${(opp.longNormalizedRate * 100).toFixed(4)}% (8h)`,
      `Short Rate: ${(opp.shortRate * 100).toFixed(4)}% (${opp.shortInterval}h) → Normalized: ${(opp.shortNormalizedRate * 100).toFixed(4)}% (8h)`,
      `Spread (Normalized): ${opp.spreadPercentage.toFixed(4)}% (${opp.spread > 0 ? 'Profitable' : 'Negative'})`,
      `Timestamp: ${new Date(opp.timestamp).toLocaleString()}`,
      `${'='.repeat(60)}`
    ].join('\n');
  }

  displayFundingRates(fundingRates: FundingRate[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('CURRENT FUNDING RATES');
    console.log('='.repeat(80));

    const ratesBySymbol = this.groupBySymbol(fundingRates);

    for (const [symbol, rates] of ratesBySymbol.entries()) {
      console.log(`\n${symbol.toUpperCase()}:`);
      rates
        .sort((a, b) => b.normalizedRate - a.normalizedRate)
        .forEach(rate => {
          console.log(
            `  ${rate.exchange.padEnd(10)}: ${(rate.fundingRate * 100).toFixed(4)}% (${rate.fundingInterval}h) | Normalized: ${(rate.normalizedRate * 100).toFixed(4)}% (8h)`
          );
        });
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }
}
