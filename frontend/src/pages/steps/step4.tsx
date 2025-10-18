// Step4Review.jsx

import { Checkbox, Button } from "../../components/FormComponents";
import ProofPreview from "../../components/ProofPreview";
import OrderSummaryCard from "../../components/OrderSummaryCard";

export default function Step4Review({
    approvalChecklist,
    handleChecklistChange,
    isChecklistComplete,
    handleSubmitOrder, // This now calls handleApproveOrder in the parent, moving to Step 5
    proofFront,
    proofBack,
    isProofLoading,
    proofError,
    regenerateProof,
    productType
}) {

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Step 4: Review & Approve</h2>
            <div className="space-y-2">
                {Object.keys(approvalChecklist).map((key) => (
                    <Checkbox
                        key={key}
                        name={key}
                        label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        checked={approvalChecklist[key as keyof typeof approvalChecklist]}
                        onChange={(checked) => handleChecklistChange(key, checked)}
                    />
                ))}
            </div>

            <ProofPreview
                front={proofFront || undefined}
                back={proofBack || undefined}
                isLoading={isProofLoading}
                hasError={proofError}
                onRegenerate={regenerateProof}
                productType={productType}
            />

            <OrderSummaryCard />

            {/* This button moves the user to the new Step 5 (Payment) */}
            <Button onClick={handleSubmitOrder} disabled={!isChecklistComplete} className="w-full py-3 text-lg">
                Approve & Proceed to Payment
            </Button>
        </div>
    );
}