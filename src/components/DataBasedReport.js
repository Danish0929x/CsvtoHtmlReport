import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Bar, Pie, Line } from "react-chartjs-2";
import { FaUpload } from "react-icons/fa";
import "chart.js/auto";
import "../App.css"; // Adjust or remove if you have different styling

function DataBasedReport() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [chartType, setChartType] = useState("Bar");

  // New state to store the currently clicked label (used to filter the table)
  const [filterValue, setFilterValue] = useState("");

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  // Handle Create Report button click
  const handleCreateReport = () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    const fileType = file.name.split(".").pop().toLowerCase();

    if (fileType === "csv") {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            alert("Error parsing CSV file. Please check the file format.");
            return;
          }
          // Extract headers from the first row
          setHeaders(Object.keys(results.data[0]));
          setData(results.data);
          setSelectedColumn(""); // Reset column selection
          setFilterValue(""); // Reset filter
        },
      });
    } else if (fileType === "xlsx") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const binaryStr = e.target.result;
        const workbook = XLSX.read(binaryStr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);

        setHeaders(Object.keys(json[0]));
        setData(json);
        setSelectedColumn(""); // Reset column selection
        setFilterValue(""); // Reset filter
      };
      reader.readAsBinaryString(file);
    } else {
      alert("Unsupported file type. Please upload a CSV or XLSX file.");
    }
  };

  // Get distribution of values for the selected column
  const getColumnDistribution = () => {
    if (!selectedColumn || !data.length) return {};

    return data.reduce((acc, row) => {
      const value = row[selectedColumn] ?? "Undefined";
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  };

  // Generate chart data based on selected column distribution
  // Generate chart data so each category is its own dataset
  const getChartData = () => {
    if (!selectedColumn || !data.length) {
      return { labels: [], datasets: [] };
    }

    // Get the distribution of categories
    const distribution = data.reduce((acc, row) => {
      const value = row[selectedColumn] ?? "Undefined";
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});

    const categories = Object.keys(distribution); // e.g. ["Pass", "Broken", ...]
    const counts = Object.values(distribution); // e.g. [300, 50, ...]

    // Build multiple datasets, one for each category
    const datasets = categories.map((category, index) => {
      const count = distribution[category];
      const color = `hsla(${(index * 360) / categories.length}, 70%, 50%, 0.5)`;
      const borderColor = `hsla(${
        (index * 360) / categories.length
      }, 70%, 40%, 1)`;

      return {
        label: category, // Legend label = "Pass", "Broken", etc.
        data: [count], // One data point for this category
        backgroundColor: color,
        borderColor: borderColor,
        borderWidth: 1,
      };
    });

    // Use a single label on the x-axis (so all bars appear side-by-side)
    return {
      labels: [selectedColumn], // or ["Status"], or even [""]
      datasets: datasets,
    };
  };

  // Chart options
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
    onClick: (evt, elements, chart) => {
      if (!elements.length) return;

      // We grab datasetIndex instead of index
      const { datasetIndex } = elements[0];
      const chartData = chart.data;

      // The category name (e.g. "Pass" or "Broken") is in the dataset's label
      const clickedLabel = chartData.datasets[datasetIndex].label;

      // Use that label to filter the table
      setFilterValue(clickedLabel);
    },
  };

  // Render chart based on chartType
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

  // Filter the table rows if filterValue is set
  const getFilteredRows = () => {
    if (!filterValue) return data;
    return data.filter((row) => {
      const rowValue = row[selectedColumn] ?? "Undefined";
      return rowValue === filterValue;
    });
  };

  return (
    <div className="container">
      <h2>Data Based Report</h2>

      {/* Upload and Create Report Section */}
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
      </div>

      {/* Once data is parsed, show the chart and table */}
      {data.length > 0 && (
        <>
          {/* Dropdowns for Column Selection & Chart Type */}
          <div className="chart-plus-selector">
            <div className="chart-selector">
              {/* Select Column */}
              <label htmlFor="column-select">Select Column: </label>
              <select
                id="column-select"
                value={selectedColumn}
                onChange={(e) => {
                  setSelectedColumn(e.target.value);
                  setFilterValue(""); // Reset filter whenever column changes
                }}
              >
                <option value="">--Select--</option>
                {headers.map((header, idx) => (
                  <option key={idx} value={header}>
                    {header}
                  </option>
                ))}
              </select>

              {/* Select Chart Type */}
              <label htmlFor="chart-type"> Chart Type: </label>
              <select
                id="chart-type"
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
              >
                <option value="Bar">Bar</option>
                <option value="Pie">Pie</option>
                <option value="Line">Line</option>
              </select>
            </div>

            {/* Render chart if a column is selected */}
            {selectedColumn && (
              <div className="chart-container">{renderChart()}</div>
            )}
          </div>

          {/* Display a button to clear the filter if we have a filterValue */}
          {filterValue && (
            <div style={{ marginBottom: "1rem" }} className="filter-display">
              <p>
                <strong>Filtering by:</strong> {selectedColumn} is {filterValue}
              </p>
              <button onClick={() => setFilterValue("")}>Clear Filter</button>
            </div>
          )}

          {/* Display filtered data table */}
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
                {getFilteredRows().map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {headers.map((header, colIndex) => (
                      <td key={colIndex}>{row[header]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default DataBasedReport;
