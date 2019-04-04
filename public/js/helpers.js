/**
 * Clientside helper functions
 */

// iterate through all "date" elements and convert from unix timestart to human readable
$(document).ready(function() {
  var dates = document.getElementsByClassName("date");

  for (var i = 0; i < dates.length; i++) {
    date = dates[i].getAttribute('data-date');
    dates[i].innerHTML = moment.unix(date).format('MMMM Do YYYY');
  }
})

// iterate through all "amount-usd" elements and convert from cents to formatted USD
$(document).ready(function() {
  var amounts = document.getElementsByClassName("amount-usd");

  for (var i = 0; i < amounts.length; i++) {
    amount = amounts[i].getAttribute('data-amount') / 100;
    amount = amount.toFixed(2);
    amounts[i].innerHTML = "$" + amount;
  }
})

$(function(){
  $('a.btn, button.btn').click(function() {
    this.innerHTML = `<span class="spinner-border spinner-border-sm" style="margin-right: 4px; margin-bottom: 2px" role="status" aria-hidden="true">
      </span>${this.innerHTML}...`;
  });
});

// make navbar items active
$(function () {
  setNavigation();
});

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
