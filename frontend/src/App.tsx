import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Order from "./pages/Order";
import Proof from "./pages/Proof";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import Templates from "./pages/Templates";
import Design from "./pages/Design";
import Upload from "./pages/Upload";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/order" element={<Order />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/design/:id" element={<Design />} />
        {/* <Route path="/proof" element={<Proof />} /> */}
        <Route path="/upload" element={<Upload />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </>
  );
}
