import { useOrderStore } from "../store/orderStore";

export default function OrderSummaryCard() {
  const { currentOrder } = useOrderStore();

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

      <div className="space-y-3">
        <div>
          <span className="font-medium">Design Type:</span>
          <span className="ml-2 capitalize">
            {currentOrder.designType || "Not selected"}
          </span>
        </div>

        {currentOrder.designName && (
          <div>
            <span className="font-medium">Design:</span>
            <span className="ml-2">{currentOrder.designName}</span>
          </div>
        )}

        <div>
          <span className="font-medium">Mail Class:</span>
          <span className="ml-2">
            {currentOrder.mailClass || "First Class"}
          </span>
        </div>

        <div>
          <span className="font-medium">Brochure Fold:</span>
          <span className="ml-2">
            {currentOrder.brochureFold || "Not selected"}
          </span>
        </div>

        <div>
          <span className="font-medium">Recipients:</span>
          <span className="ml-2">{currentOrder.recipients?.length || 0}</span>
        </div>

        <div>
          <span className="font-medium">Mail Date:</span>
          <span className="ml-2">{currentOrder.mailDate || "Not set"}</span>
        </div>
      </div>
    </div>
  );
}
