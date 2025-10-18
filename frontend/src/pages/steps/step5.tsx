// ./steps/step5.jsx

export default function Step5Payment({ order, onPaymentSuccess }) {
    // Calculate total amount. Assuming totalCost is available on currentOrder.
    // You'll need to ensure your useOrderStore logic calculates and stores this.
    const totalAmount = order.totalPrice || 0.0;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Step 5: Payment</h2>

            <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                <p className="text-lg font-medium text-gray-700 mb-4">
                    Your order is approved. Please complete your payment of
                    <span className="font-bold text-green-600"> ${totalAmount.toFixed(2)} </span>
                    to finalize and submit the order.
                </p>

                {/* 👇👇👇 REPLACE THIS BLOCK WITH YOUR ACTUAL PAYPAL BUTTON INTEGRATION 👇👇👇 */}
                <div className="border-2 border-yellow-300 p-4 rounded-lg bg-yellow-50 shadow-inner space-y-3">
                    <p className="font-semibold text-center text-orange-700">PayPal Integration Placeholder</p>
                    <button
                        onClick={() => {
                            // In a real app, this runs *after* PayPal confirms payment success
                            console.log("Simulating successful payment...");
                            onPaymentSuccess();
                        }}
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded transition duration-150"
                    >
                        Pay Now with PayPal (${totalAmount.toFixed(2)})
                    </button>
                    <small className="block text-center text-gray-500">
                        This is a simulated payment. The real PayPal component will handle the transaction securely.
                    </small>
                </div>
                {/* 👆👆👆 END OF PAYPAL PLACEHOLDER BLOCK 👆👆👆 */}
            </div>

            {/* Note: OrderSummaryCard is also included in the main Order layout, but 
                it can be useful here if you want it next to the payment area. 
                I will remove OrderSummaryCard from the main Step5 rendering 
                since it is already on the side. */}
        </div>
    );
}