function cryptoMarketData() {
    let files = [], currentFilter = '';

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
            url: currentFilter ? '/newcsv?filter=' + currentFilter : '/newcsv',
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
            dropdown.append('<li><a href="#" class="cur-filter">' + element + '</a></li>');
        });

        $('.cur-filter').on('click', (e) => {
            let filter = e.target.innerText;
            currentFilter = filter === 'All' ? '' : filter;
            $('#filter-btn').text(filter).append('<span class="caret"></span>');

            fetchSpreadSheet();
        });

        function __getCurrencyList(tableData) {
            let currenciesArr = [], uniqueNames = [];
            tableData.data.forEach(element => {
                currenciesArr.push(element[1]);
            });
            currenciesArr[0] = 'All';
            $.each(currenciesArr, function (i, el) {
                if ($.inArray(el, uniqueNames) === -1) uniqueNames.push(el);
            });
            return uniqueNames;
        }
    }

    function download() {
        window.open('/download/' + files[files.length - 1].fileName);
    }

    fetchSpreadSheet();

    return {
        fetchSpreadSheet: fetchSpreadSheet,
        download: download
    }
}

const app = cryptoMarketData();

$('#refresh').on('click', () => {
    app.fetchSpreadSheet();
});

$('#download').on('click', () => {
    app.download();
});