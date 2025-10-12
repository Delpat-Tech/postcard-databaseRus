import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrderStore } from "../../store/orderStore";
type PricingRule = {
    sizeKey: string;
    sizeLabel: string;
    mailClass: "FirstClass" | "Standard";
    one: number;
    twoTo99: number;
    hundredUp: number;
};
export default function Step1UploadAndSelect() {
    const { currentOrder, setCurrentOrder, templates, openTemplateEditor, openTemplateSimpleEditor } = useOrderStore();
    const [frontHTML, setFrontHTML] = useState(currentOrder.front || "");
    const [backHTML, setBackHTML] = useState(currentOrder.back || "");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();

    const selectedTemplate = templates.find((t) => t._id === currentOrder.templateId) || null;
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
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ["application/pdf", "image/jpeg", "image/png"];
        if (!validTypes.includes(file.type)) {
            alert("Invalid file type. Allowed: PDF, JPG, PNG");
            e.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            setCurrentOrder({ [side]: result });
        };
        reader.readAsDataURL(file);
    };

    const handleHTMLChange = (value: string, side: "front" | "back") => {
        const htmlPattern = /<([a-z]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)/i;
        if (value && !htmlPattern.test(value)) {
            alert("Invalid HTML format");
            return;
        }
        setCurrentOrder({ [side]: value });
    };

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Upload Front & Back</h2>
                {/* Front */}
                <div>
                    <label className="block font-medium mb-1">Front (HTML/PDF/JPG/PNG)</label>
                    <textarea
                        placeholder="<html>...</html>"
                        className="w-full border rounded p-2 mb-2"
                        value={frontHTML}
                        onChange={(e) => {
                            setFrontHTML(e.target.value);
                            handleHTMLChange(e.target.value, "front");
                        }}
                    />
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, "front")}
                    />
                </div>
                {/* Back */}
                <div>
                    <label className="block font-medium mb-1">Back (HTML/PDF/JPG/PNG)</label>
                    <textarea
                        placeholder="<html>...</html>"
                        className="w-full border rounded p-2 mb-2"
                        value={backHTML}
                        onChange={(e) => {
                            setBackHTML(e.target.value);
                            handleHTMLChange(e.target.value, "back");
                        }}
                    />
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, "back")}
                    />
                </div>
            </div>

            {/* Template Selector Section */}
            <div className="border-t pt-4">
                <h2 className="text-2xl font-semibold mb-2">Or Choose a Template</h2>
                {selectedTemplate || currentOrder.designName ? (
                    <div className="flex items-center gap-4 border rounded p-4">
                        <div className="w-28 h-20 bg-gray-100 flex items-center justify-center overflow-hidden">
                            {selectedTemplate?.previewUrl ? (
                                <img
                                    src={selectedTemplate.previewUrl}
                                    alt={selectedTemplate.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-sm text-gray-400">No preview</div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold">{currentOrder.designName || selectedTemplate?.name || "Selected template"}</div>
                            <div className="text-sm text-gray-500">{currentOrder.designSize || selectedTemplate?.size}</div>
                            <div className="mt-3 flex items-center gap-3">
                                <button
                                    onClick={() => navigate("/templates")}
                                    className="px-3 py-2 border rounded"
                                >
                                    Change
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            const id = selectedTemplate?._id || currentOrder.templateId || "";
                                            if (!id) throw new Error("No template id");
                                            if (currentOrder.isCustomDesign) {
                                                const url = await openTemplateSimpleEditor(id);
                                                window.open(url, "_blank");
                                            } else {
                                                const template = await openTemplateEditor(id);
                                                setCurrentOrder({
                                                    templateId: template._id,
                                                    designId: template.pcmDesignId || template._id,
                                                    designName: template.name,
                                                    designSize: pricingTable.find(p => p.sizeLabel === template.size)?.sizeKey,
                                                    isCustomDesign: true,
                                                });
                                                navigate("/order");
                                                window.open(template.url, "_blank");
                                            }
                                        } catch (e) {
                                            console.error(e);
                                            alert(e instanceof Error ? e.message : String(e));
                                        }
                                    }}
                                    className="px-3 py-2 bg-gray-100 border rounded"
                                >
                                    Personalize
                                </button>
                                <button
                                    onClick={() => {
                                        setCurrentOrder({
                                            templateId: undefined,
                                            designId: undefined,
                                            designName: undefined,
                                            designSize: undefined,
                                            isCustomDesign: true,
                                        });
                                        setShowCreateForm((s) => {
                                            const next = !s;
                                            if (next) setCurrentOrder({ isCustomDesign: true });
                                            return next;
                                        });
                                    }}
                                    className="px-3 py-2 bg-white border rounded"
                                >
                                    Create Your Own
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <button
                            onClick={() => navigate("/templates")}
                            className="border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer p-6 text-center"
                        >
                            Choose Template
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
