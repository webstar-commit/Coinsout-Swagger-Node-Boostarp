// import { resolve } from "url";


'use strict';


module.exports = function(app) {
  app.get('/detailpage', function(req, res) {
    const coin_id = req.param('id');
    if (coin_id) {
      app.models.CoinData.getCoinData(coin_id, function(that, data) {
        if (data && data.length > 0) {
          return renderPage(data[0], res);
        }
      })
    } else {
      const coin_name = req.param('name');
      if (coin_name) {
        app.models.CoinData.find({ where: {name: coin_name} }, function(err, data) {
          if (data && data.length > 0) {
            return renderPage(data[0], res);
          }
        })
      }
    }
  });

  function renderPage(data, res) {
      const fiatCurrency = 'USD';
      app.models.TradesInfo.getLastCurrency(data.base_name, fiatCurrency.toLowerCase(), function(that, price_res) {
        let html_diff, htmlbtc, htmletc;
        // const diff_val = '$' + (price_res.price * price_res.diff).toFixed(2);
        // if (price_res.diff > 0) {
        //   html_diff = '<div class="text-bold text-success">' +
        //     diff_val + ' (' + price_res.diff.toFixed(2) + '%)' +
        //     '<em class="fa fa-fw fa-caret-up"></em></div>'
        // } else if (price_res.diff < 0) {
        //   html_diff = '<div class="text-bold text-danger">' +
        //     diff_val + ' (' + price_res.diff.toFixed(2) + '%)' +
        //     '<em class="fa fa-fw fa-caret-down"></em></div>'
        // } else {
        //   html_diff = ''
        // }

        if (price_res.btc_diff > 0) {
          htmlbtc = '<span class="text-success">' + price_res.btc_diff.toFixed(3) + '%</span>'
        } else if (price_res.btc_diff < 0) {
          htmlbtc = '<span class="text-danger">' + price_res.btc_diff.toFixed(3) + '%</span>'
        } else {
          htmlbtc = 'N/A';
        }

        if (price_res.etc_diff > 0) {
          htmletc = '<span class="text-success">' + price_res.etc_diff.toFixed(3) + '%</span>'
        } else if (price_res.etc_diff < 0) {
          htmletc = '<span class="text-danger">' + price_res.etc_diff.toFixed(3) + '%</span>'
        } else {
          htmletc = 'N/A';
        }
        res.render('detailpage', {
          coin_icon: data.icon ? data.icon : '',
          coin_name: data.name,

          // // price: price_res.price ? price_res.price.toFixed(2) : 'N/A',
          // unit: fiatCurrency,
          // diff_string: html_diff,
          // diff_percent: price_res.diff.toFixed(2),

          price_btc: price_res.btc_rate.toFixed(8),
          diff_btc_percent: htmlbtc,
          price_etc: price_res.etc_rate ? price_res.etc_rate.toFixed(8) : 'N/A',
          diff_etc_percent: htmletc,

          coin_base_name: data.base_name,
          coin_circul_supply: convertString(data.circul_supply),
          coin_total_supply: convertString(data.total_supply),
          coin_rank: data.rank,

          market_cap_usd: convertString(data['market_cap_usd']),

          '24h_volume_usd': convertString(data['24h_volume_usd']),
          percent_change_1h: data.percent_change_1h,
          percent_change_24h: data.percent_change_24h,
          percent_change_7d: data.percent_change_7d,
        });
      });

  }

}


let convertString = function(val) {
  return val ? ((val - 0).toFixed(2) - 0).toLocaleString() : 0;
}
