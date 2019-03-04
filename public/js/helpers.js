/**
 * Clientside helper functions
 */

// iterate through all "dates" and convert from unix timestart to human readable
$(document).ready(function() {
  var dates = document.getElementsByClassName("date");

  for (var i = 0; i < dates.length; i++) {
    date = dates[i].getAttribute('data-date');
    dates[i].innerHTML = (moment.unix(date).format('MMMM Do YYYY'));
  }
})
