import { useState, useEffect, useCallback } from "react";
import { useOrderStore, type Order } from "../store/orderStore";
import Stepper from "../components/Stepper";
import OrderSummaryCard from "../components/OrderSummaryCard";
import Step1Upload from "./steps/step1";
import Step2Config from "./steps/step2";
import Step3Recipients from "./steps/step3";
import Step4Review from "./steps/step4";
import { Button, Card } from "../components/FormComponents";

// Pricing definitions
const pricingTable = [
  { sizeKey: "46", sizeLabel: "4.25 x 6", mailClass: "FirstClass" },
  { sizeKey: "68", sizeLabel: "6 x 8.5", mailClass: "Standard" },
  { sizeKey: "611", sizeLabel: "6 x 11", mailClass: "Standard" },
  { sizeKey: "811", sizeLabel: "8.5 x 11 Letters", mailClass: "Standard" },
  { sizeKey: "BRO", sizeLabel: "8.5 x 11 Yellow Letters", mailClass: "Standard" },
];

export default function Order() {
  const {
    currentOrder,
    setCurrentOrder,
    addRecipient,
    clearCurrentOrder,
    createOrder,
    submitOrder,
    generateProofByTemplate,
  } = useOrderStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [approvalChecklist, setApprovalChecklist] = useState({
    imagesDisplayed: false,
    noSpellingErrors: false,
    designVariablesCorrect: false,
    addressBlockMapped: false,
    noReturnAddress: false,
    quantityCorrect: false,
  });

  const [proofFront, setProofFront] = useState<string | null>(null);
  const [proofBack, setProofBack] = useState<string | null>(null);
  const [isProofLoading, setIsProofLoading] = useState(false);
  const [proofError, setProofError] = useState(false);

  const stepNames = ["Select Design", "Configure Order", "Add Recipients", "Review & Submit"];

  const sizeOptions = [...new Set(pricingTable.map((p) => p.sizeLabel))].map((s) => ({
    label: s,
    value: pricingTable.find((p) => p.sizeLabel === s)?.sizeKey || "46",
  }));

  const mailClassOptions = [
    { label: "First Class", value: "FirstClass" },
    { label: "Standard", value: "Standard" },
  ];

  const handleChecklistChange = (item: string, checked: boolean) =>
    setApprovalChecklist((prev) => ({ ...prev, [item]: checked }));

  const handleSubmitOrder = async () => {
    try {
      const orderData: Partial<Order> = {
        ...currentOrder,
        mailClass: currentOrder.mailClass || "FirstClass",
      };
      const order = await createOrder(orderData);
      await submitOrder(order._id);
      clearCurrentOrder();
      setCurrentStep(1);
      setApprovalChecklist({
        imagesDisplayed: false,
        noSpellingErrors: false,
        designVariablesCorrect: false,
        addressBlockMapped: false,
        noReturnAddress: false,
        quantityCorrect: false,
      });
      alert("Order submitted successfully!");
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to submit order.");
    }
  };

  const isChecklistComplete = Object.values(approvalChecklist).every(Boolean);

  const handleGenerateProof = useCallback(async () => {
    if (proofFront && proofBack) return;

    if (!currentOrder.recipients?.length) return;

    setIsProofLoading(true);
    setProofError(false);

    try {
      const { front, back } = await generateProofByTemplate(
        currentOrder.designSize,
        currentOrder.recipients[0],
        "jpg",
        currentOrder.templateId,
        currentOrder.front,
        currentOrder.back
      );

      setProofFront(front);
      setProofBack(back);
    } catch (err) {
      console.error("Proof generation failed:", err);
      setProofError(true);
    } finally {
      setIsProofLoading(false);
    }
  }, [proofFront, proofBack, currentOrder]);

  useEffect(() => {
    if (currentStep === 4 && currentOrder.recipients?.length) {
      handleGenerateProof();
    }
  }, [currentStep, currentOrder, handleGenerateProof]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Create Your Postcard Order</h1>
        <Stepper currentStep={currentStep} totalSteps={4} stepNames={stepNames} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          <div className="lg:col-span-2">
            <Card>
              {currentStep === 1 && <Step1Upload />}
              {currentStep === 2 && (
                <Step2Config
                  currentOrder={currentOrder}
                  setCurrentOrder={setCurrentOrder}
                  sizeOptions={sizeOptions}
                  mailClassOptions={mailClassOptions}
                />
              )}
              {currentStep === 3 && <Step3Recipients addRecipient={addRecipient} />}
              {currentStep === 4 && (
                <Step4Review
                  approvalChecklist={approvalChecklist}
                  handleChecklistChange={handleChecklistChange}
                  isChecklistComplete={isChecklistComplete}
                  handleSubmitOrder={handleSubmitOrder}
                  proofFront={proofFront}
                  proofBack={proofBack}
                  isProofLoading={isProofLoading}
                  proofError={proofError}
                  regenerateProof={() => {
                    setProofFront(null);
                    setProofBack(null);
                    handleGenerateProof();
                  }}
                />
              )}
            </Card>
          </div>

          <div className="lg:col-span-1">
            <OrderSummaryCard />
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <Button onClick={() => setCurrentStep((s) => Math.max(1, s - 1))} disabled={currentStep === 1} variant="secondary">
            Previous
          </Button>
          <Button onClick={() => setCurrentStep((s) => Math.min(4, s + 1))} disabled={currentStep === 4}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
