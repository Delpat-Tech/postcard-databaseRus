import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Input, Button } from "../../components/FormComponents";
import RecipientCSVUpload from "../../components/recipientcsv";
import RecipientList from "../../components/RecipientList";
import { useOrderStore } from "../../store/orderStore";
import { useTemplateStore } from "../../store/templateStore";

export default function Step3Recipients({ addRecipient }) {
    const { currentOrder } = useOrderStore();
    const templates = useTemplateStore((s) => s.templates);
    const selectedTemplate = templates.find((t) => t._id === currentOrder.templateId) || null;
    const designFields = selectedTemplate?.rawData?.designFields || [];

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
        // store per-recipient design variables in a map for the form
        variables: {} as Record<string, string>,
    });

    useEffect(() => {
        // when selected template changes, prepopulate variable keys
        if (!designFields || designFields.length === 0) return;
        setRecipientForm((prev) => {
            const vars = { ...(prev.variables || {}) };
            designFields.forEach((f: any) => {
                if (!(f.fieldKey in vars)) vars[f.fieldKey] = "";
            });
            return { ...prev, variables: vars };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTemplate?._id]);

    const handleAddRecipient = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // convert variables map to array of { key, value }
        const varsArray = Object.entries(recipientForm.variables || {}).map(([key, value]) => ({ key, value }));
        addRecipient({ id: uuidv4(), ...recipientForm, variables: varsArray });
        setRecipientForm({
            firstName: "",
            lastName: "",
            company: "",
            externalReferenceNumber: "",
            address1: "",
            address2: "",
            city: "",
            state: "",
            zipCode: "",
            variables: {},
        });
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6">Step 3: Add Recipients</h2>
            <RecipientCSVUpload />
            <form onSubmit={handleAddRecipient} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {Object.entries(recipientForm).filter(([k]) => k !== 'variables').map(([key, value]) => (
                    <Input
                        key={key}
                        label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        name={key}
                        value={value}
                        onChange={(val) => setRecipientForm({ ...recipientForm, [key]: val })}
                        required={["firstName", "lastName", "address1", "city", "state", "zipCode"].includes(key)}
                    />
                ))}

                {/* Per-recipient design variables (from selected template) */}
                {designFields && designFields.length > 0 && (
                    <div className="md:col-span-2">
                        <h4 className="font-semibold mb-2">Design variables for this recipient</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {designFields.map((f: any) => (
                                <Input
                                    key={f.fieldKey}
                                    label={f.fieldLabel || f.fieldKey}
                                    name={f.fieldKey}
                                    value={recipientForm.variables?.[f.fieldKey] || ""}
                                    onChange={(val) => setRecipientForm({ ...recipientForm, variables: { ...(recipientForm.variables || {}), [f.fieldKey]: val } })}
                                    required={!!f.mandatory}
                                />
                            ))}
                        </div>
                    </div>
                )}
                <div className="md:col-span-2">
                    <Button type="submit" className="w-full">Add Recipient</Button>
                </div>
            </form>
            <RecipientList />
        </div>
    );
}
