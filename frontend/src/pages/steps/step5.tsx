// ./steps/step5.jsx
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useOrderStore } from "../../store/orderStore"; // Adjust path as needed
// A simple utility to wait for a short time (optional, but good for UX)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function Step5Payment({ order, onPaymentSuccess }) {
    // You only need the function to create the PayPal order ID from the store
    const { createPaymentOrder } = useOrderStore();
    const orderId = order._id; // The ID of your internal database order

    // 1. Function called by PayPal SDK to start the transaction
    const handleCreateOrder = (data, actions) => {
        if (!orderId) {
            console.error("Internal Order ID is missing.");
            return Promise.reject("Internal Order ID missing");
        }

        // This calls your server to create the PayPal order object and returns the PayPal ID
        return createPaymentOrder(orderId)
            .then((paypalOrderId) => {
                console.log("PayPal Order created with ID:", paypalOrderId);
                return paypalOrderId; // Return PayPal ID to the SDK
            })
            .catch((error) => {
                console.error("Error creating PayPal order:", error);
                // The SDK will handle showing an error to the user
                throw error;
            });
    };

    // 2. Function called by PayPal SDK when the user successfully approves the payment
    const handleOnApprove = async (data, actions) => {
        // console.log("Payment Approved by User! PayPal Order ID:", data.orderID);


        // Since intent: "CAPTURE" is used on the server, the payment is now processing/captured.
        // The rest of the flow (marking order as paid, submitting, etc.) is handled 
        // by your back-end **webhook listener** (CHECKOUT.ORDER.COMPLETED).

        // We just confirm success to the user and navigate.
        try {
            // Optional: Add a small delay to simulate processing or wait for webhook response
            await delay(1500);

            // Trigger the success callback to move to the next step/Thank You page
            onPaymentSuccess(data.orderID);
        } catch (error) {
            console.error("Error during final client-side step:", error);
            // Handle display error to user
        }
    };

    // TEST: shortcut to bypass PayPal for local testing
    const handleTestPayment = async () => {
        try {
            // Optionally notify server to create payment order record (keeps parity with real flow)
            if (orderId && createPaymentOrder) {
                try {
                    await createPaymentOrder(orderId);
                } catch (err) {
                    // non-fatal for test - log and continue to simulate capture
                    console.warn("createPaymentOrder (test) failed:", err);
                }
            }

            // Directly invoke success callback to proceed to next step
            onPaymentSuccess();
        } catch (err) {
            console.error("Test payment failed:", err);
        }
    };

    // Note: The totalAmount should already be calculated on the 'order' object
    const totalAmount = order.totalPrice || 0.0;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Step 5: Payment</h2>

            <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                <p className="text-lg font-medium text-gray-700 mb-4">
                    Your order is approved. Please complete your payment of
                    <span className="font-bold text-green-600"> ${totalAmount.toFixed(2)} </span>
                    to finalize the order.
                </p>

                {/* 👇👇👇 PAYPAL BUTTONS INTEGRATION 👇👇👇 */}
                <div className="space-y-3">
                    <PayPalButtons
                        // Optional: Customize style
                        style={{ layout: "vertical", color: "gold", shape: "pill", label: "pay" }}

                        // 1. Function to call your server to get the PayPal Order ID
                        createOrder={handleCreateOrder}

                        // 2. Function to execute after the user approves the payment
                        onApprove={handleOnApprove}

                        // Optional: Handle when user closes the popup without approving
                        onCancel={() => console.log("Payment cancelled by user.")}

                        // Optional: Handle any error during the PayPal process
                        onError={(err) => {
                            console.error("PayPal SDK Error:", err);
                            // You might want to display a user-friendly error message here
                        }}
                    />
                </div>

                <div className="space-y-3">
                    <button
                        className="bg-yellow-400 text-black px-4 py-2 rounded"
                        onClick={handleTestPayment}
                        title="Bypass PayPal and simulate a successful payment (TEST ONLY)">
                        Simulate successful payment (TEST)
                    </button>
                    <div className="text-xs text-gray-500">Testing helper: bypasses PayPal and proceeds as if payment succeeded.</div>
                </div>
                {/* 👆👆👆 END OF PAYPAL INTEGRATION 👆👆👆 */}
                <small className="block text-center mt-3 text-gray-500">
                    You will be redirected to PayPal for secure payment.
                </small>
            </div>
        </div>
    );
}