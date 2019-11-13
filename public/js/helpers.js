/**
 * Clientside helper functions
 */

$(document).ready(function() {
  var dailyChange = document.getElementsByClassName("daily-change");
  var dates = document.getElementsByClassName("date");
  var newsDates = document.getElementsByClassName("news-date");
  var earningsDates = document.getElementsByClassName("earnings-date");
  var marketCaps = document.getElementsByClassName("market-cap");
  var prices = document.getElementsByClassName("price");
  var twoDecimals = document.getElementsByClassName("two-deciamals");
  var percentages = document.getElementsByClassName("percentage");
  var yields = document.getElementsByClassName("yield");
  var employees = document.getElementsByClassName("employees");
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
      dailyChange[i].innerHTML = `${changePercent}% (${change})`;
    } else {
      dailyChange[i].classList.add('red')
      dailyChange[i].innerHTML = `${changePercent}% (${change})`;
    }
  }

  // iterate through all "date" elements and convert from unix timestart to human readable
  for (var i = 0; i < dates.length; i++) {
    date = dates[i].getAttribute('data-date');
    dates[i].innerHTML = moment.unix(date / 1000).format('MM/DD h:mm a z');
  }
  for (var i = 0; i < newsDates.length; i++) {
    date = newsDates[i].getAttribute('data-date');
    newsDates[i].innerHTML = moment.unix(date / 1000).format('MMM DD, YYYY');
  }

  for (var i = 0; i < earningsDates.length; i++) {
    date = earningsDates[i].getAttribute('data-date');
    earningsDates[i].innerHTML = moment(date).format('MMM DD, YYYY');
  }

  for (var i = 0; i < twoDecimals.length; i++) {
    number = twoDecimals[i].getAttribute('data');
    twoDecimals[i].innerHTML = numeral(number).format('0.00')
  }

  for (var i = 0; i < yields.length; i++) {
    yield = yields[i].getAttribute('data');
    yields[i].innerHTML = numeral(yield).format('0.00%')
  }

  for (var i = 0; i < percentages.length; i++) {
    percentage = percentages[i].getAttribute('data');
    percentages[i].innerHTML = numeral(percentage).format('+0.00%')

    if(percentage > 0) {
      percentages[i].classList.add('green')
    } else if(changePercent == 0) {
      percentages[i].classList.add('neutral')
    } else {
      percentages[i].classList.add('red')
    }
  }

  // iterate through all "price" elements and format
  for (var i = 0; i < prices.length; i++) {
    price = prices[i].getAttribute('data-price');
    prices[i].innerHTML = numeral(price).format('$0,0.00');
  }

  // iterate through all "market-cap" elements and format number
  for (var i = 0; i < marketCaps.length; i++) {
    marketCap = marketCaps[i].getAttribute('data-market-cap');
    marketCaps[i].innerHTML = numeral(marketCap).format('0.00a').toUpperCase()
  }

  for (var i = 0; i < employees.length; i++) {
    employee = employees[i].getAttribute('data');
    employees[i].innerHTML = numeral(employee).format('0,0')
  }

  // button loading state
  $(".btn").on("click", function(){
    loadingMsg = $(this).attr("data-loading");
    console.log(this);
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
