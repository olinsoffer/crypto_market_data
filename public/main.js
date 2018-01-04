let files = [];


function renderSpreadSheet(fileName) {
    $('#table-content').empty();
    d3.text(fileName, function (data) {

        let parsedCSV = d3.csv.parseRows(data);

        let container = d3.select("#table-content")
            .append("table")

            .selectAll("tr")
            .data(parsedCSV).enter()
            .append("tr")

            .selectAll("td")
            .data(function (d) { return d; }).enter()
            .append("td")
            .text(function (d) { return d; });
    });
}

function fetchSpreadSheet() {
    $.ajax({
        method: "GET",
        url: '/newcsv',
        success: function (data) {
            let fileName = data.fileName;
            files.push(data);
            renderSpreadSheet(fileName);
            if (files.length === 1) {
                renderDropdown();
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(textStatus, errorThrown, jqXHR);
        }
    });
}

function renderDropdown() {
    let file = files[files.length - 1];
    let currencyList = __getCurrencyList(Papa.parse(file.file));
    let dropdown = $('#drop-cur');
    currencyList.forEach(element => {
        dropdown.append('<li><a href="#">' + element + '</a></li>');
    });

    function __getCurrencyList(tableData) {
        let currenciesArr = [], uniqueNames = [];
        tableData.data.forEach(element => {
            currenciesArr.push(element[1]);
        });
        $.each(currenciesArr, function (i, el) {
            if ($.inArray(el, uniqueNames) === -1) uniqueNames.push(el);
        });
        return uniqueNames;
    }
}

fetchSpreadSheet();

$('#refresh').on('click', () => {
    fetchSpreadSheet();
});

$('#download').on('click', () => {
    window.open('/download/' + files[files.length - 1]);
});