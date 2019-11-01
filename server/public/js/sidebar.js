$(document).ready(function() {
  $('[data-toggle=offcanvas]').click(function() {
    $('.row-offcanvas').toggleClass('active');
	//$('.content-wrapper').toggleClass('active');
  });
  
  /*$('.currency-symbol .btn').click(function() {
	$('.currency-symbol a').removeClass('active');
	$(this).addClass('active');
  });*/
  
  
  $(window).scroll(function(){
    if ($(window).scrollTop() >= 100) {
       $('.search input').addClass('fixed-search');
    }
    else {
       $('.search input').removeClass('fixed-search');
    }
});
  
  
});


    $(function () {
        $(".sparkLine").shieldChart({
            theme: "light",
            exportOptions: {
                image: false,
                print: false
            },
            tooltipSettings: {
                chartBound:true,
                axisMarkers: {
                    enabled: true,
                    mode: 'x'
                },
                customHeaderText: '',
                customPointText: function (point, chart) {
                    return shield.format(
                        '<span><b>{value}</b></span>',
                        {
                            value: point.y
                        }
                    );
                },
            },
            chartAreaPaddingTop: -7,
            chartLegend: {
                enabled: false
            },
            seriesSettings: {
                line: {
                    activeSettings: {
                        pointHoveredState: {
                            enabled: false
                        }
                    },
                    pointMark: {
                        enabled: false
                    }
                }
            },
            axisX: {
                axisTickText: {
                    enabled: false
                },
                plotStripWidth: 0,
                drawWidth: 0,
                ticksWidth: 0,
                ticksHeight: 0
            },
            axisY: {
                axisTickText: {
                    enabled: false
                },
                plotStripWidth: 0,
                drawWidth: 0,
                ticksWidth: 0
            },
            dataSeries: [{
                seriesType: "line",
                data: [123, 345, 234, 321, 435, 234, 123, 654, 456, 342, 334, 223, 212, 453, 432, 342, 234, 342, 237]
            }]
        });
        
    });



