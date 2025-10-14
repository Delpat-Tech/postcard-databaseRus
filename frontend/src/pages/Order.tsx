import { useState, useEffect, useCallback } from "react";
import { useOrderStore, type Order } from "../store/orderStore";
import Stepper from "../components/Stepper";
import OrderSummaryCard from "../components/OrderSummaryCard";
import Step0 from "./steps/step0";
import Step1Upload from "./steps/step1";
import Step1Letter from "./steps/stepletter";
import Step2Config from "./steps/step2";
import Step3Recipients from "./steps/step3";
import Step4Review from "./steps/step4";
import { Button, Card } from "../components/FormComponents";

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
export default function Order() {
  const {
    currentOrder,
    setCurrentOrder,
    addRecipient,
    clearCurrentOrder,
    createOrder,
    submitOrder,
    generateProofByTemplate,
    generateletterProofByTemplate,
  } = useOrderStore();

  const [currentStep, setCurrentStep] = useState(0); // start at 0
  const [productType, setProductType] = useState<"postcard" | "letter" | null>(null);
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
    console.log(currentOrder);

    if (proofFront && proofBack) return;

    if (currentOrder.recipients?.length === 0) return;
    if (!currentOrder.designSize) return;
    setIsProofLoading(true);
    setProofError(false);

    try {
      let proof;
      if (productType === "postcard") {

        proof = await generateProofByTemplate(
          currentOrder.designSize,
          currentOrder.recipients[0],
          "jpg",
          currentOrder.templateId,
          currentOrder.front,
          currentOrder.back
        );
        setProofFront(proof.front);
        setProofBack(proof.back);
        setCurrentOrder({ frontproof: proof.front, backproof: proof.back });

      }
      else if (productType === "letter") {
        proof = await generateletterProofByTemplate(
          currentOrder.recipients[0],
          currentOrder.font,
          currentOrder.envelopeType,
          currentOrder.fontColor,
          currentOrder.color,
          currentOrder.templateId,
          currentOrder.front
        );
        setProofFront(proof.front);

        setCurrentOrder({ frontproof: proof.front });
      }

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
        <Stepper
          currentStep={currentStep}
          totalSteps={productType ? 4 : 5}
          stepNames={productType ? stepNames : ["Select Product", ...stepNames]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          <div className="lg:col-span-2">
            <Card>
              {currentStep === 0 && (
                <Step0
                  onSelect={(type) => {
                    setProductType(type);
                    setCurrentStep(1);
                    setCurrentOrder({ productType: type, mailClass: "FirstClass", designSize: pricingTable.find(p => p.mailClass === "FirstClass" && p.sizeKey === (type === "postcard" ? "46" : "811"))?.sizeKey });
                  }}
                />
              )}

              {productType === "postcard" && currentStep === 1 && <Step1Upload />}
              {productType === "letter" && currentStep === 1 && <Step1Letter />}
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
