import { useEffect } from "react";
import { Input, Select, ImageInput } from "../../components/FormComponents";
import { usePublicStore } from "../../store/publicStore";
import { useTemplateStore } from "../../store/templateStore";

export default function Step2Config({
    currentOrder,
    setCurrentOrder,
    sizeOptions,
    mailClassOptions,
}: any) {
    const prices = usePublicStore((s) => s.prices);
    const templates = useTemplateStore((s) => s.templates);
    const selectedTemplate = templates.find((t) => t._id === currentOrder.templateId) || null;
    const designFields = selectedTemplate?.rawData?.designFields || [];

    // ensure globalDesignVariables contains entries for each design field (do not overwrite existing values)
    useEffect(() => {
        if (!designFields || designFields.length === 0) return;
        const existing = Array.isArray(currentOrder.globalDesignVariables) ? [...currentOrder.globalDesignVariables] : [];
        let changed = false;
        designFields.forEach((f: any) => {
            if (!existing.find((v: any) => v.key === f.fieldKey)) {
                existing.push({ key: f.fieldKey, value: "" });
                changed = true;
            }
        });
        if (changed) setCurrentOrder({ globalDesignVariables: existing });
        // only run when selected template changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTemplate?._id]);
    // derive size options from server pricing if available, otherwise use passed sizeOptions
    const effectiveSizeOptions = prices && prices.length > 0
        ? Array.from(new Map(prices.map(p => [p.sizeKey + '|' + p.sizeLabel, { label: p.sizeLabel, value: p.sizeKey }])).values())
        : sizeOptions;
    const handleReturnAddressChange = (field: string, value: any) => {
        setCurrentOrder({
            returnAddress: {
                ...currentOrder.returnAddress,
                [field]: value,
            },
        });
    };

    const handleUserDetailsChange = (field: string, value: any) => {
        setCurrentOrder({
            userDet: {
                ...currentOrder.userDet,
                [field]: value,
            },
        });
    };

    const returnAddress = currentOrder.returnAddress || {};
    const userDetails = currentOrder.userDet || {};

    const handleDesignFieldChange = (fieldKey: string, value: string) => {
        const existing = Array.isArray(currentOrder.globalDesignVariables) ? [...currentOrder.globalDesignVariables] : [];
        const idx = existing.findIndex((v: any) => v.key === fieldKey);
        if (idx >= 0) {
            existing[idx] = { ...existing[idx], value };
        } else {
            existing.push({ key: fieldKey, value });
        }
        setCurrentOrder({ globalDesignVariables: existing });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Step 2: Configure Order</h2>

            {/* ===== Design Details ===== */}
            {designFields && designFields.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-3">Design Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {designFields.map((f: any) => {
                            const Component = f.fieldType === 'image' ? ImageInput : Input;
                            return (
                                <Component
                                    key={f.fieldKey}
                                    label={f.fieldLabel || f.fieldKey}
                                    name={f.fieldKey}
                                    value={(currentOrder.globalDesignVariables || []).find((v: any) => v.key === f.fieldKey)?.value || ""}
                                    onChange={(value: any) => handleDesignFieldChange(f.fieldKey, value)}
                                    required={!!f.mandatory}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ===== User Details ===== */}
            <div className="mt-6">
                <h3 className="text-xl font-semibold mb-3">Your Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Phone"
                        name="userPhone"
                        value={userDetails.phone || ""}
                        onChange={(value) => handleUserDetailsChange("phone", value)}
                        required
                    />
                    <Input
                        label="Email"
                        name="userEmail"
                        type="email"
                        value={userDetails.email || ""}
                        onChange={(value) => handleUserDetailsChange("email", value)}
                        required
                    />
                </div>
            </div>

            {/* ===== Order Settings ===== */}
            <div className="mt-6">
                <h3 className="text-xl font-semibold mb-3">Order Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Size"
                        name="designSize"
                        value={currentOrder.designSize || "46"}
                        onChange={(value) => setCurrentOrder({ designSize: value })}
                        options={effectiveSizeOptions}
                    />
                    <Select
                        label="Mail Class"
                        name="mailClass"
                        value={currentOrder.mailClass || "FirstClass"}
                        onChange={(value) => setCurrentOrder({ mailClass: value })}
                        options={mailClassOptions}
                    />
                    <Input
                        label="Mail Date"
                        name="mailDate"
                        type="date"
                        value={currentOrder.mailDate || ""}
                        onChange={(value) => setCurrentOrder({ mailDate: value })}
                        required
                    />
                </div>
            </div>

            {/* ===== Return Address ===== */}
            <div className="mt-6">
                <h3 className="text-xl font-semibold mb-3">Return Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="First Name"
                        name="returnFirstName"
                        value={returnAddress.firstName || ""}
                        onChange={(value) => handleReturnAddressChange("firstName", value)}
                        required
                    />
                    <Input
                        label="Last Name"
                        name="returnLastName"
                        value={returnAddress.lastName || ""}
                        onChange={(value) => handleReturnAddressChange("lastName", value)}
                        required
                    />
                    <Input
                        label="Company"
                        name="returnCompany"
                        value={returnAddress.company || ""}
                        onChange={(value) => handleReturnAddressChange("company", value)}
                    />
                    <Input
                        label="Address 1"
                        name="returnAddress1"
                        value={returnAddress.address1 || ""}
                        onChange={(value) => handleReturnAddressChange("address1", value)}
                        required
                    />
                    <Input
                        label="Address 2"
                        name="returnAddress2"
                        value={returnAddress.address2 || ""}
                        onChange={(value) => handleReturnAddressChange("address2", value)}
                    />
                    <Input
                        label="City"
                        name="returnCity"
                        value={returnAddress.city || ""}
                        onChange={(value) => handleReturnAddressChange("city", value)}
                        required
                    />
                    <Input
                        label="State"
                        name="returnState"
                        value={returnAddress.state || ""}
                        onChange={(value) => handleReturnAddressChange("state", value)}
                        required
                    />
                    <Input
                        label="Zip Code"
                        name="returnZip"
                        value={returnAddress.zipCode || ""}
                        onChange={(value) => handleReturnAddressChange("zipCode", value)}
                        required
                    />
                </div>
            </div>
        </div>
    );
}
