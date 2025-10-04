import { useNavigate } from "react-router-dom";
import { Button, Card } from "../components/FormComponents";
import ProofPreview from "../components/ProofPreview";

export default function Proof() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Digital Proof</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <h2 className="text-xl font-semibold mb-4">Front Preview</h2>
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400 mb-4"
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
                  <p className="text-gray-500">Front proof preview</p>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold mb-4">Back Preview</h2>
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400 mb-4"
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
                  <p className="text-gray-500">Back proof preview</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-8">
            <ProofPreview />
          </div>

          <div className="flex justify-center mt-8 space-x-4">
            <Button onClick={() => navigate("/order")} variant="secondary">
              Back to Order
            </Button>
            <Button
              onClick={() => navigate("/checkout")}
              className="text-lg px-8 py-3"
            >
              Approve & Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
