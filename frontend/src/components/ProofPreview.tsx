import { useState } from "react";
import { Button } from "./FormComponents";

export default function ProofPreview() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleGenerateProof = async () => {
    setIsLoading(true);
    setHasError(false);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Randomly simulate success/failure for demo
      setHasError(Math.random() > 0.7);
    }, 2000);
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
        <div className="text-red-600 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-red-800 mb-2">
          We were unable to generate your proof.
        </h3>
        <p className="text-red-600 mb-4">
          There was an issue processing your order. Please try again or contact
          support if the problem persists.
        </p>
        <Button onClick={handleGenerateProof} className="mr-4">
          Click here to try again
        </Button>
        <p className="text-sm text-red-500 mt-2">
          Need help? Contact our support team at support@proofapprove.com
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Order Proof Preview</h3>
      <div className="bg-gray-100 rounded-lg p-8 text-center mb-4">
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
          <p className="text-gray-500">Proof preview will appear here</p>
          <p className="text-sm text-gray-400 mt-2">
            This is a mock preview for demonstration
          </p>
        </div>
      </div>
      <Button onClick={handleGenerateProof} variant="secondary">
        Regenerate Proof
      </Button>
    </div>
  );
}
