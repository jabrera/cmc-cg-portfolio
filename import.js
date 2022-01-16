var App = {
    Data: {
        PORTFOLIO_ID: null, // leave it null, all you need to do is to configure the App.Data.COINS
        COINS: {
           /*
            "tick_symbol": {
                "name": "Coin/Token Name from Coin Gecko",
                "transactions": {data copied from CMC}
            },
            "ada": {
                "name": "Cardano",
                "transactions": {data copied from CMC}
            },
            "btc": {
                "name": "Bitcoin",
                "transactions": {data copied from CMC}
            },
            ...
          */
        }
    },
    Constant: {
        DEVELOPMENT: true,
        TIMEOUT: 1000,
        ROOT_URL: "https://www.coingecko.com",
        API: {
            TRANSACTION: "/en/portfolios/{{portfolioId}}/{{coin}}/transactions",
            ADD_COIN: "/en/portfolios/{{portfolioId}}/coins/{{coinId}}.json"
        },
        DEFAULT_CURRENCY: "usd",
        CMC_CG_TRANSACTION_TYPE: {
            "buy": "buy",
            "sell": "sell",
            "transferIn": "transfer_in",
            "transferOut": "transfer_out",
        },
    },
    Request: {
        Method: {
            GET: "get",
            POST: "post"
        },
        getCsrfToken: function() {
            return $("meta[name='csrf-token']").attr("content");
        },
        getHeaderOptions: function(method, data = null) {
            var options = {
                method: method,
                headers: new Headers({
                    'Accept': 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    "x-requested-with": "XMLHttpRequest",
                    "x-csrf-token": App.Request.getCsrfToken()
                })
            };
            if(data != null) {
                options.body = Object.keys(data).map(function(k) {
                    return encodeURIComponent(k) + '=' + encodeURIComponent(data[k])
                }).join('&')
            }
            return options;
        },
        get: async function(url, data = null, headers = null) {
            return new Promise(async function(resolve) {
                resolve(await App.Request.send(url, App.Request.Method.GET, data, headers));
            });
        },
        post: async function(url, data = null, headers = null) {
            return new Promise(async function(resolve) {
                resolve(await App.Request.send(url, App.Request.Method.POST, data, headers));
            });
        },
        send: async function(url, method, data = null, headers = null) {
            return new Promise(async function(resolve) {
                if(headers == null) {
                    headers = App.Request.getHeaderOptions(method, data);
                }
                const request = await fetch(url, headers);
                const response = await request.json();
                resolve(response);
            });
        },
    },
    Utility: {
        getRandomArbitrary: function(min, max) {
            return Math.random() * (max - min) + min;
        },
        timeout: function(ms = App.Constant.TIMEOUT) {
            // App.Utility.log(`Pause for ${ms} ms`);
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        log: function(msg) {
            if(App.Constant.DEVELOPMENT) {
                var date = new Date();
                console.log("[INFO] " + date.toLocaleDateString() + " " + date.toLocaleTimeString() + " -- " + msg);
            }
        },
        error: function(msg) {
            if(App.Constant.DEVELOPMENT) {
                var date = new Date();
                console.error("[ERROR] " + date.toLocaleDateString() + " " + date.toLocaleTimeString() + " -- " + msg);
            }
        },
    },
    init: async function() {
        App.Data.PORTFOLIO_ID = window.location.href.split("/")[5];
        var cg_coins = await App.Request.get("https://api.coingecko.com/api/v3/coins/list");
        function find(symbol, name) {
            for(var x in cg_coins) {
                var coin = cg_coins[x];
                if(coin.symbol.toLowerCase() == symbol.toLowerCase() && coin.name.toLowerCase() == name.toLowerCase()) return coin;
            }
            return null;
        }
        var errors = [];
        for(var token in App.Data.COINS) {
            var coin = App.Data.COINS[token];
            var cg_coin = find(token, coin.name);
            if(cg_coin == null) {
                errors.push(coin)
            }
        }
        if(errors.length != 0) {
            App.Utility.log("Errors in following coins. Please check the name and tick symbol");
            App.Utility.log(errors);
            return false;
        }
        for(var token in App.Data.COINS) {
            var coin = App.Data.COINS[token];
            App.Utility.log(`Finding ${token}...`);
            var cg_coin = find(token, coin.name);
            App.Utility.log(`\tGetting ${token} details...`);
            var r = await App.Request.get("https://api.coingecko.com/api/v3/coins/" + cg_coin.id);
            var cg_coin_id = r.image.thumb.split("/")[5];
            App.Utility.log(`\tAdding ${token} to portfolio...`);
            await App.Request.post(App.Constant.ROOT_URL + App.Constant.API.ADD_COIN.replace("{{coinId}}", cg_coin_id).replace("{{portfolioId}}", App.Data.PORTFOLIO_ID), {"source": null}, {
                method: App.Request.Method.POST,
                headers: new Headers({
                    'Accept': '*/*',
                    'Content-Type': 'application/json; charset=utf-8',
                    "x-csrf-token": App.Request.getCsrfToken()
                }),
                body: JSON.stringify({
                    "source": null
                })
            });
            App.Utility.log(`\tAdding ${token}'s transactions...`);
            for(var index in coin.transactions.data.list) {
                tx = coin.transactions.data.list[index];
                var type = tx.transactionType;
                var price = tx.price;
                var quantity = tx.amount;
                var timestamp = tx.transactionTime.replace("+0000","Z")
                var notes = tx.note;
                var data = {
                    "utf8": "✓",
                    "portfolio_coin_transaction[price]": price,
                    "preview_spent_input": price,
                    "transaction_type_transfer": type,
                    "portfolio_coin_transaction[quantity]": quantity,
                    "portfolio_coin_transaction[transaction_timestamp]": timestamp,
                    "portfolio_coin_transaction[fees]": "0",
                    "portfolio_coin_transaction[notes]": notes,
                    "portfolio_coin_transaction[coin_id]": cg_coin_id,
                    "portfolio_coin_transaction[currency]": App.Constant.DEFAULT_CURRENCY,
                    "commit": "Submit"
                }
                data["portfolio_coin_transaction[transaction_type]"] = App.Constant.CMC_CG_TRANSACTION_TYPE[type];
                App.Utility.log(`\t${token} (${parseInt(index)+1}/${coin.transactions.data.list.length})\t${type} - ${quantity} at ${price}`);
                await App.Request.post(App.Constant.ROOT_URL + App.Constant.API.TRANSACTION.replace("{{coin}}", cg_coin.id).replace("{{portfolioId}}", App.Data.PORTFOLIO_ID), data);
            }
        }
    }
}
await App.init();
