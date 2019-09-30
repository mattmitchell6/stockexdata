/**
 * Clientside helper functions
 */

$(document).ready(function() {
  var amounts = document.getElementsByClassName("amount-usd");
  var dates = document.getElementsByClassName("date");
  var shortDates = document.getElementsByClassName("short-date");
  setNavigation();

  // iterate through all "amount-usd" elements and convert from cents to formatted USD
  for (var i = 0; i < amounts.length; i++) {
    amount = amounts[i].getAttribute('data-amount') / 100;
    amount = amount.toFixed(2);
    if(amount >= 0) {
      amounts[i].innerHTML = "$" + amount;
    } else {
      amount = amount * -1;
      amount = amount.toFixed(2);
      amounts[i].innerHTML = "-$" + amount + " (credit to be applied to upcoming bill)";
    }
  }

  // iterate through all "date" elements and convert from unix timestart to human readable
  for (var i = 0; i < dates.length; i++) {
    date = dates[i].getAttribute('data-date');
    dates[i].innerHTML = moment.unix(date).format('MMMM Do YYYY');
  }

  // iterate through all "date" elements and convert from unix timestart to human readable
  for (var i = 0; i < shortDates.length; i++) {
    date = shortDates[i].getAttribute('data-date');
    shortDates[i].innerHTML = moment.unix(date).format('MM/DD/YY');
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
