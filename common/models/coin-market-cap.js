'use strict';

const g_timePoint1H = 1000 * 60 * 60 * 1;

module.exports = function(CoinMarketCap) {
  CoinMarketCap.startUpdateCoinMarketCap = function() {
    (async() => {
      const self = this;
      const interval = g_timePoint1H;
      const now = Date.now();
      let count = parseInt(now / interval);
      while(true) {
        const time = count * interval;
        console.log('start: ', new Date(time));
        const isCheckDB = await self.checkUpdateDB(this.app.models.CoinMarketCap, this.app.models.DataPoint1H, time);
        if (isCheckDB) {
          console.log('startUpdateCoinMarketCap() finish');
          return;
        } else {
          await self.updateCoinMarketCapDB(this.app.models.DataPoint1H, time, interval);
          await sleep(1 * 1000);
        }
        count--;
      }
    })()
  }

  CoinMarketCap.updateCoinMarketCapDB = async function(data) {
    return new Promise((resolve, reject) => {
      CoinMarketCap.create(data, (err, models) => {
        if (err) {
          return reject(err);
        } else {
          return resolve();
        }
      })
    })
  }

  CoinMarketCap.checkUpdateDB = async function(dstModel, srcModel, time) {
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

};
