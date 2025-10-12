import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useOrderStore, type Order } from "../store/orderStore";
import Stepper from "../components/Stepper";
import OrderSummaryCard from "../components/OrderSummaryCard";
import RecipientList from "../components/RecipientList";
import ProofPreview from "../components/ProofPreview";
import { Input, Select, Checkbox, Button, Card } from "../components/FormComponents";
import RecipientCSVUpload from "../components/recipientcsv";
import Step1Upload from "./orders/step1";

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
  { sizeKey: "BRO", sizeLabel: "8.5 x 11 Yellow Letters", mailClass: "Standard", one: 1.49, twoTo99: 1.49, hundredUp: 1.49 },
  { sizeKey: "BRO", sizeLabel: "8.5 x 11 Yellow Letters", mailClass: "FirstClass", one: 1.69, twoTo99: 1.69, hundredUp: 1.69 },
];



export default function Order() {
  const {
    currentOrder,
    setCurrentOrder,
    addRecipient,
    clearCurrentOrder,
    createOrder,
    submitOrder,
    generateProofByTemplate
  } = useOrderStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [approvalChecklist, setApprovalChecklist] = useState({
    imagesDisplayed: false,
    noSpellingErrors: false,
    designVariablesCorrect: false,
    addressBlockMapped: false,
    noReturnAddress: false,
    quantityCorrect: false,
    useFirstClass: false,
  });

  const [recipientForm, setRecipientForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    externalReferenceNumber: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const [proofFront, setProofFront] = useState<string | null>(null);
  const [proofBack, setProofBack] = useState<string | null>(null);
  const [isProofLoading, setIsProofLoading] = useState(false);
  const [proofError, setProofError] = useState(false);

  const stepNames = ["Select Design", "Configure Order", "Add Recipients", "Review & Submit"];

  const handleNext = () => { if (currentStep < 4) setCurrentStep(currentStep + 1); };
  const handlePrevious = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const handleChecklistChange = (item: string, checked: boolean) => {
    setApprovalChecklist(prev => ({ ...prev, [item]: checked }));
  };

  const handleAddRecipient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    addRecipient({ id: uuidv4(), ...recipientForm });
    setRecipientForm({ firstName: "", lastName: "", company: "", externalReferenceNumber: "", address1: "", address2: "", city: "", state: "", zipCode: "" });
  };

  const handleSubmitOrder = async () => {
    try {
      const orderData: Partial<Order> = { ...currentOrder, mailClass: currentOrder.mailClass || "FirstClass" };
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
        useFirstClass: false,
      });
      alert("Order submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to submit order.");
    }
  };

  const isChecklistComplete = Object.values(approvalChecklist).every(Boolean);

  const sizeOptions = [...new Set(pricingTable.map(p => p.sizeLabel))].map(s => ({
    label: s,
    value: pricingTable.find(p => p.sizeLabel === s)?.sizeKey || "46"
  }));
  const mailClassOptions = [
    { label: "First Class", value: "FirstClass" },
    { label: "Standard", value: "Standard" },
  ];

  // Proof generation
  const handleGenerateProof = async () => {
    if (
      (!currentOrder.templateId && (!currentOrder.front || !currentOrder.back)) ||
      !currentOrder.recipients ||
      currentOrder.recipients.length === 0
    ) return;

    setIsProofLoading(true);
    setProofError(false);

    try {
      if (!currentOrder.designSize || !currentOrder.recipients[0]) {
        setProofError(true);

      }
      else {

        const { front, back } = await generateProofByTemplate(
          currentOrder.designSize,
          currentOrder.recipients[0],
          "jpg",
          currentOrder.templateId,
          currentOrder.front || undefined,
          currentOrder.back || undefined,
        );

        setProofFront(front);
        setProofBack(back);
      }
    } catch (err) {
      console.error(err);
      setProofError(true);
    } finally {
      setIsProofLoading(false);
    }
  };

  useEffect(() => {
    // Auto-generate proof whenever template or first recipient changes
    if (currentStep === 4 && currentOrder.templateId && currentOrder.recipients?.length) {
      handleGenerateProof();
    }
    console.log(currentOrder);

  }, [currentStep, currentOrder.templateId, currentOrder.recipients]);
  useEffect(() => {
    const updated: Partial<Order> = {};

    if (!currentOrder.mailClass) updated.mailClass = "FirstClass";
    if (!currentOrder.designSize) updated.designSize = "46";

    if (Object.keys(updated).length > 0) {
      setCurrentOrder(updated);
    }
  }, [currentOrder.mailClass, currentOrder.designSize]);


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
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold mb-4">Step 2: Configure Order</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select label="Size" name="designSize" value={currentOrder.designSize || "46"} onChange={(value) => setCurrentOrder({ designSize: value })} options={sizeOptions} />
                    <Select label="Mail Class" name="mailClass" value={currentOrder.mailClass || "FirstClass"} onChange={(value) => setCurrentOrder({ mailClass: value })} options={mailClassOptions} />
                    <Input label="Mail Date" name="mailDate" type="date" value={currentOrder.mailDate || ""} onChange={(value) => setCurrentOrder({ mailDate: value })} required />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Step 3: Add Recipients</h2>
                  <RecipientCSVUpload />
                  <form onSubmit={handleAddRecipient} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {Object.entries(recipientForm).map(([key, value]) => (
                      <Input
                        key={key}
                        label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        name={key}
                        value={value}
                        onChange={(val) => setRecipientForm({ ...recipientForm, [key]: val })}
                        required={["firstName", "lastName", "address1", "city", "state", "zipCode"].includes(key)}
                      />
                    ))}
                    <div className="md:col-span-2">
                      <Button type="submit" className="w-full">Add Recipient</Button>
                    </div>
                  </form>
                  <RecipientList />
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold mb-4">Step 4: Review & Submit</h2>
                  <div className="space-y-2">
                    {Object.keys(approvalChecklist).map(key => (
                      <Checkbox
                        key={key}
                        name={key}
                        label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
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
                    onRegenerate={handleGenerateProof}
                  />
                  <OrderSummaryCard />
                  <Button onClick={handleSubmitOrder} disabled={!isChecklistComplete} className="w-full py-3 text-lg">Approve & Submit</Button>
                </div>
              )}

            </Card>
          </div>

          <div className="lg:col-span-1">
            <OrderSummaryCard />
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <Button onClick={handlePrevious} disabled={currentStep === 1} variant="secondary">Previous</Button>
          <Button onClick={handleNext} disabled={currentStep === 4}>Next</Button>
        </div>
      </div>
    </div>
  );
}
