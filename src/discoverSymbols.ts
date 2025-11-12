import * as ccxt from 'ccxt';
import { XSTOCKS, EXCHANGES } from './types';

async function discoverSymbols() {
  console.log('Discovering available tokenized stock symbols...\n');

  for (const exchangeName of EXCHANGES) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`${exchangeName.toUpperCase()}`);
    console.log('='.repeat(80));

    try {
      // @ts-ignore
      const exchange = new ccxt[exchangeName]({ enableRateLimit: true });
      await exchange.loadMarkets();

      console.log(`\nTotal markets: ${Object.keys(exchange.markets).length}`);
      console.log(`Supports fetchFundingRate: ${exchange.has['fetchFundingRate'] ? 'YES' : 'NO'}`);

      if (!exchange.has['fetchFundingRate']) {
        console.log('⚠️  This exchange does not support fetchFundingRate');
        await exchange.close();
        continue;
      }

      console.log('\nSearching for tokenized stocks...\n');

      for (const stock of XSTOCKS) {
        const upperStock = stock.toUpperCase();
        const matchingSymbols: string[] = [];

        // Search for any symbol containing the stock ticker
        for (const symbol of Object.keys(exchange.markets)) {
          const market = exchange.markets[symbol];
          if (
            market.active &&
            market.swap &&
            (symbol.includes(upperStock) || symbol.includes(stock))
          ) {
            matchingSymbols.push(symbol);
          }
        }

        if (matchingSymbols.length > 0) {
          console.log(`${stock.toUpperCase()}:`);
          matchingSymbols.forEach(sym => {
            const market = exchange.markets[sym];
            console.log(`  - ${sym} (${market.base}/${market.quote})`);
          });
        }
      }

      await exchange.close();
    } catch (error: any) {
      console.error(`Error loading ${exchangeName}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

discoverSymbols().catch(console.error);
