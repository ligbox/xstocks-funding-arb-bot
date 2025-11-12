import { ExchangeClient } from './exchangeClient';
import { ArbitrageCalculator } from './arbitrageCalculator';
import { WebServer } from './webServer';
import { XSTOCKS } from './types';

class FundingArbBot {
  private exchangeClient: ExchangeClient;
  private calculator: ArbitrageCalculator;
  private webServer: WebServer;
  private updateInterval: number;
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;

  constructor(updateIntervalMinutes: number = 5, minSpreadThreshold: number = 0.0001) {
    this.exchangeClient = new ExchangeClient();
    this.calculator = new ArbitrageCalculator(minSpreadThreshold);
    this.webServer = new WebServer(3001);
    this.updateInterval = updateIntervalMinutes * 60 * 1000; // Convert to milliseconds
  }

  async start(): Promise<void> {
    console.log('\n' + '█'.repeat(80));
    console.log('XSTOCKS FUNDING ARBITRAGE BOT STARTED');
    console.log('█'.repeat(80));
    console.log(`Monitoring: ${XSTOCKS.join(', ').toUpperCase()}`);
    console.log(`Update Interval: ${this.updateInterval / 60000} minutes`);
    console.log(`Exchanges: Gate.io, Bitget`);
    console.log(`(Note: Major exchanges like Bybit/Binance/OKX don't offer stock perpetual futures)`);
    console.log('█'.repeat(80) + '\n');

    // Start web server
    this.webServer.start();

    // Initialize exchanges and load markets
    await this.exchangeClient.initialize();

    this.isRunning = true;

    // Run immediately
    await this.runAnalysis();

    // Then run at intervals
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.runAnalysis();
      }
    }, this.updateInterval);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\nShutting down gracefully...');
      await this.stop();
      process.exit(0);
    });
  }

  private async runAnalysis(): Promise<void> {
    try {
      console.log(`\n[${new Date().toLocaleString()}] Fetching funding rates...`);

      // Fetch all funding rates
      const fundingRates = await this.exchangeClient.getAllStocksFundingRates(XSTOCKS);

      if (fundingRates.length === 0) {
        console.log('⚠️  No funding rates retrieved. Please check your connection and exchange availability.');
        return;
      }

      console.log(`✓ Retrieved ${fundingRates.length} funding rates`);

      // Display current rates
      this.calculator.displayFundingRates(fundingRates);

      // Calculate arbitrage opportunities
      const opportunities = this.calculator.calculateArbitrageOpportunities(fundingRates);

      // Broadcast to web dashboard
      this.webServer.broadcast({
        fundingRates,
        opportunities,
        timestamp: Date.now()
      });

      if (opportunities.length === 0) {
        console.log('ℹ️  No significant arbitrage opportunities found at this time.\n');
      } else {
        console.log(`\n🎯 FOUND ${opportunities.length} ARBITRAGE OPPORTUNITIES:\n`);

        opportunities.forEach((opp, index) => {
          console.log(`\n[Opportunity #${index + 1}]`);
          console.log(this.calculator.formatOpportunity(opp));
        });
      }

      console.log(`\nNext update in ${this.updateInterval / 60000} minutes...\n`);
    } catch (error: any) {
      console.error('Error during analysis:', error.message);
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.webServer.stop();
    await this.exchangeClient.close();
    console.log('Bot stopped.');
  }
}

// Start the bot
const bot = new FundingArbBot(5, 0.00001); // Update every 5 minutes, min spread 0.001%
bot.start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
