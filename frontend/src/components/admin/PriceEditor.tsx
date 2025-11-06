import { useEffect, useState } from "react";
import { useAdminStore } from "../../store/adminStore";
import { Button } from "../../components/FormComponents";

type Rule = {
    sizeKey: string;
    sizeLabel?: string;
    mailClass: "FirstClass" | "Standard";
    one: number;
    twoTo99: number;
    hundredUp: number;
};

const TYPES = ["postcard", "letter"] as const; //, "brochure", "bookmark"
// mapping of size keys to labels
const SIZE_OPTIONS: Record<string, string> = {
    "46": "4.25 x 6",
    "58": "5 x 8",
    "68": "6 x 8.5",
    "69": "6 x 9",
    "611": "6 x 11",
    "811": "8.5 x 11",
    "BRO": "Brochure",
};

export default function PriceEditor() {
    const { fetchPrices, updatePrices } = useAdminStore();
    const [type, setType] = useState<typeof TYPES[number]>("postcard");
    const [rules, setRules] = useState<Rule[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // form fields
    const [sizeKey, setSizeKey] = useState("");
    const [sizeLabel, setSizeLabel] = useState("");
    const [mailClass, setMailClass] = useState<Rule["mailClass"]>("FirstClass");
    const [one, setOne] = useState<number>(0);
    const [twoTo99, setTwoTo99] = useState<number>(0);
    const [hundredUp, setHundredUp] = useState<number>(0);

    useEffect(() => {
        (async () => {
            try {
                const p = await fetchPrices(type);
                const arr = p?.pricing || [];
                setRules(arr);
            } catch (e) {
                setRules([]);
            }
        })();
    }, [type, fetchPrices]);

    const resetForm = () => {
        setSizeKey("");
        setSizeLabel("");
        setMailClass("FirstClass");
        setOne(0);
        setTwoTo99(0);
        setHundredUp(0);
        setEditingIndex(null);
    };

    const handleAddOrUpdate = () => {
        if (!sizeKey) return alert("sizeKey is required");
        
        // Check for duplicate rule (only when adding new, not editing)
        if (editingIndex === null) {
            const duplicate = rules.find(r => r.sizeKey === sizeKey && r.mailClass === mailClass);
            if (duplicate) {
                return alert(
                    `⚠️ Duplicate Rule Detected\n\n` +
                    `A pricing rule for "${sizeLabel || sizeKey}" with "${mailClass}" mail class already exists.\n\n` +
                    `Current prices: $${duplicate.one} (1) / $${duplicate.twoTo99} (2-99) / $${duplicate.hundredUp} (100+)\n\n` +
                    `Please edit the existing rule instead of adding a new one.`
                );
            }
        }
        
        const newRule: Rule = { sizeKey, sizeLabel, mailClass, one, twoTo99, hundredUp };
        setRules((prev) => {
            const copy = [...prev];
            if (editingIndex !== null && editingIndex >= 0 && editingIndex < copy.length) {
                copy[editingIndex] = newRule;
            } else {
                copy.push(newRule);
            }
            return copy;
        });
        resetForm();
    };

    const handleEdit = (idx: number) => {
        const r = rules[idx];
        if (!r) return;
        setEditingIndex(idx);
        setSizeKey(r.sizeKey);
        setSizeLabel(r.sizeLabel || "");
        setMailClass(r.mailClass);
        setOne(r.one);
        setTwoTo99(r.twoTo99);
        setHundredUp(r.hundredUp);
    };

    const handleDelete = (idx: number) => {
        if (!window.confirm("Remove this pricing rule?")) return;
        setRules((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSaveAll = async () => {
        try {
            await updatePrices(type, { pricing: rules });
            alert("Saved pricing rules");
        } catch (e) {
            console.error(e);
            alert("Failed to save rules: " + (e instanceof Error ? e.message : String(e)));
        }
    };

    return (
        <div className="p-4 bg-white rounded border grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* left: editor form */}
            <div className="col-span-1 space-y-3">
                <div className="flex items-center space-x-2">
                    <label className="text-sm">Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value as any)} className="border rounded px-2 py-1">
                        {TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-sm block">Size Key</label>
                    <select
                        value={sizeKey}
                        onChange={(e) => {
                            const key = e.target.value;
                            setSizeKey(key);
                            setSizeLabel(SIZE_OPTIONS[key] || "");
                        }}
                        className="border rounded px-2 py-1 w-full"
                    >
                        <option value="">Select size key</option>
                        {Object.entries(SIZE_OPTIONS).map(([key, label]) => (
                            <option key={key} value={key}>
                                {key} — {label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-sm block">Size Label</label>
                    <input
                        value={sizeLabel}
                        readOnly
                        className="border rounded px-2 py-1 w-full bg-gray-100 text-gray-700"
                        placeholder="Auto-filled"
                    />
                </div>


                <div>
                    <label className="text-sm block">Mail Class</label>
                    <select value={mailClass} onChange={(e) => setMailClass(e.target.value as any)} className="border rounded px-2 py-1">
                        <option value="FirstClass">FirstClass</option>
                        <option value="Standard">Standard</option>
                    </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className="text-sm block">One</label>
                        <input type="number" value={one} onChange={(e) => setOne(Number(e.target.value))} className="border rounded px-2 py-1 w-full" />
                    </div>
                    <div>
                        <label className="text-sm block">2-99</label>
                        <input type="number" value={twoTo99} onChange={(e) => setTwoTo99(Number(e.target.value))} className="border rounded px-2 py-1 w-full" />
                    </div>
                    <div>
                        <label className="text-sm block">100+</label>
                        <input type="number" value={hundredUp} onChange={(e) => setHundredUp(Number(e.target.value))} className="border rounded px-2 py-1 w-full" />
                    </div>
                </div>

                <div className="flex space-x-2">
                    <Button onClick={handleAddOrUpdate}>{editingIndex !== null ? "Update Rule" : "Add Rule"}</Button>
                    <Button variant="secondary" onClick={resetForm}>Reset</Button>
                    <Button variant="primary" onClick={handleSaveAll}>Save All</Button>
                </div>
            </div>

            {/* right: rules table (spans 2 cols on large) */}
            <div className="col-span-1 lg:col-span-2 overflow-auto">
                <h4 className="font-semibold mb-2">Rules for {type}</h4>
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="text-left">
                            <th className="p-2 border-b">Size Key</th>
                            <th className="p-2 border-b">Size Label</th>
                            <th className="p-2 border-b">Mail Class</th>
                            <th className="p-2 border-b">One</th>
                            <th className="p-2 border-b">2-99</th>
                            <th className="p-2 border-b">100+</th>
                            <th className="p-2 border-b">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rules.map((r, idx) => (
                            <tr key={`${r.sizeKey}-${r.mailClass}-${idx}`} className="border-b">
                                <td className="p-2">{r.sizeKey}</td>
                                <td className="p-2">{r.sizeLabel || "-"}</td>
                                <td className="p-2">{r.mailClass}</td>
                                <td className="p-2">{r.one}</td>
                                <td className="p-2">{r.twoTo99}</td>
                                <td className="p-2">{r.hundredUp}</td>
                                <td className="p-2">
                                    <div className="flex space-x-2">
                                        <Button variant="secondary" onClick={() => handleEdit(idx)}>Edit</Button>
                                        <Button variant="danger" onClick={() => handleDelete(idx)}>Delete</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {rules.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-4 text-center text-gray-500">No rules defined for this type yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
