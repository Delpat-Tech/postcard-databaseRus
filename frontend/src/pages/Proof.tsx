import { useOrderStore } from "../store/orderStore";
import { useState } from "react";

export default function ProofPreview({ templateId, recipient }: { templateId: string, recipient?: any }) {
  const { generateProofByTemplate } = useOrderStore();
  const [proofFront, setProofFront] = useState<string | null>(null);
  const [proofBack, setProofBack] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleGenerateProof = async () => {
    setIsLoading(true);
    setHasError(false);
    setProofFront(null);
    setProofBack(null);

    try {
      const data = await generateProofByTemplate(templateId, recipient, "pdf"); // or "jpg"
      setProofFront(data.front);
      setProofBack(data.back);
    } catch (error) {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleGenerateProof} disabled={isLoading}>
        {isLoading ? "Generating Proof..." : "Generate Proof"}
      </button>

      {hasError && <p className="text-red-600">Failed to generate proof.</p>}

      {proofFront && <a href={proofFront} target="_blank">View Front</a>}
      {proofBack && <a href={proofBack} target="_blank">View Back</a>}
    </div>
  );
}
