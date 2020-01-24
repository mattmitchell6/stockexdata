// stock search filtering
$("#stockInput").on("input", function() {
  const input = $(this).val();
  var filteredResultsContainer = document.getElementById('filteredResultsContainer')

  if(input.length >= 2) {

    fetch('/symbolfilter?input=' + input, {
      method: 'GET',
    }).then(function(result) {
      result.json().then(function(stocks) {
        if(stocks.length > 0) {
          filteredResultsContainer.style.display = "list-item";
          // update html
          var filteredResults = document.getElementById('filteredResults')
          var html = "";
          for(var i = 0; i < stocks.length; i++) {
            html += `<a class="dropdown-item" href="/search?symbol=${stocks[i].symbol}">`
            html += '<div class="row">'
            html += `<div class="bold col-md-4">${stocks[i].symbol}</div>`
            html += `<div class="col-md-8 overflow">${stocks[i].companyName}</div>`
            html += '</div></a>'
          }
          filteredResults.innerHTML = html
        } else {
          filteredResultsContainer.style.display = "none";
        }
      });
    });
  } else {
    filteredResultsContainer.style.display = "none";
  }
});
