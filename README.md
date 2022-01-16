# cmc-cg-portfolio
Transfer CoinMarketCap Portfolio Data to CoinGecko Portfolio (Semi-Automatic)

1. Get data from CMC Portfolio.
 a. Go to your Potfolio
 b. Open the Network tab in Dev Tools
 c. Select a coin/token
 d. Select "queryTransactionsByCrypto" request
 e. Copy the data from the Response tab
 f. Paste it on the `import.js`. See `App.Data.COINS`
2. Copy your `import.js` file with your coins data on it. Leave `PORTFOLIO_ID` null.
3. Go to your CoinGecko account
4. Go to a Portfolio (URL must be something like `https://www.coingecko.com/en/portfolios/{{id}}`
5. Open Console
6. Paste the code.
7. Run it.

I'm currently doing an automated way to export the coins data from CoinMarketCap. For now, it's manual.
