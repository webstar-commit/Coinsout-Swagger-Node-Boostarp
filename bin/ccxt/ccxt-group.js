
'use strict';

const ccxt = require('ccxt');

const g_time24Info = 1000 * 60 * 15;
const g_timePoint15M = 1000 * 60 * 15;
const g_timePoint30M = 1000 * 60 * 30;
const g_timePoint1H = 1000 * 60 * 60 * 1;
const g_timePoint4H = 1000 * 60 * 60 * 4;
const g_timePoint1D = 1000 * 60 * 60 * 24;
const g_timePoint1W = 1000 * 60 * 60 * 24 * 7;

const g_dataPointNum = 1000;

module.exports = {
  main: function(app) {
    console.log('Data grouping');
    const main = new CDataGrouping(app);
  },
};

const g_startTime = 1516066200000;

class CDataGrouping {
  constructor(app) {
    this.app = app;
    (async() => {
      const interval = g_timePoint15M;
      this.startGrouping(app);
    })()
  }

  async startGrouping(app) {
    const self = this;

    const interval = g_timePoint15M;
    await this.printDayDB(interval);

    setInterval(function() {
      (async() => {
        self.printDayDB(interval);
      })()
    }, interval);

    setInterval(function() {
      self.startUpdateDataPoint(app.models.DataPoint30M, app.models.DataPoint15M, g_timePoint30M);
    }, g_timePoint30M);
    setInterval(function() {
      self.startUpdateDataPoint(app.models.DataPoint1H, app.models.DataPoint30M, g_timePoint1H);
    }, g_timePoint1H);
    setInterval(function() {
      self.startUpdateDataPoint(app.models.DataPoint4H, app.models.DataPoint1H, g_timePoint4H);
    }, g_timePoint4H);
    setInterval(function() {
      self.startUpdateDataPoint(app.models.DataPoint1D, app.models.DataPoint4H, g_timePoint1D);
    }, g_timePoint1D);
    setInterval(function() {
      self.startUpdateDataPoint(app.models.DataPoint1W, app.models.DataPoint1D, g_timePoint1W);
    }, g_timePoint1W);

    // setInterval(function() {
    //   CoinMarketCap.startUpdateCoinMarketCap();
    // }, g_timePoint1H);

    setInterval(function() {
      (async() => {
        await self.removeTradesWithTimeout(g_timePoint1D * 1.1);
        await self.removeDataPointWithTimeout(self.app.models.DataPoint15M, g_timePoint15M * g_dataPointNum);
        await self.removeDataPointWithTimeout(self.app.models.DataPoint30M, g_timePoint30M * g_dataPointNum);
        await self.removeDataPointWithTimeout(self.app.models.DataPoint1H, g_timePoint1H * g_dataPointNum);
        console.log('FiatCurrency.resetAllCurrency', new Date());
        await app.models.FiatCurrency.resetAllCurrency();
      })()
    }, g_timePoint4H);
    setInterval(function() {
      (async() => {
        await self.removeDataPointWithTimeout(self.app.models.DataPoint4H, DataPoint4H * g_dataPointNum);
      })()
    }, g_timePoint1D);
    setInterval(function() {
      (async() => {
        await self.removeDataPointWithTimeout(self.app.models.DataPoint1D, DataPoint1D * g_dataPointNum);
        await self.removeDataPointWithTimeout(self.app.models.DataPoint1W, g_timePoint1W * g_dataPointNum);
      })()
    }, g_timePoint1W);

    while (true) {
      try {
        // console.log('ArbitrageTable.resetAll', new Date());
        // await app.models.ArbitrageTable.resetAll();

        console.log('Ticket24.resetAllData', new Date());
        await app.models.Ticket24.asyncResetAllData();

        console.log('Ticket24.updateCoin24Info', new Date());
        await app.models.Ticket24.updateCoin24Info();

        console.log('Ticket24.resetExchange24', new Date());
        await app.models.Ticket24.resetExchange24(ccxt.exchanges);
      } catch(e) {
        console.log(e);
      }
    }
  }

  async printDayDB(interval) {
    const self = this;
    const now = Date.now();
    let count = parseInt(now / interval);
    while(true) {
      const time = count * interval;
      console.log('start: ', new Date(time));
      const isData = await self.checkDB(self.app.models.DataPoint15M, time);
      if (!isData) {
        await self.updateDay(time, interval);
        await sleep(3 * 1000);
      } else {
        console.log('exist: ', new Date(time));
        return;
      }
      if (time < g_startTime) {
        console.log('finish: ', new Date(time));
        return;
      }
      count--;
    }
  }

  async checkDB(model, time) {
    return new Promise((resolve, reject) => {
      const query = {
        where: {
          timestamp: time
        },
        limit: 1
      };
      model.find(query, function(err, trades) {
        if (err) {
          console.log('checkDB read err: ', err);
          return reject(err);
        } else {
          return resolve(trades.length);
        }
      });
    })
  }


  async updateDay(time, interval) {
    // console.log(time1.getTime());
    // const curTime = Date.now();
    // console.log(new Date(curTime));
    const t1 = time + interval * 0.5;
    const t2 = t1 - interval;
    // await Promise.all(ccxt.exchanges.map(async exchange => {
      const query = {
        order: 'symbol ASC',
        where: {
          // symbol: 'BTC/USD',
          updateAt: {
            between: [t2, t1]
          }
        },
        // limit: 100
      };
    // }))
    try {
      const tradesInfos = await this.getTradesPoints(query, (t1 + t2) * 0.5);
      let self = this;
      let coinprices = {};
      // await Promise.all(tradesInfos.map(async tradeInfo => {
      //   const str = tradeInfo.symbol.split('/');
      //   let base, price;
      //   if (str[0] == 'BTC') {
      //     base = str[1];
      //     coinprices[base] = 1 / average([tradeInfo.price_buy, tradeInfo.price_sell]);
      //   } else if (str.length > 1 && str[1] == 'BTC') {
      //     base = str[0];
      //     coinprices[base] = average([tradeInfo.price_buy, tradeInfo.price_sell]);
      //   }
      // }))
      const cmc = new ccxt.coinmarketcap();
      await cmc.loadMarkets();
      const coins = Object.keys(cmc.currencies);
      await Promise.all(coins.map(async id => {
        const coin = cmc.currencies[id];
        coinprices[coin.code] = {};
        if (coin.info['price_usd']) {
          coinprices[coin.code]['btc'] = coin.info['price_btc'];
          coinprices[coin.code]['etc'] = coin.info['price_etc'];
          coinprices[coin.code]['usd'] = coin.info['price_usd'];
          coinprices[coin.code]['percent_change_24h'] = coin.info['percent_change_24h'];
        }
      }));
      for (let currency in coinprices) {
        await self.updateDBCoinPrice(currency, coinprices[currency]);
      }
    } catch(err) {
      console.log(err);
    }
  }

  async updateDBCoinPrice(currency, info) {
    const self = this;
    return new Promise((resolve, reject) => {
      const data = {
        currency: currency,
        btc: info.btc,
        etc: info.etc,
        usd: info.usd,
        percent_change_24h: info.percent_change_24h,
        updateAt: Date.now()
      }
      self.app.models.CoinPrice.upsertWithWhere({currency, currency}, data, (err, model) => {
        if (err) {
          return reject(err);
        } else {
          return resolve();
        }
      })
    });
  }

  async getTradesPoints(query, time) {
    return new Promise((resolve, reject) => {
      const self = this;
      this.app.models.TradesInfo.find(query, function(err, trades) {
        if (err) {
          console.log('trades db read err: ', err);
          return reject(err);
        } else {
          if (trades.length > 0) {
            let trade_datas = self.groupingWithSymbol(trades);
            // let order_datas = self.groupingWithSymbol(orders);
            let models = [];
            for (let symbol in trade_datas) {
              let data =  self.makeGroupDataTrades2(symbol, trade_datas[symbol]);
              data.timestamp = time;
              models.push(data);
            }
            self.app.models.DataPoint15M.create(models, (err, model) => {
              if (err) {
                console.log('write DataPoint15M: ', err);
                return reject(err);
              } else {
                console.log('+++', trades.length, models.length, new Date(time));
                return resolve(models);
              }
            });
          }
        }
      })
    })
  }

  async removeTradesWithTimeout(timelimit) {
    const self = this;
    return new Promise((resolve, reject) => {
      const query = {
        updateAt: {
          lt: Date.now() - timelimit
        }
      };
      console.log('removing...');
      self.app.models.TradesInfo.deleteAll(query, function(err, trades) {
        if (err) {
          console.log('removeTradesWithTimeout read err: ', err);
          return reject(err);
        } else {
          console.log('removed trades:', trades);
          return resolve(trades.length);
        }
      });
    });
  }
  async removeOrdersWithTimeout(timelimit) {
    const self = this;
    return new Promise((resolve, reject) => {
      const query = {
        updateAt: {
          lt: Date.now() - timelimit
        }
      };
      console.log('removing...');
      self.app.models.orders.deleteAll(query, function(err, trades) {
        if (err) {
          console.log('removeOrdersWithTimeout read err: ', err);
          return reject(err);
        } else {
          console.log('removed orders:', trades);
          return resolve(trades.length);
        }
      });
    });
  }

  async removeDataPointWithTimeout(model, timelimit) {
    const self = this;
    return new Promise((resolve, reject) => {
      const query = {
        updateAt: {
          lt: Date.now() - timelimit
        }
      };
      model.deleteAll(query, function(err, trades) {
        if (err) {
          console.log('removeDataPointWithTimeout read err: ', err);
          return reject(err);
        } else {
          console.log('removed DataPoint:', trades);
          return resolve(trades.length);
        }
      });
    });
  }

  groupingWithSymbol(base_data) {
    let datas = {};
    let symbol;
    for (let i = 0; i < base_data.length; i++) {
      if (symbol == base_data[i].symbol) {
        datas[symbol].push(base_data[i]);
      } else {
        symbol = base_data[i].symbol;
        datas[symbol] = [];
        datas[symbol].push(base_data[i]);
      }
    }
    return datas;
  }

  makeGroupDataOrders(symbol, trades, orders) {
    if (!orders)
      return null;

    let volume_sum_buy = 0, volume_sum_sell = 0;
    let amount_sum_buy = 0, amount_sum_sell = 0;
    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      if (trade.volume_buy) {
        for (let k = 0; k < orders.length; k++) {
          if (orders[k].exchange == trade.exchange) {
            const amount = trade.volume_buy / trade.price_buy;
            volume_sum_buy += orders[k].ask * amount;
            amount_sum_buy += amount;
            break;
          }
        }
      }
      if (trade.volume_sell) {
        for (let k = 0; k < orders.length; k++) {
          if (orders[k].exchange == trade.exchange) {
            const amount = trade.volume_sell / trade.price_sell;
            volume_sum_sell += orders[k].ask * amount;
            amount_sum_sell += amount;
            break;
          }
        }
      }
    }

    let price_vwap_buy;
    if (amount_sum_buy) {
      price_vwap_buy = volume_sum_buy / amount_sum_buy;
    }
    let price_vwap_sell;
    if (amount_sum_sell) {
      price_vwap_sell = volume_sum_sell / amount_sum_sell;
    }
    return {
      open_buy: price_vwap_buy,
      open_sell: price_vwap_sell,
    }
  }

  makeGroupDataTrades2(symbol, trades) {
    if (symbol == 'BTC/USD')
      console.log('BBB');

    let results = [];
    let volume_buy = 0, volume_sell = 0;
    let price_high = 0, price_low = Number.MAX_SAFE_INTEGER;

    let amount_sum_buy = 0, amount_sum_sell = 0;
    let timeAt_sum = 0;

    let price_open, price_close;
    let price_vwap_buy, price_vwap_sell;

    function compare(a,b) {
      if (a.updateAt < b.updateAt)
        return -1;
      if (a.updateAt > b.updateAt)
        return 1;
      return 0;
    }
    trades.sort(compare);

    let exchanges = {};
    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];

      if (!price_open) {
        price_open = trade.open;
      }
      if (trade.close) {
        price_close = trade.close;
      }

      if (trade.high) {
        price_high = price_high > trade.high? price_high : trade.high;
      }
      if (trade.low) {
        price_low = price_low < trade.low ? price_low : trade.low;
      }

      let amount_sell, amount_buy = 0;
      if (trade.price_sell) {
        volume_sell += trade.volume_sell;
        amount_sell = trade.volume_sell / trade.price_sell;
        amount_sum_sell += amount_sell;
      }
      if (trade.price_buy) {
        volume_buy += trade.volume_buy;
        amount_buy = trade.volume_buy / trade.price_buy;
        amount_sum_buy += amount_buy;
      }
      timeAt_sum += trade['updateAt'] / 1000;

      if (exchanges[trade.exchange]) {
        exchanges[trade.exchange].amount += (amount_buy + amount_sell);
        exchanges[trade.exchange].volume += (trade.volume_sell + trade.volume_buy);
      } else {
        exchanges[trade.exchange] = {};
        exchanges[trade.exchange].amount = (amount_buy + amount_sell);
        exchanges[trade.exchange].volume = (trade.volume_sell + trade.volume_buy);
      }
    }
    if (price_high == 0) {
      price_high = undefined;
    }
    if (price_low == Number.MAX_SAFE_INTEGER) {
      price_low = undefined;
    }

    let price_vwap;
    if (amount_sum_buy > 0) {
      price_vwap_buy = volume_buy / amount_sum_buy;
    }
    if (amount_sum_sell > 0) {
      price_vwap_sell = volume_sell / amount_sum_sell;
    }

    // const kk = Object.keys(exchanges).length;
    // if(kk > 1) {
    //   console.log('0000');
    // }

    const vwap = (volume_buy + volume_sell) / (amount_sum_buy + amount_sum_sell);
    return {
      symbol: symbol,
      open: price_open,
      close: price_close,
      high: price_high,
      low: price_low,

      price: vwap,
      price_buy: price_vwap_buy,
      price_sell: price_vwap_sell,
      volume_buy: volume_buy,
      volume_sell: volume_sell,
      exchanges: JSON.stringify(exchanges),
      updateAt: parseInt(timeAt_sum / trades.length * 1000),
    }
  }

  makeGroupDataTrades(symbol, trades) {
    if (symbol == 'BTC/USD')
      console.log('BBB');

    let results = [];
    let count_buy = 0, volume_buy = 0;
    let count_sell = 0, volume_sell = 0;
    // let price_aver_buy, price_sum_buy = 0, volume_buy = 0;
    let price_high_buy = 0, price_low_buy = Number.MAX_SAFE_INTEGER;
    // let price_aver_sell, price_sum_sell = 0, volume_sell = 0;
    let price_high_sell = 0, price_low_sell = Number.MAX_SAFE_INTEGER;

    let amount_sum_buy = 0, amount_sum_sell = 0;
    let timeAt_sum = 0;

    let price_open_buy, price_open_sell;
    let price_close_buy, price_close_sell;

    function compare(a, b) {
      if (a.updateAt < b.updateAt)
        return -1;
      if (a.updateAt > b.updateAt)
        return 1;
      return 0;
    }
    trades.sort(compare);

    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];

      if (!price_open_buy) {
        price_open_buy = trade.price_buy;
      }
      if (!price_open_sell) {
        price_open_sell = trade.price_sell;
      }

      if (trade.price_buy) {
        price_close_buy = trade.price_buy;
      }
      if (trade.price_sell) {
        price_close_sell = trade.price_sell;
      }
      // if (trade.price_sell) {
      //   price_sum_sell += trade.price_sell;
      //   count_sell++;
      // }
      // if (trade.price_buy) {
      //   price_sum_buy += trade.price_buy;
      //   count_buy++;
      // }
      if (trade.high_sell) {
        price_high_sell = price_high_sell > trade.high_sell ? price_high_sell : trade.high_sell;
      }

      if (trade.high_buy) {
        price_high_buy = price_high_buy > trade.high_buy ? price_high_buy : trade.high_buy;
      }

      if (trade.low_sell) {
        price_low_sell = price_low_sell < trade.low_sell ? price_low_sell : trade.low_sell;
      }
      if (trade.low_buy) {
        price_low_buy = price_low_buy < trade.low_buy ? price_low_buy : trade.low_buy;
      }

      if (trade.volume_sell) {
        volume_sell += trade.volume_sell;
        amount_sum_sell += trade.volume_sell / trade.price_sell;
      }
      if (trade.volume_buy) {
        volume_buy += trade.volume_buy;
        amount_sum_buy += trade.volume_buy / trade.price_buy;
      }
      timeAt_sum += trade['updateAt'] / 1000;
    }
    // if (count_buy > 0) {
    //   price_aver_buy = price_sum_buy / count_buy;
    // }
    // if (count_sell > 0) {
    //   price_aver_sell = price_sum_sell / count_sell;
    // }
    if (price_high_buy == 0) {
      price_high_buy = undefined;
    }
    if (price_high_sell == 0) {
      price_high_sell = undefined;
    }
    if (price_low_buy == Number.MAX_SAFE_INTEGER) {
      price_low_buy = undefined;
    }
    if (price_low_sell == Number.MAX_SAFE_INTEGER) {
      price_low_sell = undefined;
    }

    let price_vwap_buy = 0;
    let price_vwap_sell = 0;
    if (amount_sum_buy > 0) {
      price_vwap_buy = volume_buy / amount_sum_buy;
    }
    if (amount_sum_sell > 0) {
      price_vwap_sell = volume_sell / amount_sum_sell;
    }

    return {
      symbol: symbol,
      open_buy: price_open_buy,
      open_sell: price_open_sell,
      close_buy: price_close_buy,
      close_sell: price_close_sell,

      price_sell: price_vwap_sell,
      price_sell: price_vwap_buy,
      high_buy: price_high_buy,
      high_sell: price_high_sell,
      low_buy: price_low_buy,
      low_sell: price_low_sell,

      volume_buy: volume_buy,
      volume_sell: volume_sell,
      updateAt: parseInt(timeAt_sum / trades.length * 1000),
    }
  }

  startUpdateDataPoint(dstModel, srcModel, interval) {
    (async() => {
      const self = this;
      const now = Date.now();
      let count = parseInt(now / interval);
      while(true) {
        const time = count * interval;
        console.log('start: ', new Date(time));
        const isCheckDB = await self.checkUpdateDB(dstModel, srcModel, time);
        if (isCheckDB) {
          console.log('startUpdateDataPoint() finish');
          return;
        } else {
          await self.updateDataPoint(dstModel, srcModel, time, interval);
          await sleep(1 * 1000);
        }
        count--;
      }
    })()
  }

  async checkUpdateDB(dstModel, srcModel, time) {
    return new Promise((resolve, reject) => {
      const query = {
        where: {
          timestamp: time
        },
        limit: 1
      };
      dstModel.find(query, function(err, datas) {
        if (err) {
          console.log('checkUpdateDB read err: ', err);
          return reject(err);
        } else {
          if (datas.length > 0) {
            console.log('exist db');
            return resolve(true);
          } else {
            srcModel.find(query, function(err, srcDatas) {
              if (err) {
                console.log('checkUpdateDB read err: ', err);
                return reject(err);
              } else {
                if (srcDatas.length > 0) {
                  return resolve(false);
                } else {
                  console.log('src data is not exist');
                  return resolve(true);
                }
              }
            })
          }
        }
      });
    })
  }

  async updateDataPoint(dstModel, srcModel, time, interval) {
    const datas = await this.getTimeDataPoint(srcModel, time, interval);
    let symbol_data = this.groupingWithSymbol(datas);
    let models = [];
    for (let symbol in symbol_data) {
      let data;
      // if (symbol_data[symbol].length == 1) {
      //   data = symbol_data[symbol];
      // } else {
        data = this.makeGroupDataPoint(symbol, symbol_data[symbol]);
      // }
      data.timestamp = time;
      models.push(data);
    }
    await this.writeDBDataPoint(dstModel, models);
    console.log('+++', models.length);
  }

  makeGroupDataPoint(symbol, dataPoints) {
    let results = [];
    let volume_buy = 0, volume_sell = 0;
    let price_high = 0, price_low = Number.MAX_SAFE_INTEGER;

    let amount_sum_buy = 0, amount_sum_sell = 0;
    let timeAt_sum = 0;

    let price_open, price_close;
    let price_vwap_buy, price_vwap_sell;

    function compare(a,b) {
      if (a.updateAt < b.updateAt)
        return -1;
      if (a.updateAt > b.updateAt)
        return 1;
      return 0;
    }
    dataPoints.sort(compare);

    let exchanges = {};
    for (let i = 0; i < dataPoints.length; i++) {
      const trade = dataPoints[i];

      if (!price_) {
        price_open = trade.open;
      }
      if (trade.close) {
        price_close = trade.close;
      }

      if (trade.high) {
        price_high = price_high > trade.high? price_high : trade.high;
      }
      if (trade.low) {
        price_low = price_low < trade.low ? price_low : trade.low;
      }

      let amount = 0;
      if (trade.price_sell) {
        volume_sell += trade.volume_sell;
        amount += trade.volume_sell / trade.price_sell;
        amount_sum_sell += amount;
      }
      if (trade.price_buy) {
        volume_buy += trade.volume_buy;
        amount += trade.volume_buy / trade.price_buy;
        amount_sum_buy += amount;
      }
      timeAt_sum += trade['updateAt'] / 1000;
    }
    if (price_high == 0) {
      price_high = undefined;
    }
    if (price_low == Number.MAX_SAFE_INTEGER) {
      price_low = undefined;
    }

    let price_vwap;
    if (amount_sum_buy > 0) {
      price_vwap_buy = volume_buy / amount_sum_buy;
    }
    if (amount_sum_sell > 0) {
      price_vwap_sell = volume_sell / amount_sum_sell;
    }

    return {
      symbol: symbol,
      open: price_open,
      close: price_close,
      high: price_high,
      low: price_low,

      price_buy: price_vwap_buy,
      price_sell: price_vwap_sell,
      volume_buy: volume_buy,
      volume_sell: volume_sell,
      updateAt: parseInt(timeAt_sum / dataPoints.length * 1000),
    }
  }

  async writeDBDataPoint(dataModel, data) {
    return new Promise((resolve, reject) => {
      dataModel.create(data, (err, model) => {
        if (err) {
          console.log('write DataPoint: ', err);
          return reject(err);
        } else {
          return resolve(data);
        }
      });
    })
  }

  async getTimeDataPoint(dataModel, time, interval) {
    return new Promise((resolve, reject) => {
      const t1 = time + interval * 0.5;
      const t2 = t1 - interval;
      const query = {
        order: 'symbol ASC',
        where: {
          // symbol: 'BTC/USD',
          updateAt: {
            between: [t2, t1]
          }
        },
      };
      dataModel.find(query, function(err, data) {
        if (err) {
          return reject(err);
        } else {
          return resolve(data);
        }
      })
    })
  }

}


let sleep = (ms) => new Promise (resolve => setTimeout (resolve, ms))
