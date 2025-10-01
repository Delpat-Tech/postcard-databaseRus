import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [csv, setCsv] = useState<File | null>(null);
  const navigate = useNavigate();

  return (
    <div>
      <h2>Upload Your Design</h2>
      <div className="card">
        <label>
          PDF File:
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
      </div>
      <div className="card">
        <label>
          Mailing List (CSV):
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setCsv(e.target.files?.[0] || null)}
          />
        </label>
      </div>
      <button disabled={!file} onClick={() => navigate("/proof")}>
        Preview Proof
      </button>
    </div>
  );
}


