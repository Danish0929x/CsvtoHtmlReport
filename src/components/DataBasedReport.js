import React, { useState, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Bar, Pie, Line } from "react-chartjs-2";
import { FaUpload } from "react-icons/fa";
import "chart.js/auto";
import "../App.css";
import { generateReportHtml } from "./generateDataHTMLReport";

function DataBasedReport() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [chartType, setChartType] = useState("Bar");
  const [filterValue, setFilterValue] = useState("");
  const [aggregation, setAggregation] = useState("count");

  const chartContainerRef = useRef(null);
  const tableRef = useRef(null);

  const formatDate = (value) => {
    if (!value) return "Undefined";
    
    if (typeof value === 'number' && value > 10000) {
      const date = new Date((value - (25567 + 2)) * 86400 * 1000);
      return date.toLocaleDateString('en-US');
    }
    
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US');
      }
      return value;
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString('en-US');
    }
    
    return value;
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

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
          const processedData = results.data.map(row => {
            const newRow = {};
            Object.keys(row).forEach(key => {
              newRow[key] = formatDate(row[key]);
            });
            return newRow;
          });
          setHeaders(Object.keys(processedData[0]));
          setData(processedData);
          setSelectedColumn("");
          setFilterValue("");
        },
      });
    } else if (fileType === "xlsx") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const binaryStr = e.target.result;
        const workbook = XLSX.read(binaryStr, { type: "binary", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { raw: false });

        const processedData = json.map(row => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            newRow[key] = formatDate(row[key]);
          });
          return newRow;
        });

        setHeaders(Object.keys(processedData[0]));
        setData(processedData);
        setSelectedColumn("");
        setFilterValue("");
      };
      reader.readAsBinaryString(file);
    } else {
      alert("Unsupported file type. Please upload a CSV or XLSX file.");
    }
  };

  const getChartData = () => {
    if (!selectedColumn || !data.length) {
      return { labels: [], datasets: [] };
    }

    // Group data by selected column values
    const distribution = data.reduce((acc, row) => {
      const value = row[selectedColumn] ?? "Undefined";
      if (!acc[value]) {
        acc[value] = {
          count: 0,
          sum: 0,
          values: []
        };
      }
      acc[value].count++;
      
      // For numerical columns, calculate sum and collect values
      if (typeof row[selectedColumn] === 'number') {
        acc[value].sum += row[selectedColumn];
        acc[value].values.push(row[selectedColumn]);
      }
      return acc;
    }, {});

    // Sort dates chronologically if the column appears to contain dates
    const isDateColumn = headers.some(h => h.toLowerCase().includes('date')) && 
      selectedColumn.toLowerCase().includes('date');
    
    let categories = Object.keys(distribution);
    if (isDateColumn) {
      categories = categories.sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
      });
    }

    // Calculate values based on aggregation type
    const values = categories.map(category => {
      switch (aggregation) {
        case 'sum':
          return distribution[category].sum;
        case 'average':
          return distribution[category].values.length > 0 
            ? distribution[category].sum / distribution[category].values.length 
            : 0;
        case 'count':
        default:
          return distribution[category].count;
      }
    });

    const datasets = [{
      label: `${aggregation} by ${selectedColumn}`,
      data: values,
      backgroundColor: categories.map((_, index) => 
        `hsla(${(index * 360) / categories.length}, 70%, 50%, 0.5)`
      ),
      borderColor: categories.map((_, index) =>
        `hsla(${(index * 360) / categories.length}, 70%, 40%, 1)`
      ),
      borderWidth: 1,
    }];

    return {
      labels: categories,
      datasets: datasets,
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { 
      y: { 
        beginAtZero: true,
        title: {
          display: true,
          text: aggregation.charAt(0).toUpperCase() + aggregation.slice(1)
        }
      },
      x: {
        title: {
          display: true,
          text: selectedColumn
        }
      }
    },
    plugins: { 
      legend: { 
        display: chartType === 'Pie',
        position: "top" 
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
      }
    },
    onClick: (evt, elements, chart) => {
      if (!elements.length) return;
      const index = elements[0].index;
      const clickedLabel = chart.data.labels[index];
      setFilterValue(clickedLabel);
    },
  };

  const renderChart = () => {
    const chartData = getChartData();
    switch (chartType) {
      case "Pie":
        return <Pie data={chartData} options={chartOptions} />;
      case "Line":
        return <Line data={chartData} options={{...chartOptions, 
          plugins: {
            ...chartOptions.plugins,
            legend: {
              display: true
            }
          }
        }} />;
      default:
        return <Bar data={chartData} options={chartOptions} />;
    }
  };

  const getFilteredRows = () => {
    if (!filterValue) return data;
    return data.filter((row) => {
      const rowValue = row[selectedColumn] ?? "Undefined";
      return rowValue === filterValue;
    });
  };

  const handleDownloadReport = () => {
    let tableHTML = "";
    if (tableRef.current) {
      const tableElement = tableRef.current.querySelector("table");
      if (tableElement) {
        tableHTML = tableElement.outerHTML;
        tableHTML = tableHTML.replace("<table", '<table id="reportTable"');
      }
    }
    const filterColIndex =
      selectedColumn && headers.length ? headers.indexOf(selectedColumn) : -1;
    const chartData = getChartData();
    const htmlContent = generateReportHtml({
      headers,
      selectedColumn,
      filterColIndex,
      chartData,
      chartType,
      tableHTML,
      aggregation
    });
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "report.html";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <h2>Data Based Report</h2>
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
          <button onClick={handleDownloadReport} className="create-report-button">
            Download HTML Report
          </button>
        )}
      </div>
      {data.length > 0 && (
        <>
          <div className="chart-configuration">
            <div className="chart-controls">
              <div>
                <label htmlFor="column-select">Select Column: </label>
                <select
                  id="column-select"
                  value={selectedColumn}
                  onChange={(e) => {
                    setSelectedColumn(e.target.value);
                    setFilterValue("");
                  }}
                >
                  <option value="">--Select--</option>
                  {headers.map((header, idx) => (
                    <option key={idx} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="chart-type">Chart Type: </label>
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
              <div>
                <label htmlFor="aggregation">Aggregation: </label>
                <select
                  id="aggregation"
                  value={aggregation}
                  onChange={(e) => setAggregation(e.target.value)}
                >
                  <option value="count">Count</option>
                  <option value="sum">Sum</option>
                  <option value="average">Average</option>
                </select>
              </div>
            </div>
          </div>

          {selectedColumn && (
            <div className="chart-container-wrapper">
              <div className="chart-container" ref={chartContainerRef}>
                {renderChart()}
              </div>
            </div>
          )}

          {selectedColumn && (
            <div className="filter-controls">
              <div>
                <label htmlFor="filter-value">Filter by {selectedColumn}: </label>
                <select
                  id="filter-value"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                >
                  <option value="">All Values</option>
                  {Array.from(new Set(data.map(row => row[selectedColumn] ?? "Undefined")))
                    .sort()
                    .map((value, idx) => (
                      <option key={idx} value={value}>
                        {value}
                      </option>
                    ))}
                </select>
              </div>
              {filterValue && (
                <button 
                  onClick={() => setFilterValue("")}
                  className="clear-filter-button"
                >
                  Clear Filter
                </button>
              )}
            </div>
          )}

          <div className="table-container" ref={tableRef}>
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