import { useOrderStore, type Address } from "../store/orderStore";
import { useEffect } from "react";
// Pricing definitions
type PricingRule = {
  sizeKey: string;
  sizeLabel: string;
  mailClass: "FirstClass" | "Standard";
  one: number;
  twoTo99: number;
  hundredUp: number;
};

const pricingTable: PricingRule[] = [
  { sizeKey: "46", sizeLabel: "4.25 x 6", mailClass: "FirstClass", one: 1.99, twoTo99: 0.99, hundredUp: 0.89 },
  { sizeKey: "68", sizeLabel: "6 x 8.5", mailClass: "Standard", one: 2.15, twoTo99: 1.14, hundredUp: 1.04 },
  { sizeKey: "68", sizeLabel: "6 x 8.5", mailClass: "FirstClass", one: 2.35, twoTo99: 1.24, hundredUp: 1.10 },
  { sizeKey: "611", sizeLabel: "6 x 11", mailClass: "Standard", one: 2.55, twoTo99: 1.41, hundredUp: 1.31 },
  { sizeKey: "611", sizeLabel: "6 x 11", mailClass: "FirstClass", one: 2.75, twoTo99: 1.51, hundredUp: 1.41 },
  { sizeKey: "811", sizeLabel: "8.5 x 11 Letters", mailClass: "Standard", one: 2.95, twoTo99: 1.57, hundredUp: 1.47 },
  { sizeKey: "811", sizeLabel: "8.5 x 11 Letters", mailClass: "FirstClass", one: 3.25, twoTo99: 1.77, hundredUp: 1.67 },
];

function getPrice(size: string, mailClass: "FirstClass" | "Standard", quantity: number): number {
  const rule = pricingTable.find(r => r.sizeKey === size && r.mailClass === mailClass);
  if (!rule) return 0;
  if (quantity === 1) return rule.one;
  if (quantity >= 2 && quantity <= 99) return rule.twoTo99;
  return rule.hundredUp;
}

export default function OrderSummaryCard() {
  const { currentOrder, setCurrentOrder } = useOrderStore();
  const recipientCount = currentOrder.recipients?.length || 0;

  const size = currentOrder.designSize;
  const mailClass: "FirstClass" | "Standard" = currentOrder.mailClass;
  const pricePerPiece = getPrice(size, mailClass, recipientCount);
  const total = Number((pricePerPiece * recipientCount).toFixed(2));

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
            {pricingTable.find(p => p.sizeKey === size)?.sizeLabel || size}
          </span>
        </div>

        <div>
          <span className="font-medium">Recipients:</span>
          <span className="ml-2">{recipientCount}</span>
        </div>

        <div>
          <span className="font-medium">Price per Piece:</span>
          <span className="ml-2">${pricePerPiece.toFixed(2)}</span>
        </div>

        <div>
          <span className="font-medium">Total Order:</span>
          <span className="ml-2 font-bold">${total}</span>
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
