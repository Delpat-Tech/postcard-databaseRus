import React, { useState } from "react";
import Swal from "sweetalert2";
import { Button, Card } from "../FormComponents";
import { useAdminStore } from "../../store/adminStore";
import { useSortedOrders } from "../../utils/hooks";
import { formatDate, getStatusColor } from "../../utils/formatters";

/* -------------------------------------------------------------------------- */
/*                              OrdersPanel Main                              */
/* -------------------------------------------------------------------------- */

export default function OrdersPanel() {
  const { orders, fetchOrders, approveOrder, rejectOrder } = useAdminStore();
  const [sortOption, setSortOption] = useState<
    "newest" | "oldest" | "pending" | "approved" | "rejected"
  >("newest");

  const sortedOrders = useSortedOrders(orders, sortOption);

  const handleOrderAction = async (
    orderId: string,
    action: "approve" | "reject"
  ) => {
    try {
      if (action === "approve") {
        await approveOrder(orderId);
        alert(
          "✅ Order approved successfully! The order has been submitted to PostcardMania for processing."
        );
      } else {
        await rejectOrder(orderId);
        alert("🚫 Order rejected. The customer has been notified.");
      }
      await fetchOrders();
    } catch (e) {
      console.error(e);
      alert(
        "❌ Failed to update order. Please check your connection and try again. If the problem persists, contact support."
      );
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Orders Management</h2>

        <div className="flex items-center space-x-3">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <Button onClick={fetchOrders} variant="secondary" className="text-sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      {sortedOrders.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">No orders found.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onApprove={() => handleOrderAction(order._id, "approve")}
              onReject={() => handleOrderAction(order._id, "reject")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Order Card                                  */
/* -------------------------------------------------------------------------- */

function OrderCard({
  order,
  onApprove,
  onReject,
}: {
  order: any;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isLetter = order.productType === "letter";
  const statusColor = getStatusColor(order.status);

  return (
    <Card className="hover:shadow-lg transition-shadow p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            Order #{order._id}{" "}
            <span className="text-gray-500 text-sm">
              ({order.productType.toUpperCase()})
            </span>
          </h3>
          <p className="text-gray-500 text-sm">
            Created: {formatDate(order.createdAt)}
          </p>
        </div>

        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
        >
          {order.status.toUpperCase()}
        </span>
      </div>

      {/* Shared Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <div>
          <p>
            <strong>Mail Class:</strong> {order.mailClass}
          </p>
          <p>
            <strong>Mail Date:</strong> {order.mailDate}
          </p>
          <p>
            <strong>Recipients:</strong> {order.recipients?.length || 0}
          </p>
          {order.pcmOrderId && (
            <p>
              <strong>PCM Order ID:</strong> {order.pcmOrderId}
            </p>
          )}
        </div>
        <div>
          <p>
            <strong>User Email:</strong> {order.userDet?.email || "N/A"}
          </p>
          <p>
            <strong>User Phone:</strong> {order.userDet?.phone || "N/A"}
          </p>
          <p>
            <strong>Total Price:</strong> ${order.totalPrice?.toFixed(2) || 0}
          </p>
        </div>
      </div>

      {/* Return Address */}
      {order.returnAddress && (
        <div className="mt-3 text-sm text-gray-700">
          <p className="font-semibold mb-1">Return Address:</p>
          <p>
            {order.returnAddress.firstName} {order.returnAddress.lastName}{" "}
            {order.returnAddress.company && `(${order.returnAddress.company})`}
          </p>
          <p>
            {order.returnAddress.address1}
            {order.returnAddress.address2
              ? `, ${order.returnAddress.address2}`
              : ""}
          </p>
          <p>
            {order.returnAddress.city}, {order.returnAddress.state}{" "}
            {order.returnAddress.zipCode}
          </p>
          {order.returnAddress.phone && (
            <p>Phone: {order.returnAddress.phone}</p>
          )}
          {order.returnAddress.email && (
            <p>Email: {order.returnAddress.email}</p>
          )}
        </div>
      )}

      {/* Conditional Details */}
      {isLetter ? (
        <LetterDetails order={order} />
      ) : (
        <PostcardDetails order={order} />
      )}

      {/* Proof Section */}
      <div className="mt-4">
        <ProofPreview
          front={order.frontproof}
          back={order.backproof}
          productType={order.productType}
        />
      </div>

      {/* Admin Buttons */}
      {order.status === "pending_admin_approval" && (
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            onClick={onApprove}
            className="bg-green-600 hover:bg-green-700"
          >
            Approve
          </Button>
          <Button onClick={onReject} variant="danger">
            Reject
          </Button>
        </div>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                           Letter / Postcard Info                           */
/* -------------------------------------------------------------------------- */
function LetterDetails({ order }: { order: any }) {
  const handleOpenInNewPage = (htmlContent: string, title: string) => {
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(`
                <html>
                    <head>
                        <title>${title}</title>
                        <style>body { font-family: sans-serif; padding: 16px; }</style>
                    </head>
                    <body>${htmlContent}</body>
                </html>
            `);
      newWindow.document.close();
    }
  };

  const showCustomDesign = !order.designId && order.front;

  return (
    <div className="border-t pt-3 mt-3 text-sm text-gray-700">
      <p className="font-semibold mb-2">Letter Details:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {order.designId ? (
          <>
            <p>
              <strong>Design ID:</strong> {order.designId}
            </p>
            <p>
              <strong>Design Size:</strong> {order.designSize || "N/A"}
            </p>
          </>
        ) : null}

        <p>
          <strong>Color:</strong> {order.color ? "Yes" : "No"}
        </p>
        <p>
          <strong>Print Both Sides:</strong>{" "}
          {order.printOnBothSides ? "Yes" : "No"}
        </p>
        <p>
          <strong>Envelope Type:</strong> {order.envelopeType || "N/A"}
        </p>
        <p>
          <strong>Font:</strong> {order.font || "Default"}
        </p>
        <p>
          <strong>Font Color:</strong> {order.fontColor || "Black"}
        </p>
        {order.exceptionalAddressingType && (
          <p>
            <strong>Addressing Type:</strong> {order.exceptionalAddressingType}
          </p>
        )}
      </div>

      {showCustomDesign && (
        <div className="mt-3">
          <p className="font-semibold mb-1">Custom Letter Preview:</p>
          <div className="bg-gray-50 border rounded p-2 text-xs max-h-48 overflow-auto">
            <p
              className="text-gray-700 cursor-pointer hover:underline"
              onClick={() => handleOpenInNewPage(order.front, "Letter Content")}
            >
              {order.front.substring(0, 300)}
              {order.front.length > 300 ? "..." : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function PostcardDetails({ order }: { order: any }) {
  const handleOpenInNewPage = (htmlContent: string, title: string) => {
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(`
                <html>
                    <head>
                        <title>${title}</title>
                        <style>body { font-family: sans-serif; padding: 16px; }</style>
                    </head>
                    <body>${htmlContent}</body>
                </html>
            `);
      newWindow.document.close();
    }
  };

  const showCustomDesign = !order.designId && (order.front || order.back);

  return (
    <div className="border-t pt-3 mt-3 text-sm text-gray-700">
      <p className="font-semibold mb-2">Postcard Details:</p>

      {order.designId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <p>
            <strong>Template ID:</strong> {order.templateId || "N/A"}
          </p>
          <p>
            <strong>Design ID:</strong> {order.designId}
          </p>
          <p>
            <strong>Design Name:</strong> {order.designName || "N/A"}
          </p>
          <p>
            <strong>Design Size:</strong> {order.designSize || "N/A"}
          </p>
        </div>
      ) : null}

      {showCustomDesign && (
        <div className="mt-3">
          <p className="font-semibold mb-1">Custom Design Preview:</p>
          <div className="bg-gray-50 border rounded p-2 text-xs max-h-48 overflow-auto">
            {order.front && (
              <p
                className="text-gray-700 cursor-pointer hover:underline"
                onClick={() => handleOpenInNewPage(order.front, "Front Design")}
              >
                <strong>Front:</strong> {order.front.substring(0, 300)}
                {order.front.length > 300 ? "..." : ""}
              </p>
            )}
            {order.back && (
              <p
                className="text-gray-700 mt-2 cursor-pointer hover:underline"
                onClick={() => handleOpenInNewPage(order.back, "Back Design")}
              >
                <strong>Back:</strong> {order.back.substring(0, 300)}
                {order.back.length > 300 ? "..." : ""}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                             ProofPreview Logic                             */
/* -------------------------------------------------------------------------- */

function ProofPreview({
  front,
  back,
  isLoading = false,
  hasError = false,
  onRegenerate,
  productType,
}: {
  front?: string | null;
  back?: string | null;
  isLoading?: boolean;
  hasError?: boolean;
  onRegenerate?: () => void;
  productType: "postcard" | "letter";
}) {
  const showProofModal = (url: string, title: string) => {
    if (!url) return;
    const isPdf =
      url.toLowerCase().endsWith(".pdf") ||
      url.startsWith("data:application/pdf");

    Swal.fire({
      title: title || "Proof Preview",
      html: isPdf
        ? `<iframe src="${url}" style="width:100%;height:80vh;border:none;border-radius:8px;"></iframe>`
        : `<img src="${url}" alt="Proof" style="width:100%;border-radius:8px;" />`,
      width: "90%",
      showCloseButton: true,
      showConfirmButton: false,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Generating your proof...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-red-800 mb-2">
          Unable to generate proof.
        </h3>
        <p className="text-red-600 mb-4">
          Ensure valid design selection. Try regenerating or contact support.
        </p>
        {onRegenerate && (
          <Button onClick={onRegenerate} className="mr-4">
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Proof Preview</h3>
      <div className="bg-gray-100 rounded-lg p-6 text-center mb-4">
        {front || back ? (
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            {front && (
              <Button
                onClick={() =>
                  showProofModal(
                    front,
                    productType === "letter" ? "Letter Proof" : "Front Proof"
                  )
                }
                className="w-full md:w-1/2"
              >
                {productType === "letter"
                  ? "View Letter Proof"
                  : "View Front Proof"}
              </Button>
            )}
            {back && (
              <Button
                onClick={() => showProofModal(back, "Back Proof")}
                className="w-full md:w-1/2"
              >
                View Back Proof
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8">
            <p className="text-gray-500">Proof preview will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
