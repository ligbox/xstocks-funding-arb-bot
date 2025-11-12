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

      // Sort rates to find highest and lowest
      const sortedRates = [...rates].sort((a, b) => b.fundingRate - a.fundingRate);

      const highestRate = sortedRates[0];
      const lowestRate = sortedRates[sortedRates.length - 1];

      const spread = highestRate.fundingRate - lowestRate.fundingRate;
      const spreadPercentage = spread * 100;

      // Only include if spread is significant
      if (Math.abs(spread) >= this.minSpreadThreshold) {
        opportunities.push({
          symbol,
          longExchange: lowestRate.exchange,
          shortExchange: highestRate.exchange,
          longRate: lowestRate.fundingRate,
          shortRate: highestRate.fundingRate,
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
      `Long Rate: ${(opp.longRate * 100).toFixed(4)}%`,
      `Short Rate: ${(opp.shortRate * 100).toFixed(4)}%`,
      `Spread: ${opp.spreadPercentage.toFixed(4)}% (${opp.spread > 0 ? 'Profitable' : 'Negative'})`,
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
        .sort((a, b) => b.fundingRate - a.fundingRate)
        .forEach(rate => {
          console.log(
            `  ${rate.exchange.padEnd(10)}: ${(rate.fundingRate * 100).toFixed(4)}%`
          );
        });
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }
}
