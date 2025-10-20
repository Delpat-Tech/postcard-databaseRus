import { useState } from "react";
import { useAdminStore } from "../../store/adminStore";
import { Button, Card } from "../../components/FormComponents";

export default function TemplatesPanel() {
    const {
        templates,
        fetchAllTemplates,
        toggleTemplateVisibility,
    } = useAdminStore();

    const [templateFilter, setTemplateFilter] = useState<"all" | "public" | "private">("all");

    const filteredTemplates = templates.filter((t) =>
        templateFilter === "all"
            ? true
            : templateFilter === "public"
                ? t.isPublic
                : !t.isPublic
    );

    const handleImportDesigns = async () => {
        try {
            await useAdminStore.getState().importDesigns();
            await fetchAllTemplates();
            setTemplateFilter("all");
            alert("Import complete");
        } catch (e) {
            console.error(e);
            alert("Import failed: " + (e instanceof Error ? e.message : String(e)));
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Template Management</h2>
                <div className="flex items-center space-x-3">
                    {/* Filter Buttons */}
                    <div className="flex space-x-1 bg-white rounded-md overflow-hidden border">
                        {["all", "public", "private"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setTemplateFilter(f as any)}
                                className={`px-3 py-1 text-sm ${templateFilter === f
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Refresh */}
                    <Button
                        onClick={async () => {
                            try {
                                await fetchAllTemplates();
                                alert("Templates refreshed");
                            } catch (e) {
                                console.error(e);
                                alert("Failed to refresh templates");
                            }
                        }}
                        variant="secondary"
                        className="text-sm"
                    >
                        Refresh
                    </Button>

                    {/* Import */}
                    <Button onClick={handleImportDesigns} className="text-sm">
                        Import Designs
                    </Button>
                </div>
            </div>

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
                <Card className="text-center py-12">
                    <p className="text-gray-500">No templates found</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => (
                        <Card
                            key={template._id}
                            className="hover:shadow-lg transition-shadow"
                        >
                            {/* Thumbnail */}
                            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                                {template.previewUrl ? (
                                    <img
                                        src={template.previewUrl}
                                        alt={template.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <svg
                                        className="w-12 h-12 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                )}
                            </div>

                            {/* Info */}
                            <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                            <p className="text-gray-600 text-sm mb-4">Size: {template.size}</p>

                            {/* Footer */}
                            <div className="flex items-center justify-between">
                                <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${template.isPublic
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                        }`}
                                >
                                    {template.isPublic ? "Public" : "Private"}
                                </span>

                                <Button
                                    onClick={() => toggleTemplateVisibility(template._id)}
                                    variant={template.isPublic ? "secondary" : "primary"}
                                    className="text-sm"
                                >
                                    {template.isPublic ? "Make Private" : "Make Public"}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
