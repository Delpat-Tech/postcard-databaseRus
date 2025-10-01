import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Design() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState<string>("");
  const [text, setText] = useState<string>("");

  return (
    <div>
      <h2>Personalize Template #{id}</h2>
      <div className="card">
        <label>
          Front Title:
          <br />
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
      </div>
      <div className="card">
        <label>
          Back Text:
          <br />
          <textarea value={text} onChange={(e) => setText(e.target.value)} />
        </label>
      </div>
      <button onClick={() => navigate("/proof")}>Preview Proof</button>
    </div>
  );
}


