$(document).ready(function () {
    function cryptoMarketData() {
        let files = [], currentFilter = '', table;

        function renderSpreadSheet(file) {
            $('#dataTable').empty();
            $('#dataTable').append('<thead><tr id="table-head"> </tr></thead><tbody id="table-body"></tbody>');
            let parsedCSV = Papa.parse(file).data;
            let headers = parsedCSV.shift();

            let tableHead = $('#table-head');
            let tableFoot = $('#table-foor');
            headers.forEach(element => {
                tableHead.append('<th>' + element + '</th>');
                tableFoot.append('<th>' + element + '</th>');
            });

            // let tableBody = $('#table-body');
            // parsedCSV.forEach((data, index) => {
            //     let tr = $('<tr></tr>');
            //     data.forEach(element => {
            //         tr.append('<td>' + element + '</td>');
            //     });
            //     tableBody.append(tr)
            // });

            if (table) table.destroy();
            table = $('#dataTable').DataTable({
                data: parsedCSV
            });
        }

        function fetchSpreadSheet() {
            $.ajax({
                method: "GET",
                url: currentFilter ? '/newcsv?filter=' + currentFilter : '/newcsv',
                success: function (data) {
                    let fileName = data.fileName;
                    files.push(data);
                    renderSpreadSheet(data.file);
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
        };
    }

    const app = cryptoMarketData();

    $('#refresh').on('click', () => {
        app.fetchSpreadSheet();
    });

    $('#download').on('click', () => {
        app.download();
    });
});
