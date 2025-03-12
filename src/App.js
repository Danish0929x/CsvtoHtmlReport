import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import NumberBasedReport from "./components/NumberBasedReport";
import DataBasedReport from "./components/DataBasedReport";
import "./App.css";
import Navbar from "./components/Navbar";
import AIReport from "./components/AIReport";

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navbar */}
       <Navbar />

        {/* Routes */}
        <Routes>
          <Route path="/number-based-report" element={<NumberBasedReport />} />
          <Route path="/data-based-report" element={<DataBasedReport />} />
          <Route path="/ai-report" element={<AIReport />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;