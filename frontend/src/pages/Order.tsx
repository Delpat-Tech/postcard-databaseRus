import { useState, useEffect, useCallback } from "react";
import { useOrderStore } from "../store/orderStore";
import { useTemplateStore } from "../store/templateStore";
import type { Order } from "../store/types";
import Stepper from "../components/Stepper";
import OrderSummaryCard from "../components/OrderSummaryCard";
import Step0 from "./steps/step0";
import Step1Upload from "./steps/step1";
import Step1Letter from "./steps/stepletter";
import Step2Config from "./steps/step2";
import Step3Recipients from "./steps/step3";
import Step4Review from "./steps/step4";
import Step5Payment from "./steps/step5";
import { Button, Card } from "../components/FormComponents";
import { useSearchParams } from "react-router-dom";

// Pricing definitions (kept for context)
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

// Base step names for the stepper
const BASE_STEP_NAMES = ["Design", "Configure", "Recipients", "Review & Approve", "Payment"];
const TOTAL_STEPS = BASE_STEP_NAMES.length; // 5 steps (Index 0 to 4)

export default function Order() {
  const {
    currentOrder,
    setCurrentOrder,
    addRecipient,
    clearCurrentOrder,
    createOrder,
    submitOrder
  } = useOrderStore();

  const searchpara = useSearchParams()[0];

  useEffect(() => {
    const step = searchpara.get("step");
    const type = searchpara.get("type");
    if (type === "postcard" || type === "letter") {
      if (step) {
        setProductType(type);
        setCurrentOrder({ productType: type, mailClass: "FirstClass", designSize: type === "postcard" ? "46" : "811", isCustomDesign: (type === "letter" ? true : false) });
        setCurrentStep(1);

      }
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []); // Run once on mount

  const { generateletterProofByTemplate, generateProofByTemplate } = useTemplateStore()
  const [currentStep, setCurrentStep] = useState(0);
  const [productType, setProductType] = useState<"postcard" | "letter" | null>(null);
  const [approvalChecklist, setApprovalChecklist] = useState({
    imagesDisplayed: false,
    noSpellingErrors: false,
    designVariablesCorrect: false,
    addressBlockMapped: false,
    noReturnAddress: false,
    quantityCorrect: false,
  });
  const [isOrderSubmitted, setIsOrderSubmitted] = useState(false);
  const [order, setOrder] = useState<Partial<Order>>();

  const [proofFront, setProofFront] = useState<string | null>(null);
  const [proofBack, setProofBack] = useState<string | null>(null);
  const [isProofLoading, setIsProofLoading] = useState(false);
  const [proofError, setProofError] = useState(false);

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

  const handleApproveOrder = async () => {
    try {
      const orderData: Partial<Order> = {
        ...currentOrder
      };
      const order = await createOrder(orderData);
      setOrder(order)
      setCurrentStep(5); // Move to the Payment step (index 4)
    } catch (err) {
      console.error("Order creation error:", err);
      alert("Failed to prepare order for payment.");
    }
  };

  const handleSubmitOrder = async () => {
    clearCurrentOrder();
    if (!order || !order._id) {
      alert("Error: Order ID missing. Cannot submit.");
      return;
    }
    await submitOrder(order._id);
    setIsOrderSubmitted(true);
    setCurrentStep(TOTAL_STEPS); // Advance to a success state (index 5)

    try {
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to finalize order submission.");
    }
  };

  const isChecklistComplete = Object.values(approvalChecklist).every(Boolean);

  // 1. Refined useCallback dependencies to only use properties that affect the proof content
  const handleGenerateProof = useCallback(async () => {
    // Only check if crucial data is missing to abort (not if proof already exists)
    if (currentOrder.recipients?.length === 0 || !currentOrder.designSize) return;

    setIsProofLoading(true);
    setProofError(false);
    try {
      let proof;
      if (productType === "postcard") {
        // Merge global design variables into the recipient.variables so the proof
        // generation receives personalization variables as an array of { key, value }
        const firstRecipient = currentOrder.recipients[0];
        const globalVars = currentOrder.globalDesignVariables || [];
        const mergedRecipient = {
          ...firstRecipient,
          variables: [
            // start with recipient-specific variables (if any)
            ...(firstRecipient?.variables || []),
            // then append global design variables (these may be used to fill template fields)
            ...globalVars.map((v: any) => ({ key: v.key, value: v.value })),
          ],
        };

        proof = await generateProofByTemplate(
          currentOrder.designSize,
          mergedRecipient,
          "jpg",
          currentOrder.templateId,
          currentOrder.front,
          currentOrder.back
        );
        setProofFront(proof.front);
        setProofBack(proof.back);
        setCurrentOrder({ frontproof: proof.front, backproof: proof.back });
      } else if (productType === "letter") {
        const firstRecipient = currentOrder.recipients[0];
        const globalVars = currentOrder.globalDesignVariables || [];
        const mergedRecipient = {
          ...firstRecipient,
          variables: [
            ...(firstRecipient?.variables || []),
            ...globalVars.map((v: any) => ({ key: v.key, value: v.value })),
          ],
        };

        proof = await generateletterProofByTemplate(
          mergedRecipient,
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
  }, [
    currentOrder.designSize,
    currentOrder.recipients?.[0], // First recipient (for proof address block)
    currentOrder.templateId,
    currentOrder.front,
    currentOrder.back,
    currentOrder.font,
    currentOrder.envelopeType,
    currentOrder.fontColor,
    currentOrder.color,
    productType,
    generateProofByTemplate,
    generateletterProofByTemplate,
    setCurrentOrder
  ]);

  // 2. Refined useEffect logic to only call handleGenerateProof when proofs are missing
  useEffect(() => {
    // Step 4 (Review) is index 3
    const proofsMissing = !proofFront || (productType === "postcard" && !proofBack);

    if (currentStep === 3 && currentOrder.recipients?.length && proofsMissing) {
      handleGenerateProof();
    }

  }, [
    currentStep,
    currentOrder.recipients?.length,
    productType,
    proofFront,
    proofBack,
    handleGenerateProof
  ]);

  const isStepValid = (step: number) => {
    // Validation for Step 1 (Design Step)
    if (step === 1) {
      if (productType === "postcard") {
        const hasDesign = !!currentOrder.templateId || (!!currentOrder.front && !!currentOrder.back) || (!!currentOrder.frontPdf && !!currentOrder.backPdf);
        return hasDesign;
      } else if (productType === "letter") {
        // Letter design needs front content (image/pdf) AND core config (font, envelope, color) 
        const hasFrontContent = !!currentOrder.front || !!currentOrder.fileUrl;
        const hasLetterConfig = !!currentOrder.font && !!currentOrder.envelopeType && !!currentOrder.fontColor;

        return hasFrontContent && hasLetterConfig;
      }
      return false;
    }

    // Validation for Step 2 (Configuration Step) - Must have mailing size/class AND minimum contact/return info
    if (step === 2) {
      const hasMailingConfig = !!currentOrder.designSize && !!currentOrder.mailClass && !!currentOrder.mailDate;
      const hasUserEmail = !!currentOrder.userDet?.email;

      // Assuming return address is mandatory for all mailings
      const hasReturnAddress = !!currentOrder.returnAddress?.zipCode && !!currentOrder.returnAddress?.address1;

      return hasMailingConfig && hasUserEmail && hasReturnAddress;
    }

    // Validation for Step 3 (Recipients Step)
    if (step === 3 && currentOrder.recipients?.length === 0) return false;

    return true;
  };

  const renderContent = () => {
    // Dynamic step names for the Stepper
    const currentStepNames = productType
      ? BASE_STEP_NAMES.map((name, index) => {
        if (index === 0) return `${productType.charAt(0).toUpperCase() + productType.slice(1)} ${name}`;
        return name;
      })
      : BASE_STEP_NAMES;


    // Final success screen after submission
    if (isOrderSubmitted && currentStep === TOTAL_STEPS) {
      return (
        <div className="text-center py-10">
          <h2 className="text-3xl font-bold text-green-600 mb-4">🎉 Order Successfully Submitted! 🎉</h2>
          <p className="text-lg text-gray-700">
            Thank you for your payment. Your order is now being processed.
          </p>
          <Button onClick={() => setCurrentStep(0)} className="mt-6">
            Start New Order
          </Button>
        </div>
      );
    }

    // Main Order Flow
    return (
      <>
        <Stepper
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          stepNames={currentStepNames}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          <div className="lg:col-span-2">
            <Card>
              {/* Step 0: Select Product */}
              {currentStep === 0 && (
                <Step0
                  onSelect={(type) => {
                    setProductType(type);
                    // Set base config for the selected product type
                    const initialSizeKey = pricingTable.find(p => p.mailClass === "FirstClass" && p.sizeKey === (type === "postcard" ? "46" : "811"))?.sizeKey;
                    setCurrentOrder({ productType: type, mailClass: "FirstClass", designSize: initialSizeKey, isCustomDesign: (type === "letter" ? true : false) });
                    setCurrentStep(1);
                  }}
                />
              )}

              {/* Step 1: Upload/Letter */}
              {currentStep === 1 && productType === "postcard" && <Step1Upload />}
              {currentStep === 1 && productType === "letter" && <Step1Letter />}

              {/* Step 2: Config */}
              {currentStep === 2 && (
                <Step2Config
                  currentOrder={currentOrder}
                  setCurrentOrder={setCurrentOrder}
                  sizeOptions={sizeOptions}
                  mailClassOptions={mailClassOptions}
                />
              )}

              {/* Step 3: Recipients */}
              {currentStep === 3 && <Step3Recipients addRecipient={addRecipient} />}

              {/* Step 4: Review & Approve (Index 4) */}
              {currentStep === 4 && (
                <Step4Review
                  approvalChecklist={approvalChecklist}
                  handleChecklistChange={handleChecklistChange}
                  isChecklistComplete={isChecklistComplete}
                  handleSubmitOrder={handleApproveOrder} // This moves to Step 5
                  proofFront={proofFront}
                  proofBack={proofBack}
                  isProofLoading={isProofLoading}
                  proofError={proofError}
                  regenerateProof={() => {
                    setProofFront(null);
                    setProofBack(null);
                    handleGenerateProof();
                  }}
                  productType={productType}
                />
              )}

              {/* Step 5: Payment (Index 5) */}
              {currentStep === 5 && (
                <Step5Payment
                  order={order}
                  onPaymentSuccess={handleSubmitOrder} // This finalizes the order
                />
              )}
            </Card>
          </div>

          <div className="lg:col-span-1">
            <OrderSummaryCard />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            // Disable if on the first step (0) or on the final submission screen (TOTAL_STEPS=5)
            disabled={currentStep === 0}
            variant="secondary"
          >
            Previous
          </Button>

          {/* The Next button is shown for steps 0, 1, 2, 3 */}
          {currentStep >= 0 && currentStep <= 3 && (
            <Button
              onClick={() => setCurrentStep((s) => Math.min(4, s + 1))} // Max step is 4 (Review) before 'Approve' takes over
              disabled={!isStepValid(currentStep)}
            >
              Next
            </Button>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Create Your {productType ? productType.charAt(0).toUpperCase() + productType.slice(1) : "Order"}
        </h1>
        {renderContent()}
      </div>
    </div>
  );
}
