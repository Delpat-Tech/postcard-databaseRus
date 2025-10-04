import React, { useState } from "react";
import { useOrderStore } from "../store/orderStore";
import { Button, Card } from "../components/FormComponents";

export default function Admin() {
  const {
    orders,
    templates,
    isLoading,
    error,
    fetchOrders,
    fetchTemplates,
    approveOrder,
    rejectOrder,
    toggleTemplateVisibility,
  } = useOrderStore();
  const [activeTab, setActiveTab] = useState<"orders" | "templates">("orders");

  // Load data on component mount
  React.useEffect(() => {
    fetchOrders();
    fetchTemplates();
  }, [fetchOrders, fetchTemplates]);

  const handleOrderAction = async (
    orderId: string,
    action: "approve" | "reject"
  ) => {
    try {
      if (action === "approve") {
        await approveOrder(orderId);
        alert("Order approved and sent to PostcardMania!");
      } else {
        await rejectOrder(orderId);
        alert("Order rejected.");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pending_admin_approval":
        return "bg-yellow-100 text-yellow-800";
      case "submitted_to_pcm":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "orders"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Orders ({orders.length})
                </button>
                <button
                  onClick={() => setActiveTab("templates")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "templates"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Templates ({templates.length})
                </button>
              </nav>
            </div>
          </div>

          {activeTab === "orders" && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Orders Management</h2>
              {orders.length === 0 ? (
                <Card className="text-center py-12">
                  <p className="text-gray-500">No orders found</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card
                      key={order.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold">
                              Order #{order._id}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {order.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p>
                                <span className="font-medium">
                                  Design Type:
                                </span>{" "}
                                {order.designType}
                              </p>
                              <p>
                                <span className="font-medium">Mail Class:</span>{" "}
                                {order.mailClass}
                              </p>
                              <p>
                                <span className="font-medium">
                                  Brochure Fold:
                                </span>{" "}
                                {order.brochureFold}
                              </p>
                            </div>
                            <div>
                              <p>
                                <span className="font-medium">Recipients:</span>{" "}
                                {order.recipients?.length || 0}
                              </p>
                              <p>
                                <span className="font-medium">Mail Date:</span>{" "}
                                {order.mailDate || "Not set"}
                              </p>
                              <p>
                                <span className="font-medium">Created:</span>{" "}
                                {order.createdAt?.toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {order.externalReference && (
                            <p className="text-sm text-gray-500 mt-2">
                              <span className="font-medium">
                                External Reference:
                              </span>{" "}
                              {order.externalReference}
                            </p>
                          )}
                        </div>

                        <div className="flex space-x-2 ml-4">
                          {order.status === "pending_admin_approval" && (
                            <>
                              <Button
                                onClick={() =>
                                  handleOrderAction(order._id, "approve")
                                }
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button
                                onClick={() =>
                                  handleOrderAction(order._id, "reject")
                                }
                                variant="danger"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "templates" && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                Template Management
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <Card
                    key={template._id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-w-16 aspect-h-9 mb-4">
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    </div>

                    <h3 className="font-semibold text-lg mb-2">
                      {template.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Size: {template.size}
                    </p>

                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          template.isPublic
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {template.isPublic ? "Public" : "Private"}
                      </span>

                      <Button
                        onClick={() => toggleTemplateVisibility(template._id)}
                        variant={template.isPublic ? "secondary" : "primary"}
                        className="text-sm"
                      >
                        {template.isPublic ? "Make Private" : "Make Public"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
