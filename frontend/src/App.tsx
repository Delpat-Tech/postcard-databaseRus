import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Order from "./pages/Order";
import Admin from "./pages/Admin";
import Templates from "./pages/Templates";
import Navbar from "./components/Navbar";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const PP_CLIENT_ID =
  import.meta.env.VITE_PAYPAL_CLIENT_ID;
// Replace 'YOUR_CLIENT_ID' with your actual PayPal client ID
const initialOptions = {
  clientId: PP_CLIENT_ID,
  currency: "USD",
  intent: "capture",
};
export default function App() {
  return (
    <PayPalScriptProvider options={initialOptions}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/order" element={<Order />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </PayPalScriptProvider>
  );
}
