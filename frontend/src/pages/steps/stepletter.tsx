// ./steps/Step1Letter.tsx
import { useState, useEffect } from "react";
import { useOrderStore } from "../../store/orderStore";
import { useTemplateStore } from "../../store/templateStore";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Step1Letter() {
    const { currentOrder, setCurrentOrder } = useOrderStore();
    const { templates, fetchTemplatesByType } = useTemplateStore();
    const navigate = useNavigate();
    const [loadingEditor, setLoadingEditor] = useState<string | null>(null);

    useEffect(() => {
        // prefetch letter templates for preview/select actions
        fetchTemplatesByType("letter").catch(() => { });
    }, [fetchTemplatesByType]);
    const [frontHTML, setFrontHTML] = useState(currentOrder.front || "");
    const [url, setUrl] = useState(currentOrder.fileUrl || "");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const envelopeFonts = [
        "Bradley Hand",
        "Blackjack",
        "FG Cathies Hand",
        "Crappy Dan",
        "Dakota",
        "Jenna Sue",
        "Reenie Beanie",
    ];

    const envelopeTypes = ["fullWindow", "doubleWindow", "Regular", "BiFold"];
    const fontColors = ["Black", "Green", "Blue"];
    const exceptionalAddressingTypes = ["resident", "occupant", "business"];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Letter Setup</h2>

            {/* Template selector for letters */}
            <div>
                <label className="block font-medium mb-1">Template</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                    <div className="col-span-1">
                        {currentOrder.templateId ? (
                            (() => {
                                const sel = templates.find((t) => t._id === currentOrder.templateId);
                                return sel ? (
                                    <div className="card p-2 border rounded">
                                        {sel.previewUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={sel.previewUrl} alt={sel.name} className="w-full h-32 object-cover mb-2" />
                                        ) : (
                                            <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400 mb-2">No preview</div>
                                        )}
                                        <div className="text-sm">
                                            <div className="font-medium">{sel.name}</div>
                                            <div className="text-xs text-gray-500">Size: {sel.size}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500">Selected template not found</div>
                                );
                            })()
                        ) : (
                            <div className="w-full h-32 bg-gray-50 border rounded flex items-center justify-center text-gray-500">No template selected</div>
                        )}
                    </div>

                    <div className="col-span-2 flex items-center gap-3">
                        <button
                            className="px-3 py-1 border rounded text-sm"
                            onClick={async () => {
                                // ensure templates are loaded then navigate to templates page
                                try {
                                    await fetchTemplatesByType("letter");
                                } catch (e) { }
                                navigate("/templates?type=letter");
                            }}
                        >
                            Choose template
                        </button>

                        {currentOrder.templateId ? (
                            <>
                                <button
                                    className="px-3 py-1 border rounded text-sm"
                                    onClick={async () => {
                                        const tplId = currentOrder.templateId as string;
                                        if (!tplId) return;
                                        try {
                                            setLoadingEditor(tplId);
                                            const template = await useTemplateStore.getState().openTemplateEditor(tplId);
                                            // mirror Templates.tsx behaviour: set current order and open editor url
                                            setCurrentOrder({ templateId: template._id, designId: template.pcmDesignId || template._id, designName: template.name, designSize: template.size || currentOrder.designSize, isCustomDesign: true });
                                            window.open(template.url, "_blank");
                                        } catch (err) {
                                            console.error(err);
                                            alert(err instanceof Error ? err.message : String(err));
                                        } finally {
                                            setLoadingEditor(null);
                                        }
                                    }}
                                    disabled={loadingEditor !== null}
                                >
                                    {loadingEditor ? "Opening…" : "Personalize"}
                                </button>

                                <button
                                    className="px-3 py-1 border rounded text-sm text-red-600"
                                    onClick={() => setCurrentOrder({ templateId: undefined, designId: undefined, designName: undefined, isCustomDesign: false })}
                                >
                                    Clear
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* HTML or URL Input */}
            <div>
                <label className="block font-medium mb-1">Front (Raw HTML or URL)</label>
                <textarea
                    className="w-full border rounded p-2 mb-2"
                    placeholder="<html>...</html>"
                    value={frontHTML}
                    onChange={(e) => {
                        setFrontHTML(e.target.value);
                        setCurrentOrder({ front: e.target.value });
                    }}
                />
                {/* File upload for letter (PDF) */}
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        accept="application/pdf"
                        className="border rounded p-1"
                        onChange={async (e) => {
                            const f = e.target.files && e.target.files[0];
                            if (!f) return;
                            setUploadError(null);
                            setIsUploading(true);
                            try {
                                const fd = new FormData();
                                fd.append("letterPdf", f);
                                const res = await fetch(`${API_BASE_URL}/uploads/letter`, {
                                    method: "POST",
                                    body: fd,
                                });
                                if (!res.ok) {
                                    const err = await res.json().catch(() => ({}));
                                    throw new Error(err?.error || `Upload failed: ${res.status}`);
                                }
                                const data = await res.json();
                                setUrl(data.url);
                                setCurrentOrder({ fileUrl: data.url });
                            } catch (err) {
                                setUploadError(err instanceof Error ? err.message : String(err));
                            } finally {
                                setIsUploading(false);
                            }
                        }}
                    />
                    {isUploading ? <span className="text-sm">Uploading...</span> : null}
                    {url ? (
                        <a className="text-sm text-blue-600 ml-2" href={url} target="_blank" rel="noreferrer">View uploaded PDF</a>
                    ) : null}
                </div>
                {uploadError ? <div className="text-sm text-red-600">{uploadError}</div> : null}
            </div>

            {/* Boolean Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={currentOrder.color || false}
                        onChange={(e) => setCurrentOrder({ color: e.target.checked })}
                    />
                    Print in color
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={currentOrder.printOnBothSides || false}
                        onChange={(e) => setCurrentOrder({ printOnBothSides: e.target.checked })}
                    />
                    Print on both sides
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={currentOrder.insertAddressingPage || false}
                        onChange={(e) => setCurrentOrder({ insertAddressingPage: e.target.checked })}
                    />
                    Insert addressing page
                </label>
            </div>

            {/* Envelope Config */}
            <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-lg">Envelope Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Envelope Type</label>
                        <select
                            className="w-full border rounded p-2"
                            value={currentOrder.envelopeType || ""}
                            onChange={(e) => setCurrentOrder({ envelopeType: e.target.value as any })}
                        >
                            <option value="">Select type</option>
                            {envelopeTypes.map((t) => (
                                <option key={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Font</label>
                        <select
                            className="w-full border rounded p-2"
                            value={currentOrder.font || ""}
                            onChange={(e) => setCurrentOrder({ font: e.target.value as any })}
                        >
                            <option value="">Select font</option>
                            {envelopeFonts.map((f) => (
                                <option key={f}>{f}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Font Color</label>
                        <select
                            className="w-full border rounded p-2"
                            value={currentOrder.fontColor || ""}
                            onChange={(e) => setCurrentOrder({ fontColor: e.target.value as any })}
                        >
                            <option value="">Select color</option>
                            {fontColors.map((f) => (
                                <option key={f}>{f}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Exceptional Addressing Type</label>
                        <select
                            className="w-full border rounded p-2"
                            value={currentOrder.exceptionalAddressingType || ""}
                            onChange={(e) => setCurrentOrder({ exceptionalAddressingType: e.target.value as any })}
                        >
                            <option value="">Select type</option>
                            {exceptionalAddressingTypes.map((t) => (
                                <option key={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
