import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          Proof & Approve
        </Link>
        <div className="space-x-4">
          <Link to="/" className="hover:text-blue-200">
            Home
          </Link>
          <Link to="/order" className="hover:text-blue-200">
            Start Order
          </Link>
          <Link to="/admin" className="hover:text-blue-200">
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}
