

var g_tabledata = {};
let g_symbol;

$(document).ready(function() {
  const base = 'BTC';
  const quote = 'USD';
  $('#demoSelect').val(quote);
  $('#demoSelect2').val(base);
  refreshTable(base, quote);

  // $('#demoSelect').change(function() {
  //   const base = $('#demoSelect2').val();
  //   const quote = $('#demoSelect').val();
  //   refreshTable(base, quote);
  // });
  // $('#demoSelect2').change(function() {
  //   const base = $('#demoSelect2').val();
  //   const quote = $('#demoSelect').val();
  //   refreshTable(base, quote);
  // });


  var socket = io.connect('http://coinscout.eu:5001');
  // var socket = io.connect('http://localhost:4000');
  socket.on('connect', function(data) {
    selectedSymbol(socket);
  });
  socket.on('arbitrage_result', function(data) {
    if (g_symbol == data.symbol) {
      g_tabledata[data.exchange] = data;
      refreshRTTable(g_tabledata);
    }
    // socket.emit('arbitrage', base + '/' + quote);
  });

  $('#demoSelect').change(function() {
    selectedSymbol(socket);
  });
  $('#demoSelect2').change(function() {
    selectedSymbol(socket);
  });
})

function selectedSymbol(socket) {
  const base = $('#demoSelect2').val();
  const quote = $('#demoSelect').val();
  g_symbol = base + '/' + quote;
  if (base == quote) {
    socket.emit('arbitrage', 'stop');
  } else {
    socket.emit('arbitrage', g_symbol);
  }
  g_tabledata = {};
  $('#arbitrage tbody').empty();
}

function refreshRTTable(result) {
  $('#arbitrage tbody').empty();
  const data = makeTableData2(result);
  const html = makeTableHTML(data.tabledata, data.updateAt);
  $('#arbitrage tbody').append(html);
}

function refreshTable(base, quote) {
  getTotalMarket(base, quote, function(val) {
    const str = '$' + val.toLocaleString('en-US');
    $('#total_market_cap').text(str);
  });
  $('#arbitrage tbody').empty();
  // getTableData(base, quote, function(data, timestamp) {
  //   const html = makeTableHTML(data, timestamp);
  //   $('#arbitrage tbody').append(html);
  // });
}

function makeTableData2(result) {
  let tabledata = {};
  let timestamp;
  if (result) {
    // const date = new Date(data.res.timeStamp);
    const date = new Date();
    // timestamp.setSeconds(SECONDS); // specify value for SECONDS here
    timestamp = date.toISOString().substr(11, 8);

    // const result = JSON.parse(data.res.result);
    function compare(a,b) {
      if (a.exchange_vol < b.exchange_vol)
        return 1;
      if (a.exchange_vol > b.exchange_vol)
        return -1;
      return 0;
    }
    // result.sort(compare);

    for (let key in result) {
      const item = result[key];
      tabledata[item.exchange] = {
        price: item.price,
        change: item.change
      }
    }
  }
  return {
    updateAt: timestamp,
    tabledata: tabledata,
  }
}

function makeTableData(data) {
  let tabledata = {};
  let timestamp;
  if (data) {
    // const date = new Date(data.res.timeStamp);
    const date = new Date();
    // timestamp.setSeconds(SECONDS); // specify value for SECONDS here
    timestamp = date.toISOString().substr(11, 8);

    const result = JSON.parse(data.res.result);
    function compare(a,b) {
      if (a.exchange_vol < b.exchange_vol)
        return 1;
      if (a.exchange_vol > b.exchange_vol)
        return -1;
      return 0;
    }
    // result.sort(compare);

    for (let key in result) {
      const item = result[key];
      tabledata[item.exchange] = {
        price: item.price,
        change: item.change
      }
    }
  }
  return {
    updateAt: timestamp,
    tabledata: tabledata,
  }
}

function getTotalMarket(base, quote, callback) {
  const url = 'http://coinscout.eu/api/CoinData';
  $.get( url, function(data) {
    let sum = 0;
    data.map(coin => {
      if (coin.market_cap_usd) {
        sum += (coin.market_cap_usd - 0);
      }
    })
    callback(sum);
  })
}

function makeTableHTML(data, timestamp) {
  let htmlHeader = makeHTMLHeader(data, timestamp);
  let html = '';

  html += htmlHeader;
  for (let item in data) {
    html += makeHTMLRow(item, data);
  }

  return html;
}

function makeHTMLRow(exchange, data) {
  let html = '<tr><th class="hname e2" exchange="' + exchange + '">' + exchange + '</th>';
  if (data[exchange].change > 0) {
    html += '<th class="header e2 hprice" exchange="' + exchange + '"><span class="price label label-success">' + data[exchange].price.toFixed(2) + '</span></th>';
  } else if (data[exchange].change < 0) {
    html += '<th class="header e2 hprice" exchange="' + exchange + '"><span class="price label label-danger">' + data[exchange].price.toFixed(2) + '</span></th>';
  } else {
    html += '<th class="header e2 hprice" exchange="' + exchange + '"><span class="price label label-disabled">' + data[exchange].price.toFixed(2) + '</span></th>';
  }
  for (let item in data) {
    if (item == exchange) {
      html += '<td class="arb disabled" e1="' + item + '" e2="' + exchange + '">-</td>';
    } else {
      let change;
      if (data[item].price > 0 && data[exchange].price > 0) {
        change = ((data[item].price - data[exchange].price) / data[exchange].price * 100).toFixed(2);
      } else {
        change = '-';
      }
      if (change > 0) {
        html += '<td class="arb success" e1="' + item + '" e2="' + exchange + '">' + change + '%' + '</td>';
      } else if (change < 0) {
        html += '<td class="arb danger" e1="' + item + '" e2="' + exchange + '">' + change + '%' + '</td>';
      } else {
        html += '<td class="arb disabled" e1="' + item + '" e2="' + exchange + '">0%</td>';
      }
    }
  }
  html += '</tr>'
  return html;
}

function makeHTMLHeader(data, timestamp) {
  let html = '<tr><td rowspan="2" colspan="2" class="last-update">Last update: <span class="last_update_time" style="font-weight: bold">' + timestamp + '</span></td>';
  for (let item in data) {
    html += '<th class="vname e1" exchange="' + item + '">' + item + '</th>';
  }
  html += '</tr>'

  html += '<tr>'
  for (let item in data) {
    if (data[item].change > 0) {
      html += '<th class="header e1 vprice" exchange="' + item + '"><span class="price label label-success">' + data[item].price.toFixed(2) + '</span></th>';
    } else if (data[item].change < 0) {
      html += '<th class="header e1 vprice" exchange="' + item + '"><span class="price label label-danger">' + data[item].price.toFixed(2) + '</span></th>';
    } else {
      html += '<th class="header e1 vprice" exchange="' + item + '"><span class="price label label-disabled">' + data[item].price.toFixed(2) + '</span></th>';
    }
  }
  html += '</tr>'
  return html;
}


function getTableData(base, quote, callback) {
  let id = 0;
  const coin_base = base;//$('#coin_base_name').text();
  const coin_quote = quote//$('#coin_unit').text();
  // const url = 'http://coinscout.eu/api/DataPoint15M/get24info?currency=' + coin_base + '&fiat=' + coin_quote;
  // const url = 'http://coinscout.eu/api/ticket24s/get24info?currency=' + coin_base + '&quote_param=' + coin_quote;
  const url = 'http://coinscout.eu/api/ArbitrageTables/getArbitrage?currency=' + coin_base + '&market=' + coin_quote;
  $.get( url, function(data2) {
    const data = makeTableData(data2);

    let volume = 0;
    // for (let i = 0; i < data.res.length; i++) {
    //   const ticker = data.res[i];
    //   let price = ticker.price ? ticker.price : 0;
    //   if (price > 0) {
    //     tabledata[ticker.exchange] = price;
    //   }
    // }
    callback(data.tabledata, data.updateAt);
  })
}


const fiatCurrencies = [
  'usd', 'aud', 'eur', 'cny', 'rub'
];

async function getConvertFiatCurrency(src, dst) {
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
