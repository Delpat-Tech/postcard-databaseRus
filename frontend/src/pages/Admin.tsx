import { useState, useEffect } from "react";
import { useAdminStore } from "../store/adminStore";
import { useAuthStore } from "../store/authStore";
import LoginForm from "../components/admin/login";
import OrdersPanel from "../components/admin/orderspanel";
import TemplatesPanel from "../components/admin/templatespanel";
import PriceEditor from "../components/admin/PriceEditor";
import { Button } from "../components/FormComponents";

export default function Admin() {
  const { fetchOrders, fetchAllTemplates, orders, templates } = useAdminStore();
  const { token, adminLogout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"orders" | "templates" | "prices">("orders");

  useEffect(() => {
    if (token) {
      fetchOrders();
      fetchAllTemplates();
    }
  }, [token, fetchOrders, fetchAllTemplates]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {!token ? (
          <LoginForm />
        ) : (
          <>
            <div className="flex justify-between mb-4">
              <nav className="flex space-x-6">
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`pb-1 border-b-2 ${activeTab === "orders" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"
                    }`}
                >
                  Orders ({orders.length})
                </button>
                <button
                  onClick={() => setActiveTab("templates")}
                  className={`pb-1 border-b-2 ${activeTab === "templates" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"
                    }`}
                >
                  Templates ({templates.length})
                </button>
                <button
                  onClick={() => setActiveTab("prices")}
                  className={`pb-1 border-b-2 ${activeTab === "prices" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"
                    }`}
                >
                  Prices
                </button>
              </nav>
              <Button onClick={adminLogout} variant="secondary">Logout</Button>
            </div>

            {activeTab === "orders" ? (
              <OrdersPanel />
            ) : activeTab === "templates" ? (
              <TemplatesPanel />
            ) : (
              <PriceEditor />
            )}
          </>
        )}
      </div>
    </div>
  );
}
