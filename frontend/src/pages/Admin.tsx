import React, { useState } from "react";
import { useAdminStore } from "../store/adminStore";
import { useAuthStore } from "../store/authStore";
import { Button, Card } from "../components/FormComponents";
import Swal from "sweetalert2";

export default function Admin() {
  const {
    token,
    orders,
    templates,
    fetchOrders,
    fetchAllTemplates,
    approveOrder,
    rejectOrder,
    toggleTemplateVisibility,
    error: storeError,
  } = useAdminStore();
  const { adminLogin, adminLogout } = useAuthStore()
  const [templateFilter, setTemplateFilter] = React.useState<"all" | "public" | "private">("all");
  const [activeTab, setActiveTab] = useState<"orders" | "templates">("orders");
  const [sortOption, setSortOption] = useState<"newest" | "oldest" | "pending" | "approved" | "rejected">("newest");
  const [sortedOrders, setSortedOrders] = useState(orders);
  React.useEffect(() => {
    // Apply sorting whenever orders or sortOption changes
    const sorted = [...orders].sort((a, b) => {
      switch (sortOption) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "pending":
          return a.status === "pending_admin_approval" ? -1 : 1;
        case "approved":
          return a.status === "approved" ? -1 : 1;
        case "rejected":
          return a.status === "rejected" ? -1 : 1;
        default:
          return 0;
      }
    });
    setSortedOrders(sorted);
  }, [orders, sortOption]);

  // Load data on component mount (only if authenticated)
  React.useEffect(() => {
    if (token) {
      fetchOrders();
      fetchAllTemplates();
    }
  }, [token, fetchOrders, fetchAllTemplates]);

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!username || !password) {
      setLocalError("Username and password are required");
      return;
    }
    try {
      await adminLogin(username, password);
      // fetchOrders/fetchTemplates will run via effect
    } catch (err) {
      // adminLogin sets store.error; show a friendly message here too
      setLocalError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleLogout = () => {
    adminLogout();
  };

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

  const formatDate = (value: any) => {
    if (!value) return "Not set";
    try {
      const d = value instanceof Date ? value : new Date(value);
      if (isNaN(d.getTime())) return "Invalid date";
      return d.toLocaleDateString();
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
          {token ? (
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "orders"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                  >
                    Orders ({orders.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("templates")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "templates"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                  >
                    Templates ({templates.length})
                  </button>
                </nav>
              </div>
            </div>
          ) : null}
          {!token ? (
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-4">Admin Login</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  className="w-full p-2 border rounded"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <input
                  className="w-full p-2 border rounded"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {(localError || storeError) && (
                  <p className="text-sm text-red-600">{localError || storeError}</p>
                )}
                <div className="flex items-center justify-between">
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                    Login
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex justify-end mb-4">
              <button onClick={handleLogout} className="px-3 py-2 border rounded">Logout</button>
            </div>
          )}

          {token ? (
            <>
              {activeTab === "orders" && (
                <div>
                  {/* Orders Header: Refresh + Sort */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold">Orders Management</h2>

                    <div className="flex items-center space-x-3">
                      {/* Sort Dropdown */}
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="px-3 py-1 border rounded text-sm"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="pending">Pending Approval</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>

                      {/* Refresh Button */}
                      <Button
                        onClick={async () => {
                          try {
                            await fetchOrders();
                            alert("Orders refreshed");
                          } catch (e) {
                            console.error(e);
                            alert("Failed to refresh orders");
                          }
                        }}
                        variant="secondary"
                        className="text-sm"
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>

                  {sortedOrders.length === 0 ? (
                    <Card className="text-center py-12">
                      <p className="text-gray-500">No orders found</p>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {sortedOrders.map((order) => (
                        <Card key={order._id} className="hover:shadow-lg transition-shadow">
                          <div className="flex flex-col md:flex-row justify-between items-start space-y-4 md:space-y-0 md:space-x-4">

                            {/* Order Info */}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold">Order #{order._id}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                  {order.status.toUpperCase()}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                  <p><span className="font-medium">Design Type:</span> {order.designType}</p>
                                  {order.designName && <p><span className="font-medium">Design:</span> {order.designName}</p>}
                                  <p><span className="font-medium">Mail Class:</span> {order.mailClass}</p>
                                  <p><span className="font-medium">Brochure Fold:</span> {order.brochureFold}</p>
                                </div>

                                <div>
                                  <p><span className="font-medium">Recipients:</span> {order.recipients?.length || 0}</p>
                                  <p><span className="font-medium">Mail Date:</span> {order.mailDate || "Not set"}</p>
                                  <p><span className="font-medium">Created:</span> {formatDate(order.createdAt)}</p>
                                </div>
                              </div>

                              {/* External Reference */}
                              {order.externalReference && (
                                <p className="text-sm text-gray-500 mt-2">
                                  <span className="font-medium">External Reference:</span> {order.externalReference}
                                </p>
                              )}

                              {/* User Details */}
                              {order.userDet && (
                                <div className="mt-2 text-sm">
                                  <p><span className="font-medium">User Phone:</span> {order.userDet.phone || "N/A"}</p>
                                  <p><span className="font-medium">User Email:</span> {order.userDet.email || "N/A"}</p>
                                </div>
                              )}

                              {/* Return Address */}
                              {order.returnAddress && (
                                <div className="mt-2 text-sm">
                                  <p className="font-medium">Return Address:</p>
                                  <p>{order.returnAddress.firstName} {order.returnAddress.lastName}</p>
                                  {order.returnAddress.company && <p>{order.returnAddress.company}</p>}
                                  <p>{order.returnAddress.address1}{order.returnAddress.address2 ? `, ${order.returnAddress.address2}` : ""}</p>
                                  <p>{order.returnAddress.city}, {order.returnAddress.state} {order.returnAddress.zipCode}</p>
                                  {order.returnAddress.phone && <p>Phone: {order.returnAddress.phone}</p>}
                                  {order.returnAddress.email && <p>Email: {order.returnAddress.email}</p>}
                                </div>
                              )}

                              {/* Recipients List */}
                              {order.recipients && order.recipients.length > 0 && (
                                <div className="mt-2 text-sm">
                                  <p className="font-medium">Recipients:</p>
                                  <ul className="list-disc ml-5">
                                    {order.recipients.map((r) => (
                                      <li key={r.id}>
                                        {r.firstName} {r.lastName} {r.company ? `(${r.company})` : ""}
                                        , {r.address1}{r.address2 ? `, ${r.address2}` : ""}, {r.city}, {r.state} {r.zipCode}
                                        {r.externalReferenceNumber ? ` - Ref: ${r.externalReferenceNumber}` : ""}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            {/* Proof Buttons */}
                            {(order.frontproof || order.backproof) && (
                              <div className="mt-2 flex space-x-2">
                                {order.frontproof && (
                                  <Button
                                    onClick={() => {
                                      Swal.fire({
                                        title: "Front Proof",
                                        imageUrl: order.frontproof,
                                        imageAlt: "Front Proof",
                                        imageWidth: 400,
                                        imageHeight: 400,
                                      });
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    View Front Proof
                                  </Button>
                                )}
                                {order.backproof && (
                                  <Button
                                    onClick={() => {
                                      Swal.fire({
                                        title: "Back Proof",
                                        imageUrl: order.backproof,
                                        imageAlt: "Back Proof",
                                        imageWidth: 400,
                                        imageHeight: 400,
                                      });
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    View Back Proof
                                  </Button>
                                )}
                              </div>
                            )}

                            {/* Admin Actions */}
                            <div className="flex flex-col space-y-2 md:ml-4">
                              {order.status === "pending_admin_approval" && (
                                <>
                                  <Button onClick={() => handleOrderAction(order._id, "approve")} className="bg-green-600 hover:bg-green-700">
                                    Approve
                                  </Button>
                                  <Button onClick={() => handleOrderAction(order._id, "reject")} variant="danger">
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
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold">Template Management</h2>
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1 bg-white rounded-md overflow-hidden">
                        <button
                          onClick={() => setTemplateFilter("all")}
                          className={`px-3 py-1 text-sm ${templateFilter === "all" ? "bg-blue-600 text-white" : "text-gray-600"}`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setTemplateFilter("public")}
                          className={`px-3 py-1 text-sm ${templateFilter === "public" ? "bg-blue-600 text-white" : "text-gray-600"}`}
                        >
                          Public
                        </button>
                        <button
                          onClick={() => setTemplateFilter("private")}
                          className={`px-3 py-1 text-sm ${templateFilter === "private" ? "bg-blue-600 text-white" : "text-gray-600"}`}
                        >
                          Private
                        </button>
                      </div>

                      <Button
                        onClick={async () => {
                          try {
                            await fetchAllTemplates();
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        variant="secondary"
                        className="text-sm"
                      >
                        Refresh
                      </Button>

                      <Button
                        onClick={async () => {
                          try {
                            await useAdminStores.getState().importDesigns();
                            // reload admin view
                            await fetchAllTemplates();
                            setTemplateFilter("all");
                            alert("Import complete");
                          } catch (e) {
                            console.error(e);
                            alert("Import failed: " + (e instanceof Error ? e.message : String(e)));
                          }
                        }}
                        className="text-sm"
                      >
                        Import Designs
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates
                      .filter((t) =>
                        templateFilter === "all"
                          ? true
                          : templateFilter === "public"
                            ? t.isPublic
                            : !t.isPublic
                      )
                      .map((template) => (
                        <Card
                          key={template._id}
                          className="hover:shadow-lg transition-shadow"
                        >
                          <div className="aspect-w-16 aspect-h-9 mb-4">
                            <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                              {template.previewUrl ? (
                                <img src={template.previewUrl} alt={template.name} className="w-full h-full object-cover rounded" />
                              ) : (
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
                              )}
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
                              className={`px-2 py-1 rounded-full text-xs font-medium ${template.isPublic
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
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <p>You must be logged in to view admin content. Please login above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
