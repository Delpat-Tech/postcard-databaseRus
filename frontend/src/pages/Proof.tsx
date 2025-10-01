import { useNavigate } from "react-router-dom";

export default function Proof() {
  const navigate = useNavigate();
  return (
    <div>
      <h2>Digital Proof</h2>
      <div className="card">
        <img
          src="https://via.placeholder.com/600x400?text=Front+Preview"
          alt="Front Proof"
        />
      </div>
      <div className="card">
        <img
          src="https://via.placeholder.com/600x400?text=Back+Preview"
          alt="Back Proof"
        />
      </div>
      <button onClick={() => navigate("/checkout")}>Approve & Checkout</button>
    </div>
  );
}


