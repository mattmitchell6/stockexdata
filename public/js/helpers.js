/**
 * Clientside helper functions
 */

$(document).ready(function() {
  var dailyChange = document.getElementsByClassName("daily-change");
  var dates = document.getElementsByClassName("date");
  var marketCaps = document.getElementsByClassName("market-cap");
  var prices = document.getElementsByClassName("price");
  setNavigation();

  // iterate through daily change amounts
  for (var i = 0; i < dailyChange.length; i++) {
    changePercent = dailyChange[i].getAttribute('change-percent');
    change = dailyChange[i].getAttribute('change');

    if(changePercent > 0) {
      dailyChange[i].classList.add('green')
      dailyChange[i].innerHTML = `+${changePercent}% (+${change})`;
    } else if(changePercent == 0) {
      dailyChange[i].classList.add('neutral')
      dailyChange[i].innerHTML = changePercent + "%";
    } else {
      dailyChange[i].classList.add('red')
      dailyChange[i].innerHTML = changePercent + "%";
    }
  }

  // iterate through all "date" elements and convert from unix timestart to human readable
  for (var i = 0; i < dates.length; i++) {
    date = dates[i].getAttribute('data-date');
    dates[i].innerHTML = moment.unix(date).format('MM/DD h:mm a');
  }

  // iterate through all "price" elements and format
  for (var i = 0; i < dates.length; i++) {
    price = prices[i].getAttribute('data-price');
    prices[i].innerHTML = numeral(price).format('$0,0.00');
  }

  // iterate through all "market-cap" elements and format number
  for (var i = 0; i < dates.length; i++) {
    marketCap = marketCaps[i].getAttribute('data-market-cap');
    marketCaps[i].innerHTML = numeral(marketCap).format('0.00a').toUpperCase()
  }

  // button loading state
  $(".btn").on("click", function(){
    loadingMsg = $(this).attr("data-loading");
    $(this).addClass('disabled');
    $(this).html("<i class='fas fa-spinner fa-spin'></i> " + loadingMsg);
  });

  $('form').submit(function(){
    $("button", this).attr('disabled', 'disabled');
    return true;
  });
})

// make navbar items active
function setNavigation() {
  var path = window.location.pathname;
  path = path.replace(/\/$/, "");
  path = decodeURIComponent(path);

  $(".nav a").each(function () {
    var href = $(this).attr('href');
    if (path.substring(0, href.length) === href) {
      $(this).closest('li').addClass('active');
    }
  });
}
