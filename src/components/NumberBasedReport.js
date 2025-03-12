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

    const labels = data.map((item) => item[headers[0]]); // Use the first column as labels
    const datasets = headers.slice(1).map((header, index) => ({
      label: header,
      data: data.map((item) => item[header]),
      backgroundColor: `hsla(${(index * 360) / headers.length}, 70%, 50%, 0.5)`, // Dynamic colors
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

  return (
    <div className="container">
      <h2>Number Based Report</h2>

      <div className="chart-plus-selector">
        {/* Dropdown to select chart type */}
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

        {/* Display chart if data exists */}
        {data.length > 0 && (
          <div className="chart-container">{renderChart()}</div>
        )}
      </div>

      {/* Display table if data exists */}
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

      {/* Upload section */}
      <div className="upload-section">
        {/* Left side: File input and file name */}
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

        {/* Right side: Create Report button */}
        <button className="create-report-button" onClick={handleCreateReport}>
          Create Report
        </button>
      </div>
    </div>
  );
}

export default NumberBasedReport;
