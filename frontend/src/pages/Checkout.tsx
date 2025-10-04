import { useNavigate } from "react-router-dom";
import { Button, Card } from "../components/FormComponents";
import { useOrderStore } from "../store/orderStore";

export default function Checkout() {
  const navigate = useNavigate();
  const { currentOrder } = useOrderStore();

  const handlePayPalPayment = () => {
    // Mock PayPal payment processing
    alert(
      "PayPal payment processed successfully! Order submitted to admin for approval."
    );
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Checkout</h1>

          <Card className="mb-8">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Design Type:</span>
                <span className="font-medium capitalize">
                  {currentOrder.designType || "Not selected"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Mail Class:</span>
                <span className="font-medium">
                  {currentOrder.mailClass || "First Class"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Brochure Fold:</span>
                <span className="font-medium">
                  {currentOrder.brochureFold || "Not selected"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Recipients:</span>
                <span className="font-medium">
                  {currentOrder.recipients?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Mail Date:</span>
                <span className="font-medium">
                  {currentOrder.mailDate || "Not set"}
                </span>
              </div>
              <hr className="my-4" />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span className="text-green-600">$0.00</span>
              </div>
              <p className="text-sm text-gray-500">
                Final cost will be calculated after admin approval
              </p>
            </div>
          </Card>

          <Card className="mb-8">
            <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
            <div className="text-center">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.543-.268c-.607-.234-1.09-.4-1.47-.5a5.92 5.92 0 0 0-1.17-.17l.302-1.92c.1-.6.1-1.1.1-1.5 0-.4-.1-.8-.2-1.1-.1-.3-.3-.5-.5-.6-.2-.1-.5-.2-.8-.2-.3 0-.6.1-.8.2-.2.1-.4.3-.5.6-.1.3-.2.7-.2 1.1 0 .4 0 .9.1 1.5l.3 1.92c-.4.1-.8.2-1.2.3-.4.1-.7.2-1 .3-.3.1-.6.2-.8.3-.2.1-.4.2-.5.3-.1.1-.2.2-.3.3-.1.1-.2.2-.2.3-.1.1-.1.2-.1.3 0 .1 0 .2.1.3.1.1.1.2.2.3.1.1.2.2.3.3.1.1.3.2.5.3.2.1.5.2.8.3.3.1.6.2 1 .3.4.1.8.2 1.2.3l-.3 1.92c-.1.6-.1 1.1-.1 1.5 0 .4.1.8.2 1.1.1.3.3.5.5.6.2.1.5.2.8.2.3 0 .6-.1.8-.2.2-.1.4-.3.5-.6.1-.3.2-.7.2-1.1 0-.4 0-.9-.1-1.5l-.3-1.92c.4-.1.8-.2 1.2-.3.4-.1.7-.2 1-.3.3-.1.6-.2.8-.3.2-.1.4-.2.5-.3.1-.1.2-.2.3-.3.1-.1.2-.2.2-.3.1-.1.1-.2.1-.3 0-.1 0-.2-.1-.3-.1-.1-.1-.2-.2-.3-.1-.1-.2-.2-.3-.3-.1-.1-.3-.2-.5-.3-.2-.1-.5-.2-.8-.3-.3-.1-.6-.2-1-.3-.4-.1-.8-.2-1.2-.3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  PayPal
                </h3>
                <p className="text-blue-600">Secure payment processing</p>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                This is a mock PayPal integration for demonstration purposes. In
                a real implementation, this would connect to PayPal's API.
              </p>
            </div>
          </Card>

          <div className="flex justify-center space-x-4">
            <Button onClick={() => navigate("/order")} variant="secondary">
              Back to Order
            </Button>
            <Button
              onClick={handlePayPalPayment}
              className="text-lg px-8 py-3 bg-blue-600 hover:bg-blue-700"
            >
              Pay with PayPal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
