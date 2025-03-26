// generateReportHtml.js
export function generateReportHtml({
    headers,
    selectedColumn,
    filterColIndex,
    chartData,
    chartType,
    tableHTML,
  }) {
    const interactiveChartSection = selectedColumn
      ? `
        <div class="chart-container">
          <canvas id="reportChart"></canvas>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>
          (function() {
            const chartData = ${JSON.stringify(chartData)};
            const chartOptions = {
              scales: { y: { beginAtZero: true } },
              plugins: { legend: { display: true, position: "top" } },
              onClick: function(evt, elements) {
                if (elements.length > 0) {
                  var datasetIndex = elements[0].datasetIndex;
                  var category = this.data.datasets[datasetIndex].label;
                  var filterInput = document.getElementById('filterInput');
                  if (filterInput) {
                    filterInput.value = category;
                    filterTable();
                  }
                }
              }
            };
            const ctx = document.getElementById('reportChart').getContext('2d');
            new Chart(ctx, {
              type: "${chartType.toLowerCase()}",
              data: chartData,
              options: chartOptions
            });
          })();
        </script>
      `
      : "<p>No chart available</p>";
  
    return `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Data Report</title>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Poppins', sans-serif;
              text-align: center;
              margin: 20px;
            }
            .chart-container {
              width: 80%;
              margin: 20px auto;
              max-height: 800vh;
              display: flex;
              justify-content: center;
            }
            .table-container {
              max-width: 1300px;
              margin: 20px auto;
              overflow-x: auto;
            }
            table {
              width: 80%;
              margin: 20px auto;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #5D5D81;
              padding: 10px;
              text-align: left;
            }
            th {
              background-color: #5D5D81;
              color: white;
              font-weight: 500;
            }
            tr:nth-child(even) {
              background-color: #F4F4F9;
            }
            tr:hover {
              background-color: #E0E0E7;
            }
            input {
              margin-bottom: 10px;
              padding: 5px;
              border: 2px solid #5D5D81;
              border-radius: 5px;
            }
            button {
              margin-left: 10px;
              padding: 10px 20px;
              background-color: #5D5D81;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              transition: all 0.3s ease;
            }
            button:hover {
              background-color: #7A7A9E;
            }
          </style>
        </head>
        <body>
          <h2>Data Report</h2>
          ${interactiveChartSection}
          ${
            selectedColumn
              ? `<div>
                   <label for="filterInput">Filter by ${selectedColumn}:</label>
                   <input type="text" id="filterInput" onkeyup="filterTable()" placeholder="Enter filter value..." />
                   <button id="clearFilterButton" onclick="clearFilter()">Clear All Filter</button>
                 </div>`
              : ""
          }
          <div class="table-container">
            ${tableHTML}
          </div>
          <script>
            function filterTable() {
              var input = document.getElementById("filterInput");
              var filter = input.value.toUpperCase();
              var table = document.getElementById("reportTable");
              var tr = table.getElementsByTagName("tr");
              var filterColIndex = ${filterColIndex};
              for (var i = 1; i < tr.length; i++) {
                var td = tr[i].getElementsByTagName("td")[filterColIndex];
                if (td) {
                  var txtValue = td.textContent || td.innerText;
                  tr[i].style.display = txtValue.toUpperCase().indexOf(filter) > -1 ? "" : "none";
                }
              }
            }
            function clearFilter() {
              var filterInput = document.getElementById("filterInput");
              filterInput.value = "";
              filterTable();
            }
          </script>
        </body>
      </html>
    `;
  }
  