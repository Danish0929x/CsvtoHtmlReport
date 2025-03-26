import React, { useState, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { FaUpload } from "react-icons/fa";
import "../App.css";
import { generateReportHtml } from "./generateDataHTMLReport";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function IssueAnalysis() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [chartConfig, setChartConfig] = useState({
    xAxis: "Date",
    yAxis: "QA Owner",
    aggregation: "count"
  });

  const tableRef = useRef(null);

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
          setHeaders(Object.keys(results.data[0]));
          setData(results.data);
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
        const json = XLSX.utils.sheet_to_json(sheet, {
          raw: false,
          dateNF: 'mm/dd/yyyy'
        });
  
        const processedData = json.map(row => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            if (typeof row[key] === 'number' && row[key] > 10000) {
              const date = new Date((row[key] - (25567 + 2)) * 86400 * 1000);
              newRow[key] = date.toLocaleDateString('en-US');
            } else {
              newRow[key] = row[key];
            }
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

  const getFilteredRows = () => {
    if (!filterValue || !selectedColumn) return data;
    return data.filter((row) => {
      const rowValue = row[selectedColumn] ?? "Undefined";
      return rowValue === filterValue;
    });
  };

  const getChartData = () => {
    if (!data.length || !chartConfig.xAxis || !chartConfig.yAxis) {
      return { labels: [], datasets: [] };
    }

    const dimensionMap = {};
    const allValues = new Set();

    data.forEach((row) => {
      const xValue = row[chartConfig.xAxis] ?? "Undefined";
      const yValue = row[chartConfig.yAxis] ?? "Undefined";

      if (!dimensionMap[xValue]) {
        dimensionMap[xValue] = {};
      }

      if (!dimensionMap[xValue][yValue]) {
        dimensionMap[xValue][yValue] = 0;
      }

      dimensionMap[xValue][yValue]++;
      allValues.add(yValue);
    });

    const sortedDimensions = Object.keys(dimensionMap).sort();
    const valueArray = Array.from(allValues);

    return {
      labels: sortedDimensions,
      datasets: valueArray.map(value => ({
        label: value,
        data: sortedDimensions.map(dim => dimensionMap[dim][value] || 0),
        backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
      })),
    };
  };

  const handleChartConfigChange = (field, value) => {
    setChartConfig(prev => ({
      ...prev,
      [field]: value
    }));
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
    
    const chartData = getChartData();
    const htmlContent = generateReportHtml({
      headers,
      tableHTML,
      chartData,
      chartConfig
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
      <h2>Issue Analysis Report</h2>
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
            <h3>Chart Configuration</h3>
            <div className="chart-controls">
              <div>
                <label>X-Axis: </label>
                <select
                  value={chartConfig.xAxis}
                  onChange={(e) => handleChartConfigChange('xAxis', e.target.value)}
                >
                  {headers.map((header, idx) => (
                    <option key={`x-${idx}`} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Y-Axis: </label>
                <select
                  value={chartConfig.yAxis}
                  onChange={(e) => handleChartConfigChange('yAxis', e.target.value)}
                >
                  {headers.map((header, idx) => (
                    <option key={`y-${idx}`} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Aggregation: </label>
                <select
                  value={chartConfig.aggregation}
                  onChange={(e) => handleChartConfigChange('aggregation', e.target.value)}
                >
                  <option value="count">Count</option>
                  <option value="sum">Sum</option>
                  <option value="average">Average</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ margin: '20px 0' }}>
            <h3>Dynamic Analysis Chart</h3>
            <div style={{ height: '400px' }}>
              <Bar 
                data={getChartData()} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { 
                      title: { display: true, text: chartConfig.xAxis }
                    },
                    y: { 
                      beginAtZero: true,
                      title: { display: true, text: chartConfig.aggregation === 'count' ? 'Count' : chartConfig.aggregation }
                    }
                  },
                  plugins: {
                    legend: { position: 'top' },
                    tooltip: { mode: 'index', intersect: false },
                    title: {
                      display: true,
                      text: `${chartConfig.yAxis} by ${chartConfig.xAxis}`
                    }
                  }
                }} 
              />
            </div>
          </div>

          <div className="filter-controls">
            <label htmlFor="column-select">Filter by Column: </label>
            <select
              id="column-select"
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
            >
              <option value="">--Select Column--</option>
              {headers.map((header, idx) => (
                <option key={idx} value={header}>
                  {header}
                </option>
              ))}
            </select>
            {selectedColumn && (
              <>
                <label htmlFor="filter-value"> Filter Value: </label>
                <select
                  id="filter-value"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                >
                  <option value="">--All Values--</option>
                  {Array.from(new Set(data.map(row => row[selectedColumn] ?? "Undefined"))).map((value, idx) => (
                    <option key={idx} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                {filterValue && (
                  <button onClick={() => setFilterValue("")}>Clear Filter</button>
                )}
              </>
            )}
          </div>
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

export default IssueAnalysis;