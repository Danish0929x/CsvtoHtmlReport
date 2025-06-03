import React, { useState } from "react";
import axios from "axios";

function AIReportForm() {
  const [formData, setFormData] = useState({
    os: "",
    sheet: "",
    ticketId: "",
    module: "",
    summary: "",
    ac: "",
    desc: "",
  });

  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponse(null);
    setError(null);

    try {
      const res = await axios.post(
        "https://natasha1.app.n8n.cloud/webhook-test/324ee735-2fbb-42c6-abc1-7605fba371a2",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setResponse(res.data);
    } catch (err) {
      setError(err.message || "Error occurred");
    }
  };

  return (
    <div className="container" style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h2>AI Based Report Submission</h2>
      <form onSubmit={handleSubmit}>
        <label>
          OS (Spreadsheet URL):
          <input
            type="text"
            name="os"
            value={formData.os}
            onChange={handleChange}
            placeholder="Enter Spreadsheet URL"
            required
            style={{ width: "100%", marginBottom: 10 }}
          />
        </label>

        <label>
          Sheet:
          <input
            type="text"
            name="sheet"
            value={formData.sheet}
            onChange={handleChange}
            placeholder="Sheet Name"
            required
            style={{ width: "100%", marginBottom: 10 }}
          />
        </label>

        <label>
          Ticket ID:
          <input
            type="text"
            name="ticketId"
            value={formData.ticketId}
            onChange={handleChange}
            placeholder="Ticket ID"
            required
            style={{ width: "100%", marginBottom: 10 }}
          />
        </label>

        <label>
          Module:
          <input
            type="text"
            name="module"
            value={formData.module}
            onChange={handleChange}
            placeholder="Module Name"
            required
            style={{ width: "100%", marginBottom: 10 }}
          />
        </label>

        <label>
          Summary:
          <input
            type="text"
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            placeholder="Summary"
            required
            style={{ width: "100%", marginBottom: 10 }}
          />
        </label>

        <label>
          Acceptance Criteria (ac):
          <textarea
            name="ac"
            value={formData.ac}
            onChange={handleChange}
            placeholder="Acceptance Criteria"
            rows={4}
            required
            style={{ width: "100%", marginBottom: 10 }}
          />
        </label>

        <label>
          Description (desc):
          <textarea
            name="desc"
            value={formData.desc}
            onChange={handleChange}
            placeholder="Description"
            rows={5}
            required
            style={{ width: "100%", marginBottom: 20 }}
          />
        </label>

        <button type="submit" style={{ padding: "10px 20px", cursor: "pointer" }}>
          Submit
        </button>
      </form>

      {response && (
        <div style={{ marginTop: 20, color: "green" }}>
          <h4>Response:</h4>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 20, color: "red" }}>
          <h4>Error:</h4>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default AIReportForm;
