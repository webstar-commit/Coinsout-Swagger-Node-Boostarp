let g_tableData;
let g_market = 'USD';
$(document).ready(function() {
  getTableData(function(data) {
    g_tableData = data;
    refreshTable();
  });

  $('#btn_submit').click(function() {
    $('#listview').dataTable().fnDestroy();
    refreshTable();
  })

  $('.btn_market').click(function(e) {
    g_market = $(this).attr('market');
    $('#listview').dataTable().fnDestroy();
    refreshTable();
  })
})

function refreshTable() {
  getConvertFiatCurrency('USD', g_market, function(fiatRate) {
    if (fiatRate > 0) {
      $('#total_market_cap').text('$' + (g_tableData.totalMarketcap * fiatRate).toLocaleString());
      const market_cap = $('#filter_market_cap').val();
      const circul_supply = $('#filter_circul_supply').val();
      const price = $('#filter_price').val();
      const volume = $('#filter_volume').val();

      let table_data = [];
      for (let i = 0; i < g_tableData.coins.length; i++) {
        const data = g_tableData.coins[i];
        if (market_cap) {
          if (data.market_cap_usd - 0 > market_cap) {
            if (data.circul_supply - 0 < circul_supply) {
              if (data.price_usd - 0 > price) {
                if (data['24h_volume_usd'] - 0 > volume) {
                  const row = makeTableData(data, fiatRate);
                  table_data.push(row);
                }
              }
            }
          }
        } else {
          const row = makeTableData(data, fiatRate);
          table_data.push(row);
        }
      }
      $('#listview').DataTable({
        "paginate": true,
        "processing": true,
        data: table_data,
        columns: [
            { title: "#" },
            { title: "Name" },
            { title: "Symbol" },
            { title: "Price" },
            { title: "Market Cap" },
            { title: "Circulating Supply" },
            { title: "Volume (24h)" }
        ]
      });
    }
  });
}

function makeTableData(coindata, fiatRate) {
  // const rate = getConvert(coin_base, symbol);
  let price = coindata.price_usd ? Number(coindata.price_usd * fiatRate).toFixed(2) : 'N/A';
  let market_cap_usd = coindata.market_cap_usd ? '$' + coindata.market_cap_usd * fiatRate : 0;
  let circul_supply = coindata.circul_supply ? coindata.circul_supply : 0;
  let vol24 = coindata['24h_volume_usd'] ? coindata['24h_volume_usd'] * fiatRate : 'N/A';
  // const vol_percent = vol_24 ? (coindata.volume / vol_24 * 100).toFixed(2) + '%' : 'N/A';
  let change = coindata.change ? (coindata.change).toFixed(2) : 0;
  let strChange;
  if (coindata.change > 0) {
    strChange = '<div class="text-bold text-success">' + (price * coindata.change * 0.01 - 0).toFixed(2) + ' (' + change + '%)';
  } else if (coindata.change < 0) {
    strChange = '<div class="text-bold text-danger">' + (price * coindata.change * 0.01 - 0).toFixed(2) + ' (' + change + '%)';
  } else {
    strChange = '<div class="text-bold text-disable">' + '0.00 (0%)';
  }

  let name_div = '<div class="name" style="cursor: pointer;">\
    <a href="/detailpage?id=' + coindata.base_name + '">\
    <img src="' + coindata.icon + '" style="margin-right: 10px;">' + coindata.name + '</a></div>';
  let price_div = '<div class="price">' +
    '<h2>' + price + '<span>' + g_market + '</span></h2>' +
    '<div class="text-bold text-danger">' + strChange +
    '<em class="fa fa-fw fa-caret-down"></em></div></div>'
  return [
    coindata.rank,
    name_div,
    coindata.base_name,
    price_div,
    market_cap_usd,
    circul_supply,
    vol24
  ]
}

function getTableData(callback) {
  let id = 0;
  const coin_base = $('#coin_base_name').text();
  const coin_quote = $('#coin_unit').text();
  // const url = 'http://coinscout.eu/api/DataPointDays/get24info?currency=' + coin_base + '&fiat=' + coin_quote;
  const url = 'http://coinscout.eu/api/CoinData/getalldata';

  $.get( url, function(data) {
    let sum = 0;
    data.res.map(coin => {
      if (coin.market_cap_usd) {
        sum += (coin.market_cap_usd - 0);
      }
    })
    // let tabledata = [];
    // for (let i = 0; i < data.length; i++) {
    //   const coindata = data[i];
    // }

    // function compare(a,b) {
    //   if (a[3] < b[3])
    //     return 1;
    //   if (a[3] > b[3])
    //     return -1;
    //   return 0;
    // }
    // tabledata.sort(compare);
    // tabledata.map((data, i) => {
    //   data[0] = i + 1;
    //   data[3] = data[3].toFixed(2);
    // })

    callback({
      totalMarketcap: sum,
      coins: data.res
    });
  })
}



function getConvertFiatCurrency(src, dst, callback) {
  src = src.toLowerCase();
  dst = dst.toLowerCase();
  if (src == dst) {
    callback(1);
  } else {
    const forexUrl = 'http://coinscout.eu/api/FiatCurrencies/getfiatrate?src=' + src + '&dst=' + dst;
    $.get(forexUrl, function(body) {
      if (body) {
        callback(body.res);
      } else {
        callback(0);
      }
    });
  }
}

async function getConvertFiatCurrency2(src, dst) {
  dst = dst.toLowerCase();
  if (fiatCurrencies.indexOf(dst) < 0) {
    return 0;
  }
  if (src == dst) {
    return 1.0;
  }
  return new Promise((resolve, reject) => {
    const forexUrl = 'https://dev.kwayisi.org/apis/forex/' + src + '/' + dst;
    request(forexUrl, { json: true }, (err, res, body) => {
      if (err) {
        return reject(err);
      }
      if (body.error) {
        return resolve(0);
      }
      return resolve(body.rate);
    });
  });
}
