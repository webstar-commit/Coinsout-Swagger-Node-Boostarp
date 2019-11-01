
$(document).ready(function() {
  getTableData(function(data) {
    $('#market').DataTable({
      "paginate": true,
      "processing": true,
      data: data,
      columns: [
          { title: "#" },
          { title: "Source" },
          { title: "Pair" },
          { title: "Volume (24h)" },
          { title: "Price" },
          { title: "Volume %" },
          { title: "Difference" }
      ]
    });
  });

  const coin_base = $('#coin_base_name').text();
  const coin_quote = $('#coin_unit').text();
  $('.price #unit').text('\xa0' + coin_quote);

  $('#chartview').on('wheel', function() {
    return false;
  });
  // getChatData(function(data) {
  //   drawChart(data);
  // });
  const symbol = coin_base + '%2F' + coin_quote;
  const url = 'http://coinscout.eu:3000/?symbol=' + symbol + '&time=15m';
  $('#chartview').attr('src', url);

  $('#chart_period li').click(function() {
    const time = $(this).attr('time');
    // const url = 'http://coinscout.eu/?symbol=' + symbol + '&time=' + time;
    const url = 'http://coinscout.eu:3000/?symbol=' + symbol + '&time=' + time;
    $('#chartview').attr('src', url);

    $('#chart_period li').removeClass('active');
    $(this).addClass('active');
  })


  let g_symbol;
  var socket = io.connect('http://coinscout.eu:5001');
  // var socket = io.connect('http://localhost:4000');
  socket.on('connect', function(data) {
    g_symbol = coin_base + '/' + coin_quote;
    socket.emit('detailpage', g_symbol);
  });
  socket.on('detailpage_result', function(data) {
    if (g_symbol == data.symbol) {
      $('.price #coin_price').fadeOut(300).fadeIn(100);
      $('.price #coin_price').text(data.price.toFixed(2));
      if (data.change) {
        const diff_val = '$' + (data.price * data.change).toFixed(2);
        let html_diff;
        if (data.change > 0) {
          html_diff = '<div class="text-bold text-success">' + diff_val + ' (' + (data.change * 100).toFixed(2) + '%)' + '<em class="fa fa-fw fa-caret-up"></em></div>';
        } else if (data.change < 0) {
          html_diff = '<div class="text-bold text-danger">' + diff_val + ' (' + (data.change * 100).toFixed(2) + '%)' + '<em class="fa fa-fw fa-caret-down"></em></div>';
        } else {
          html_diff = '<div class="text-bold text-danger">' + diff_val + ' (0.00%)' + '</div>';
        }
        $('#price_diff').empty();
        $('#price_diff').append(html_diff);
      }
    }
  });
})

// function drawChart(data) {

// nv.addGraph(function() {
//     var chart = nv.models.candlestickBarChart()
//         .x(function(d) { return d['ms'] })
//         .y(function(d) { return d['close'] })
//         .duration(250)
//         .margin({left: 75, bottom: 50});

//     // chart sub-models (ie. xAxis, yAxis, etc) when accessed directly, return themselves, not the parent chart, so need to chain separately
//     chart.xAxis
//             .axisLabel("")
//             .tickFormat(function(ms) {
//               const time = ms;
//                 // I didn't feel like changing all the above date values
//                 // so I hack it to make each value fall on a different date
//                 // return d3.time.format('%x')(new Date(new Date() - (20000 * 86400000) + (d * 86400000)));
//               return d3.time.format('%X')(new Date(time));
//             });

//     chart.yAxis
//             .axisLabel('Price(USD)')
//             .tickFormat(function(d, i) {
//               return '$' + d3.format(',.1f')(d);
//             });



//     d3.select("#chart svg")
//             .datum(data)
//             .transition().duration(100)
//             .call(chart);

//     nv.utils.windowResize(chart.update);
//     return chart;
//   });
// }

// function getChatData(callback) {
//   let id = 0;
//   const coin_base = $('#coin_base_name').text();
//   const coin_unit = $('#coin_unit').text();
//   const symbol = coin_base + '%2F' + coin_unit;
//   const url = 'http://coinscout.eu/api/DataPoint15Ms/getdata?symbol=' + symbol + '&time=1';
//   // const url = 'http://localhost:8080/api/DataPointDays/getdata?symbol=' + symbol + '&time=1';
//   $.get(url, function(data) {
//     var ohlcv = [];
//     for (let i = 0; i < data.res.length; i++) {
//       const dat = data.res[i];
//       // const open = average([dat.open_sell, dat.open_buy]);
//       // const high = dat.high_sell > dat.high_buy ? dat.high_sell : dat.high_buy;
//       // const low = dat.low_sell < dat.low_buy ? dat.low_sell : dat.low_buy;
//       // const close = average([dat.close_sell, dat.close_buy]);
//       // if (open && high && low && close) {
//         ohlcv.push({
//           "ms": new Date(dat.timestamp).getTime(),
//           // "open": open,
//           // "high": high,
//           // "low": low,
//           // "close": close,
//           "open": dat.open,
//           "high": dat.high,
//           "low": dat.low,
//           "close": dat.close,
//           "volume": average([dat.volume_buy, dat.volume_sell]),
//           "adjusted": average([dat.price_buy, dat.price_sell])
//         });
//       // }
//     }
//     var result = [{values: ohlcv}];
//     callback(result);
//   });
// }

// (function() {
//   $('#market').DataTable();
//   getTableData(function(data) {
//     $('#market tbody').empty();
//     $('#market tbody').append(data);
//     // datatable.reload();
//   });
// })();

// function getConvert(coin_base, symbol) {
//   const str = ticker.symbol.split('/');
//   const base = str[0], quote = str.length > 1 ? str[1] : undefined;
//   if (coin_base == base) {
//     function
//   } else {

//   }
// }

function getTableData(callback) {
  let id = 0;
  const coin_base = $('#coin_base_name').text();
  const coin_quote = $('#coin_unit').text();
  // const url = 'http://coinscout.eu/api/DataPointDays/get24info?currency=' + coin_base + '&fiat=' + coin_quote;
  const url = 'http://coinscout.eu/api/ticket24s/get24info?currency=' + coin_base + '&quote_param=' + coin_quote;

  $.get( url, function(data) {
    let tabledata = [];
    let vol_24 = 0; //$('#24Volume').val();
    for (let i = 0; i < data.res.length; i++) {
      const ticker = data.res[i];
      vol_24 += ticker.volume;
    }
    for (let i = 0; i < data.res.length; i++) {
      const ticker = data.res[i];

      // const rate = getConvert(coin_base, symbol);
      let price = ticker.price ? ticker.price.toFixed(2) + '$' : 'N/A';
      let quoteVol = ticker.volume ? ticker.volume : 0;
      const vol_percent = vol_24 ? (ticker.volume / vol_24 * 100).toFixed(2) + '%' : 'N/A';
      let change = ticker.change ? (ticker.change * 100).toFixed(3) : 0;

      const item = [
        0,
        ticker.exchange,
        ticker.symbol,
        quoteVol,
        price,
        vol_percent,
        change
      ]
      tabledata.push(item);
    }

    function compare(a,b) {
      if (a[3] < b[3])
        return 1;
      if (a[3] > b[3])
        return -1;
      return 0;
    }
    tabledata.sort(compare);
    tabledata.map((data, i) => {
      data[0] = i + 1;
      data[3] = data[3].toFixed(2);
    })

    callback(tabledata);
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
