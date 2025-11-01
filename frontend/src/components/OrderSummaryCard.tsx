import { useOrderStore } from "../store/orderStore";
import type { Address } from "../store/types";
import { useEffect } from "react";
import { usePublicStore } from "../store/publicStore";


// (server pricing is used when available; fallback to the local `pricingTable` defined above)

export default function OrderSummaryCard() {
  const { currentOrder } = useOrderStore();
  const serverPricing = usePublicStore((s) => s.prices);
  const recipientCount = currentOrder.recipients?.length || 0;

  const size = currentOrder.designSize;
  const mailClass: "FirstClass" | "Standard" = (currentOrder.mailClass || "FirstClass") as any;
  const sizeKey = currentOrder.designSize || "";
  console.log(currentOrder);

  // Ensure prices are loaded into publicStore when an order type is selected
  const fetchPricesByType = usePublicStore.getState().fetchPricesByType;
  useEffect(() => {
    if (!currentOrder.productType) return;
    const type = (currentOrder.productType || "postcard");
    if (!serverPricing || serverPricing.length === 0) {
      fetchPricesByType(type).catch(() => {
        /* ignore errors */
      });
    }
  }, [currentOrder.productType]);

  // use server pricing if available
  function computePrice(size: string, mailClass: "FirstClass" | "Standard", quantity: number) {
    const rules = serverPricing || [];
    const rule = rules.find(r => r.sizeKey === size && r.mailClass === mailClass);
    if (!rule) return 0;
    if (quantity === 1) return rule.one;
    if (quantity >= 2 && quantity <= 99) return rule.twoTo99;
    return rule.hundredUp;
  }

  const pricePerPieceComputed = computePrice(sizeKey, mailClass, recipientCount);
  const totalComputed = Number((pricePerPieceComputed * recipientCount).toFixed(2));

  const returnAddress: Address = currentOrder.returnAddress || {
    firstName: "",
    lastName: "",
    company: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
  };
  const userDetails = currentOrder.userDet || {};

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

      <div className="space-y-3 text-sm text-gray-700">
        <div>
          <span className="font-medium">Design Type:</span>
          <span className="ml-2 capitalize">{currentOrder.designType || "Not selected"}</span>
        </div>

        {currentOrder.designName && (
          <div>
            <span className="font-medium">Design:</span>
            <span className="ml-2">{currentOrder.designName}</span>
          </div>
        )}

        <div>
          <span className="font-medium">Mail Class:</span>
          <span className="ml-2">{mailClass}</span>
        </div>

        <div>
          <span className="font-medium">Size:</span>
          <span className="ml-2">
            {serverPricing.find(p => p.sizeKey === size)?.sizeLabel}
          </span>
        </div>

        <div>
          <span className="font-medium">Recipients:</span>
          <span className="ml-2">{recipientCount}</span>
        </div>

        <div>
          <span className="font-medium">Price per Piece:</span>
          <span className="ml-2">${pricePerPieceComputed.toFixed(2)}</span>
        </div>

        <div>
          <span className="font-medium">Total Order:</span>
          <span className="ml-2 font-bold">${totalComputed}</span>
        </div>
      </div>

      {/* ===== User Details ===== */}
      {(userDetails.email || userDetails.phone) && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h4 className="text-md font-semibold mb-2">Your Details</h4>
          <div className="text-sm text-gray-700 space-y-1">
            {userDetails.email && <div><strong>Email:</strong> {userDetails.email}</div>}
            {userDetails.phone && <div><strong>Phone:</strong> {userDetails.phone}</div>}
          </div>
        </div>
      )}

      {/* ===== Return Address ===== */}
      {returnAddress.firstName && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h4 className="text-md font-semibold mb-2">Return Address</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <div>
              {returnAddress.firstName} {returnAddress.lastName}
              {returnAddress.company && `, ${returnAddress.company}`}
            </div>
            <div>{returnAddress.address1}</div>
            {returnAddress.address2 && <div>{returnAddress.address2}</div>}
            <div>
              {returnAddress.city}, {returnAddress.state} {returnAddress.zipCode}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
