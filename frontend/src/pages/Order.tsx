import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrderStore } from "../store/orderStore";
import Stepper from "../components/Stepper";
import OrderSummaryCard from "../components/OrderSummaryCard";
import RecipientList from "../components/RecipientList";
import ProofPreview from "../components/ProofPreview";
import {
  Input,
  Select,
  Radio,
  Checkbox,
  Button,
  Card,
} from "../components/FormComponents";
import { Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

export default function Order() {
  const {
    currentOrder,
    setCurrentOrder,
    addRecipient,
    clearCurrentOrder,
    createOrder,
    submitOrder,
    templates,
    openTemplateEditor,
    createNewDesign,
  } = useOrderStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const selectedTemplate = templates.find((t) => t._id === currentOrder.templateId) || null;
  const navigate = useNavigate();
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

  const stepNames = [
    "Select Design",
    "Configure Order",
    "Select Recipients",
    "Review Order",
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleChecklistChange = (item: string, checked: boolean) => {
    setApprovalChecklist((prev) => ({ ...prev, [item]: checked }));
  };

  const handleAddRecipient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const recipient = {
      id: uuidv4(),
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      company: (formData.get("company") as string) || undefined,
      address1: formData.get("address1") as string,
      address2: (formData.get("address2") as string) || undefined,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zipCode: formData.get("zipCode") as string,
      externalReferenceNumber:
        (formData.get("externalReferenceNumber") as string) || undefined,
    };
    addRecipient(recipient);
    e.currentTarget.reset();
  };

  const handleSubmitOrder = async () => {
    try {
      const orderData = {
        designType: currentOrder.designType || "single",
        designId: currentOrder.designId,
        designName: currentOrder.designName,
        designSize: currentOrder.designSize,
        isCustomDesign: currentOrder.isCustomDesign || false,
        mailClass: currentOrder.mailClass || "First Class",
        externalReference: currentOrder.externalReference,
        mailDate: currentOrder.mailDate || "",
        brochureFold: currentOrder.brochureFold || "Tri-Fold",
        returnAddress: currentOrder.returnAddress,
        recipients: currentOrder.recipients || [],
      };

      // Create order
      const order = await createOrder(orderData);

      // Submit for admin approval
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
      alert("Order submitted successfully! It will be reviewed by an admin.");
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Failed to submit order. Please try again.");
    }
  };

  const isChecklistComplete = Object.values(approvalChecklist).every(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            Create Your Order
          </h1>

          <div className="mb-8">
            <Stepper
              currentStep={currentStep}
              totalSteps={4}
              stepNames={stepNames}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                {currentStep === 1 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-6">
                      Step 1: Select Design
                    </h2>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Template Options</h3>
                        {currentOrder.templateId || currentOrder.designName ? (
                          <div className="mb-4 border rounded p-4 flex items-center gap-4">
                            <div className="w-28 h-20 bg-gray-100 flex items-center justify-center overflow-hidden">
                              {selectedTemplate?.previewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={selectedTemplate.previewUrl} alt={selectedTemplate.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-sm text-gray-400">No preview</div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold">{currentOrder.designName || selectedTemplate?.name || 'Selected template'}</div>
                              <div className="text-sm text-gray-500">{currentOrder.designSize || selectedTemplate?.size}</div>
                              <div className="mt-3 flex items-center gap-3">
                                <button onClick={() => navigate('/templates')} className="px-3 py-2 border rounded">Change</button>
                                <button onClick={async () => {
                                  try {
                                    const id = selectedTemplate?._id || currentOrder.templateId || '';
                                    if (!id) throw new Error('No template id');
                                    const url = await openTemplateEditor(id);
                                    window.open(url, '_blank');
                                  } catch (e) {
                                    console.error(e);
                                    alert(e instanceof Error ? e.message : String(e));
                                  }
                                }} className="px-3 py-2 bg-gray-100 border rounded">Personalize</button>
                                <button onClick={() => {
                                  // switch to a custom design flow: clear the selected template and mark as custom
                                  setCurrentOrder({
                                    templateId: undefined,
                                    designId: undefined,
                                    designName: undefined,
                                    designSize: undefined,
                                    isCustomDesign: true,
                                  })

                                  setShowCreateForm((s) => {
                                    const next = !s;
                                    if (next) setCurrentOrder({ isCustomDesign: true });
                                    return next;
                                  });
                                }} className="px-3 py-2 bg-white border rounded">Create Your Own</button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Design Your Own toggle card */}
                            <Card
                              onClick={() => {
                                setShowCreateForm((s) => {
                                  const next = !s;
                                  if (next) setCurrentOrder({ isCustomDesign: true });
                                  return next;
                                });
                              }}
                              className={"border-2 border-dashed border-gray-300 hover:border-blue-500" + (showCreateForm ? ' ring-2 ring-blue-300' : ' cursor-pointer')}
                            >
                              <div className="text-center py-8">
                                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <h4 className="font-medium">Design Your Own</h4>
                                <p className="text-sm text-gray-500">Upload your custom design</p>
                              </div>
                            </Card>

                            {/* Either show inline create form or link to templates */}
                            {showCreateForm ? (
                              <Card className="p-4">
                                <h4 className="font-medium mb-2">Create New Design</h4>
                                <NewDesignForm onCreate={async (design) => {
                                  try {
                                    const { template, url } = await createNewDesign(design);
                                    setCurrentOrder({ templateId: template._id, designId: template.pcmDesignId || template._id, designName: template.name, designSize: template.size, isCustomDesign: false });
                                    setShowCreateForm(false);
                                    if (url) window.location.href = url;
                                  } catch (err) {
                                    console.error(err);
                                    alert(err instanceof Error ? err.message : String(err));
                                  }
                                }} />
                              </Card>
                            ) : (
                              <Link to="/templates">
                                <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer">
                                  <div className="text-center py-8">
                                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <h4 className="font-medium">Edit Template</h4>
                                    <p className="text-sm text-gray-500">Choose from PostcardMania templates</p>
                                  </div>
                                </Card>
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-6">
                      Step 2: Configure Order
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Select
                        label="Mail Class"
                        name="mailClass"
                        value={currentOrder.mailClass || "First Class"}
                        onChange={(value) =>
                          setCurrentOrder({ mailClass: value as any })
                        }
                        options={[
                          { value: "First Class", label: "First Class" },
                          { value: "Standard", label: "Standard" },
                        ]}
                        required
                      />

                      <Input
                        label="External Reference"
                        name="externalReference"
                        value={currentOrder.externalReference || ""}
                        onChange={(value) =>
                          setCurrentOrder({ externalReference: value })
                        }
                        placeholder="Optional"
                      />

                      <Input
                        label="Mail Date"
                        name="mailDate"
                        type="date"
                        value={currentOrder.mailDate || ""}
                        onChange={(value) =>
                          setCurrentOrder({ mailDate: value })
                        }
                        required
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Brochure Fold
                        </label>
                        <div className="space-y-2">
                          <Radio
                            label="Tri-Fold"
                            name="brochureFold"
                            value="Tri-Fold"
                            checked={currentOrder.brochureFold === "Tri-Fold"}
                            onChange={(value) =>
                              setCurrentOrder({ brochureFold: value as any })
                            }
                          />
                          <Radio
                            label="Bi-Fold"
                            name="brochureFold"
                            value="Bi-Fold"
                            checked={currentOrder.brochureFold === "Bi-Fold"}
                            onChange={(value) =>
                              setCurrentOrder({ brochureFold: value as any })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-4">
                        Return Address (Optional)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="First Name"
                          name="returnFirstName"
                          value={currentOrder.returnAddress?.firstName || ""}
                          onChange={(value) =>
                            setCurrentOrder({
                              returnAddress: {
                                ...currentOrder.returnAddress,
                                firstName: value,
                              } as any,
                            })
                          }
                        />
                        <Input
                          label="Last Name"
                          name="returnLastName"
                          value={currentOrder.returnAddress?.lastName || ""}
                          onChange={(value) =>
                            setCurrentOrder({
                              returnAddress: {
                                ...currentOrder.returnAddress,
                                lastName: value,
                              } as any,
                            })
                          }
                        />
                        <Input
                          label="Company"
                          name="returnCompany"
                          value={currentOrder.returnAddress?.company || ""}
                          onChange={(value) =>
                            setCurrentOrder({
                              returnAddress: {
                                ...currentOrder.returnAddress,
                                company: value,
                              } as any,
                            })
                          }
                        />
                        <Input
                          label="Address 1"
                          name="returnAddress1"
                          value={currentOrder.returnAddress?.address1 || ""}
                          onChange={(value) =>
                            setCurrentOrder({
                              returnAddress: {
                                ...currentOrder.returnAddress,
                                address1: value,
                              } as any,
                            })
                          }
                        />
                        <Input
                          label="Address 2"
                          name="returnAddress2"
                          value={currentOrder.returnAddress?.address2 || ""}
                          onChange={(value) =>
                            setCurrentOrder({
                              returnAddress: {
                                ...currentOrder.returnAddress,
                                address2: value,
                              } as any,
                            })
                          }
                        />
                        <Input
                          label="City"
                          name="returnCity"
                          value={currentOrder.returnAddress?.city || ""}
                          onChange={(value) =>
                            setCurrentOrder({
                              returnAddress: {
                                ...currentOrder.returnAddress,
                                city: value,
                              } as any,
                            })
                          }
                        />
                        <Input
                          label="State"
                          name="returnState"
                          value={currentOrder.returnAddress?.state || ""}
                          onChange={(value) =>
                            setCurrentOrder({
                              returnAddress: {
                                ...currentOrder.returnAddress,
                                state: value,
                              } as any,
                            })
                          }
                        />
                        <Input
                          label="Zip Code"
                          name="returnZipCode"
                          value={currentOrder.returnAddress?.zipCode || ""}
                          onChange={(value) =>
                            setCurrentOrder({
                              returnAddress: {
                                ...currentOrder.returnAddress,
                                zipCode: value,
                              } as any,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-6">
                      Step 3: Select Recipients
                    </h2>

                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">
                        Add Recipient
                      </h3>
                      <form
                        onSubmit={handleAddRecipient}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <Input
                          label="First Name"
                          name="firstName"
                          value=""
                          onChange={() => { }}
                          required
                        />
                        <Input
                          label="Last Name"
                          name="lastName"
                          value=""
                          onChange={() => { }}
                          required
                        />
                        <Input
                          label="Company"
                          name="company"
                          value=""
                          onChange={() => { }}
                        />
                        <Input
                          label="External Reference Number"
                          name="externalReferenceNumber"
                          value=""
                          onChange={() => { }}
                        />
                        <Input
                          label="Address 1"
                          name="address1"
                          value=""
                          onChange={() => { }}
                          required
                        />
                        <Input
                          label="Address 2"
                          name="address2"
                          value=""
                          onChange={() => { }}
                        />
                        <Input
                          label="City"
                          name="city"
                          value=""
                          onChange={() => { }}
                          required
                        />
                        <Input
                          label="State"
                          name="state"
                          value=""
                          onChange={() => { }}
                          required
                        />
                        <Input
                          label="Zip Code"
                          name="zipCode"
                          value=""
                          onChange={() => { }}
                          required
                        />
                        <div className="md:col-span-2">
                          <Button type="submit" className="w-full">
                            Add Recipient
                          </Button>
                        </div>
                      </form>
                    </div>

                    <RecipientList />
                  </div>
                )}

                {currentStep === 4 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-6">
                      Step 4: Review Order
                    </h2>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">
                          Approval Checklist
                        </h3>
                        <div className="space-y-3">
                          <Checkbox
                            label="All images are displayed correctly"
                            name="imagesDisplayed"
                            checked={approvalChecklist.imagesDisplayed}
                            onChange={(checked) =>
                              handleChecklistChange("imagesDisplayed", checked)
                            }
                          />
                          <Checkbox
                            label="No spelling errors"
                            name="noSpellingErrors"
                            checked={approvalChecklist.noSpellingErrors}
                            onChange={(checked) =>
                              handleChecklistChange("noSpellingErrors", checked)
                            }
                          />
                          <Checkbox
                            label="All design variables are correct"
                            name="designVariablesCorrect"
                            checked={approvalChecklist.designVariablesCorrect}
                            onChange={(checked) =>
                              handleChecklistChange(
                                "designVariablesCorrect",
                                checked
                              )
                            }
                          />
                          <Checkbox
                            label="Address block has been mapped correctly"
                            name="addressBlockMapped"
                            checked={approvalChecklist.addressBlockMapped}
                            onChange={(checked) =>
                              handleChecklistChange(
                                "addressBlockMapped",
                                checked
                              )
                            }
                          />
                          <Checkbox
                            label="(Optional) I don't want a return address"
                            name="noReturnAddress"
                            checked={approvalChecklist.noReturnAddress}
                            onChange={(checked) =>
                              handleChecklistChange("noReturnAddress", checked)
                            }
                          />
                          <Checkbox
                            label="Quantity of items is correct"
                            name="quantityCorrect"
                            checked={approvalChecklist.quantityCorrect}
                            onChange={(checked) =>
                              handleChecklistChange("quantityCorrect", checked)
                            }
                          />
                          <Checkbox
                            label="I want to use First Class mailing"
                            name="useFirstClass"
                            checked={approvalChecklist.useFirstClass}
                            onChange={(checked) =>
                              handleChecklistChange("useFirstClass", checked)
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-4">
                          Estimated Order Cost
                        </h3>
                        <div className="bg-gray-100 rounded-lg p-4">
                          <p className="text-2xl font-bold text-green-600">
                            $0.00
                          </p>
                          <p className="text-sm text-gray-500">
                            Final cost will be calculated after approval
                          </p>
                        </div>
                      </div>

                      <ProofPreview />

                      <div className="pt-6">
                        <Button
                          onClick={handleSubmitOrder}
                          disabled={!isChecklistComplete}
                          className="w-full text-lg py-3"
                        >
                          Approve & Pay with PayPal
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <div className="lg:col-span-1">
              <OrderSummaryCard />
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              variant="secondary"
            >
              Previous
            </Button>
            <Button onClick={handleNext} disabled={currentStep === 4}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small inline form used on the Order page to create a new design via the backend
function NewDesignForm({ onCreate }: { onCreate?: (payload: { name: string; size: string }) => void }) {
  const [name, setName] = useState("");
  const [size, setSize] = useState("46");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allowedSizes = ["46", "58", "68", "611", "811", "BRO"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Please enter a name for the design");
    if (!allowedSizes.includes(size)) return alert("Please select a valid size");
    setIsSubmitting(true);
    try {
      if (onCreate) await onCreate({ name: name.trim(), size });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input label="Name" name="designName" value={name} onChange={setName} required />
      <label className="block text-sm font-medium text-gray-700">Size</label>
      <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full px-3 py-2 border rounded">
        {allowedSizes.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <div>
        <Button type="submit" disabled={isSubmitting} className="mt-2">
          Create & Edit
        </Button>
      </div>
    </form>
  );
}
