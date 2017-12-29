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
        success: function (fileName) {
            files.push(fileName);
            renderSpreadSheet(files[files.length - 1]);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(textStatus, errorThrown, jqXHR);
        }
    });
}

fetchSpreadSheet();

$('#refresh').on('click', () => {
    fetchSpreadSheet();
});

$('#download').on('click', () => {
    window.open('/download/' + files[files.length - 1]);
});