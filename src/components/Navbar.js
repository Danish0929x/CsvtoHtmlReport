import React from "react";
import { Link } from "react-router-dom";
import "./navbar.css"; // Make sure to import your CSS file

function Navbar() {
  return (
    <div className="navbar">
      <h2>Frugal Testing Reports</h2>
      <div className="nav-links">
        <Link to="/number-based-report" className="nav-button">
          Number Based Report
        </Link>
        <Link to="/data-based-report" className="nav-button">
          Data Based Report
        </Link>
        <Link to="/ai-report" className="nav-button">
          AI Report
        </Link>
      </div>
    </div>
  );
}

export default Navbar;