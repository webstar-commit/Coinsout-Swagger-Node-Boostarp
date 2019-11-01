$(document).ready(function () {
	$('[data-toggle=offcanvas]').click(function () {
		$('.row-offcanvas').toggleClass('active');
		$('.content-wrapper').toggleClass('active');
	});

	$('.currency-symbol .btn').click(function () {
		$('.currency-symbol a, .currency-symbol button').removeClass('active');
		$(this).addClass('active');
	});


	$(window).scroll(function () {
		if ($(window).scrollTop() >= 200) {
			$('.price-header').addClass('price-header-fixed');
		} else {
			$('.price-header').removeClass('price-header-fixed');
		}

	});


	$('#arbitrage tr td').hover(function () {
		$(this).addClass('mouseover');
		var index = $(this).index() - 2;
		var rows = $('#arbitrage tr');
		$($("th", rows.eq(0)).eq(index)).addClass("selected");
		$($("th", rows.eq(1)).eq(index)).addClass("selected");
		$(this).parent("tr").find("th").addClass("selected");


	}, function () {
		$(this).removeClass('mouseover');
		var index = $(this).index() - 2;
		var rows = $('#arbitrage tr');
		$($("th", rows.eq(0)).eq(index)).removeClass("selected");
		$($("th", rows.eq(1)).eq(index)).removeClass("selected");
		$(this).parent("tr").find("th").removeClass("selected");
	});
	
	$('#arbitrage tr td.last-update').hover(function () {
		$(this).removeClass('mouseover');
		var index = $(this).index();
		var rows = $('#arbitrage tr');
		$($("th", rows.eq(0))).removeClass("selected");
		$('.therock').removeClass("selected");
	});


	$("body").on('mouseenter', "#market tr td", function () {
		$(this).parent("tr").find("td").addClass("border");
	}).on('mouseleave', "#market tr td", function () {
		$(this).parent("tr").find("td").removeClass("border");
	});

});