// ./steps/Step0SelectProduct.tsx
import { Button } from "../../components/FormComponents";

export default function Step0SelectProduct({ onSelect }: { onSelect: (type: "postcard" | "letter") => void }) {
    return (
        <div className="text-center space-y-6">
            <h2 className="text-2xl font-semibold">Choose Product Type</h2>
            <p className="text-gray-600">Select whether you want to create a Postcard or Letter order.</p>
            <div className="flex justify-center gap-6">
                <Button onClick={() => onSelect("postcard")}>Postcard</Button>
                <Button onClick={() => onSelect("letter")} variant="secondary">Letter</Button>
            </div>
        </div>
    );
}
