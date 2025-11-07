import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrderStore } from "../../store/orderStore";
import { useTemplateStore } from "../../store/templateStore";
import { usePublicStore } from "../../store/publicStore";


export default function Step1UploadAndSelect() {
    const { templates, openTemplateEditor, openTemplateSimpleEditor } = useTemplateStore()
    const { currentOrder, setCurrentOrder } = useOrderStore();
    const prices = usePublicStore((s) => s.prices);
    const fetchPricesByType = usePublicStore((s) => s.fetchPricesByType);
    const [frontHTML, setFrontHTML] = useState(currentOrder.front || "");
    const [backHTML, setBackHTML] = useState(currentOrder.back || "");
    const navigate = useNavigate();

    const selectedTemplate = templates.find((t) => t._id === currentOrder.templateId) || null;


    useEffect(() => {
        const type = currentOrder.productType || currentOrder.designType || 'postcard';
        if (!prices || prices.length === 0) {
            fetchPricesByType(type).catch(() => { });
        }
    }, []);
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
                            <div className="text-sm text-gray-500">{(prices.find(p => p.sizeLabel === currentOrder.designSize)?.sizeLabel) || selectedTemplate?.size}</div>
                            <div className="mt-3 flex items-center gap-3">
                                <button
                                    onClick={() => navigate("/templates")}
                                    className="px-3 py-2 border rounded"
                                >
                                    Change
                                </button>
                                {selectedTemplate?.allowPersonalize !== false &&
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
                                                        designSize: (prices.find(p => p.sizeLabel === template.size)?.sizeKey),
                                                        isCustomDesign: true,
                                                    });
                                                    navigate("/order");
                                                    // only open editor if template allows personalization
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
                                }
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
