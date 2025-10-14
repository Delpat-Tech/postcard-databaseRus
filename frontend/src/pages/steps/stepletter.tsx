// ./steps/Step1Letter.tsx
import { useState } from "react";
import { useOrderStore } from "../../store/orderStore";

export default function Step1Letter() {
    const { currentOrder, setCurrentOrder } = useOrderStore();
    const [frontHTML, setFrontHTML] = useState(currentOrder.front || "");
    const [url, setUrl] = useState(currentOrder.fileUrl || "");

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
                <input
                    type="url"
                    placeholder="https://example.com/letter.pdf"
                    className="w-full border rounded p-2"
                    value={url}
                    onChange={(e) => {
                        setUrl(e.target.value);
                        setCurrentOrder({ fileUrl: e.target.value });
                    }}
                />
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
                            onChange={(e) => setCurrentOrder({ envelopeType: e.target.value })}
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
                            onChange={(e) => setCurrentOrder({ font: e.target.value })}
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
                            onChange={(e) => setCurrentOrder({ fontColor: e.target.value })}
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
                            onChange={(e) => setCurrentOrder({ exceptionalAddressingType: e.target.value })}
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
