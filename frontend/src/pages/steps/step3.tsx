import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Input, Button } from "../../components/FormComponents";
import RecipientCSVUpload from "../../components/recipientcsv";
import RecipientList from "../../components/RecipientList";

export default function Step3Recipients({ addRecipient }) {
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

    const handleAddRecipient = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        addRecipient({ id: uuidv4(), ...recipientForm });
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
        });
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6">Step 3: Add Recipients</h2>
            <RecipientCSVUpload />
            <form onSubmit={handleAddRecipient} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {Object.entries(recipientForm).map(([key, value]) => (
                    <Input
                        key={key}
                        label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
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
    );
}
