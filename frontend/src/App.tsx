import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Templates from "./pages/Templates";
import Design from "./pages/Design";
import Upload from "./pages/Upload";
import Proof from "./pages/Proof";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <>
      <nav>
        <Link to="/">Proof & Approve</Link> |{" "}
        <Link to="/templates">Templates</Link> |{" "}
        <Link to="/upload">Upload</Link> | <Link to="/admin">Admin</Link>
      </nav>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/design/:id" element={<Design />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/proof" element={<Proof />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </>
  );
}
