import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Bar, Pie, Line } from "react-chartjs-2";
import { FaUpload } from "react-icons/fa"; // Import upload icon
import "chart.js/auto";
import "../App.css";

function NumberBasedReport() {
  const [data, setData] = useState([]); // State to store parsed data
  const [headers, setHeaders] = useState([]); // State to store table headers
  const [chartType, setChartType] = useState("Bar"); // State to track selected chart type
  const [file, setFile] = useState(null); // State to store the uploaded file
  const [fileName, setFileName] = useState(""); // State to store the file name

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile); // Store the file
      setFileName(selectedFile.name); // Store the file name
    }
  };

  // Handle Create Report button click
  const handleCreateReport = () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    const fileType = file.name.split(".").pop().toLowerCase(); // Get file extension

    if (fileType === "csv") {
      // Parse CSV file
      Papa.parse(file, {
        header: true, // Use the first row as keys for JSON
        dynamicTyping: true, // Convert numbers and booleans to their types
        complete: (results) => {
          if (results.errors.length > 0) {
            alert("Error parsing CSV file. Please check the file format.");
            return;
          }
          setHeaders(Object.keys(results.data[0])); // Extract headers
          setData(results.data); // Store parsed data
        },
      });
    } else if (fileType === "xlsx") {
      // Parse XLSX file
      const reader = new FileReader();
      reader.onload = (e) => {
        const binaryStr = e.target.result;
        const workbook = XLSX.read(binaryStr, { type: "binary" });
        const sheetName = workbook.SheetNames[0]; // Use the first sheet
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet); // Convert sheet to JSON
        setHeaders(Object.keys(json[0])); // Extract headers
        setData(json); // Store parsed data
      };
      reader.readAsBinaryString(file);
    } else {
      alert("Unsupported file type. Please upload a CSV or XLSX file.");
    }
  };

  // Generate chart data
  const getChartData = () => {
    if (data.length === 0) return { labels: [], datasets: [] };

    // Use the first column as labels
    const labels = data.map((item) => item[headers[0]]);
    // Use the remaining columns as separate datasets
    const datasets = headers.slice(1).map((header, index) => ({
      label: header,
      data: data.map((item) => item[header]),
      backgroundColor: `hsla(${(index * 360) / headers.length}, 70%, 50%, 0.5)`,
      borderColor: `hsla(${(index * 360) / headers.length}, 70%, 40%, 1)`,
      borderWidth: 1,
    }));

    return { labels, datasets };
  };

  // Chart options
  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
    },
  };

  // Render the selected chart
  const renderChart = () => {
    const chartData = getChartData();
    switch (chartType) {
      case "Pie":
        return <Pie data={chartData} options={chartOptions} />;
      case "Line":
        return <Line data={chartData} options={chartOptions} />;
      default:
        return <Bar data={chartData} options={chartOptions} />;
    }
  };

  // Function to generate HTML string and trigger download of HTML report
  const handleDownloadReport = () => {
    // Generate table HTML string from current headers and data
    const tableHTML = `
      <table>
        <thead>
          <tr>
            ${headers.map((header) => `<th>${header}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (row) =>
                `<tr>${headers
                  .map((header) => `<td>${row[header]}</td>`)
                  .join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;

    // Get chart data to pass into the HTML
    const chartData = getChartData();

    // Build the HTML content
    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Number Based Report</title>
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
          </style>
        </head>
        <body>
          <h2>Number Based Report</h2>
          <div class="chart-container">
            <canvas id="reportChart"></canvas>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script>
            (function() {
              const chartData = ${JSON.stringify(chartData)};
              const chartOptions = {
                scales: { y: { beginAtZero: true } },
                plugins: { legend: { display: true, position: "top" } }
              };
              const ctx = document.getElementById('reportChart').getContext('2d');
              new Chart(ctx, {
                type: "${chartType.toLowerCase()}",
                data: chartData,
                options: chartOptions
              });
            })();
          </script>
          <div class="table-container">
            ${tableHTML}
          </div>
        </body>
      </html>
    `;

    // Create a blob and trigger download
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "number_report.html";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <h2>Number Based Report</h2>

      {/* Chart type selector and chart */}
      <div className="chart-plus-selector">
        {data.length > 0 && (
          <div className="chart-selector">
            <label htmlFor="chart-type">Chart Type </label>
            <select
              id="chart-type"
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
            >
              <option value="Bar">Bar Chart</option>
              <option value="Pie">Pie Chart</option>
              <option value="Line">Line Chart</option>
            </select>
          </div>
        )}
        {data.length > 0 && (
          <div className="chart-container">{renderChart()}</div>
        )}
      </div>

      {/* Data table */}
      {data.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((header, colIndex) => (
                    <td key={colIndex}>{row[header]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Section */}
      <div className="upload-section">
        <div className="file-input-container">
          <label htmlFor="file-upload">
            <FaUpload /> Choose File
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
          />
          <span className="file-name">{fileName}</span>
        </div>
        <button className="create-report-button" onClick={handleCreateReport}>
          Create Report
        </button>
        {data.length > 0 && (
          <button
            onClick={handleDownloadReport}
            className="create-report-button"
          >
            Download HTML Report
          </button>
        )}
      </div>
    </div>
  );
}

export default NumberBasedReport;
