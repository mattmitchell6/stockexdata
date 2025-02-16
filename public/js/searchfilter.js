/**
 * fetch all stocks for filtering
 */
let fuse;
const options = {
  keys: [{
    name: "symbol",
    weight: .6
  }, {
    name: "companyName",
    weight: .4
  }]
};

if(sessionStorage.getItem('companies')) {
  fuse = new Fuse(JSON.parse(sessionStorage.getItem('companies')), options)
} else {
  fetch('/fetch/allcompanies', {
    method: 'GET',
  }).then(function(result) {
    result.json().then(function(companies) {
      fuse = new Fuse(companies, options);
      sessionStorage.setItem('companies', JSON.stringify(companies))
    });
  });
}

// stock filtering
$("#stockInput").on("input", function() {
  const pattern = $(this).val();
  let filteredResultsContainer = document.getElementById('filteredResultsContainer');
  let results;

  if(pattern.length >= 2 && fuse) {
    results = fuse.search(pattern)

    if(results.length > 0) {
      filteredResultsContainer.style.display = "list-item";
      // update html
      var filteredResults = document.getElementById('filteredResults')
      var html = "";
      for(var i = 0; i < results.length && i < 7; i++) {
        html += `<a class="dropdown-item" href="/${results[i].item.symbol}">`
        html += '<div class="row">'
        html += `<div class="bold col-md-4">${results[i].item.symbol}</div>`
        html += `<div class="col-md-8 overflow">${results[i].item.companyName}</div>`
        html += '</div></a>'
      }
      filteredResults.innerHTML = html
    } else {
      filteredResultsContainer.style.display = "none";
    }

  } else {
    filteredResultsContainer.style.display = "none";
  }
});
