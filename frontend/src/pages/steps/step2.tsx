import { Input, Select } from "../../components/FormComponents";

export default function Step2Config({ currentOrder, setCurrentOrder, sizeOptions, mailClassOptions }) {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Step 2: Configure Order</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                    label="Size"
                    name="designSize"
                    value={currentOrder.designSize || "46"}
                    onChange={(value) => setCurrentOrder({ designSize: value })}
                    options={sizeOptions}
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
    );
}
