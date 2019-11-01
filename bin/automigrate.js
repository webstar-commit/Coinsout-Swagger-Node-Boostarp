// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-example-database
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var path = require('path');

var app = require(path.resolve(__dirname, '../server/server'));
var ds = app.datasources.coinscout;
ds.automigrate('Tickers', function(err) {
  if (err) throw err;

  const ticker = {
    exchange: 'sss',
    symbol: 'sss',
  }
  app.models.Tickers.create(ticker, function(err, model) {
    if (err) throw err;
    console.log(model)
    ds.disconnect();
  })
})

// ds.automigrate('Trades', function(err) {
//   if (err) throw err;

//   const ticker = {
//     exchange: 'sss',
//     symbol: 'sss',
//   }

//   app.models.Trades.create(ticker, function(err, model) {
//     if (err) throw err;
//     console.log(model)
//     ds.disconnect();
//   })
// })

// ds.automigrate('Profile', function(err) {
//   var accounts = [
//     {
//       email: 'john.doe@ibm.com',
//       first_name: 'lll',
//       last_name: 'mmm',
//     },
//   ];
//   var count = accounts.length;
//   accounts.forEach(function(account) {
//     app.models.Profile.create(account, function(err, model) {
//       if (err) throw err;

//       console.log('Created:', model);

//       count--;
//       if (count === 0)
//         ds.disconnect();
//     });
//   });
// });
