import { useState, useEffect } from "react";
import { useAdminStore } from "../../store/adminStore";
import { Button, Card } from "../../components/FormComponents";

export default function TemplatesPanel() {
  const { templates, fetchAllTemplates, toggleTemplateVisibility } =
    useAdminStore();

  const { deleteTemplateSoft, deleteTemplateExternal } = useAdminStore();

  const [templateFilter, setTemplateFilter] = useState<
    "all" | "public" | "private"
  >("all");
  const [openDeleteFor, setOpenDeleteFor] = useState<string | null>(null);

  // close delete popover when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (!openDeleteFor) return;
      const pop = document.querySelector(
        `[data-delete-popover-id="${openDeleteFor}"]`
      );
      const btn = document.querySelector(
        `[data-delete-button-id="${openDeleteFor}"]`
      );
      const target = e.target as Node;
      if (pop && pop.contains(target)) return;
      if (btn && btn.contains(target)) return;
      setOpenDeleteFor(null);
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenDeleteFor(null);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [openDeleteFor]);

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
                className={`px-3 py-1 text-sm ${
                  templateFilter === f
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
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

              {/* Top toggles: public/private (left) and personalize (right) */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.isPublic
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {template.isPublic ? "Public" : "Private"}
                  </span>

                  <label
                    className="flex items-center space-x-2 cursor-pointer"
                    title={template.isPublic ? "Make Private" : "Make Public"}
                  >
                    <input
                      type="checkbox"
                      checked={!!template.isPublic}
                      onChange={() => toggleTemplateVisibility(template._id)}
                      className="sr-only"
                      aria-label={
                        template.isPublic
                          ? `Make ${template.name} private`
                          : `Make ${template.name} public`
                      }
                    />
                    <div
                      className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${
                        template.isPublic ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                          template.isPublic ? "translate-x-5" : ""
                        }`}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-700">
                      {template.isPublic ? "Public" : "Private"}
                    </span>
                  </label>
                </div>

                <div>
                  <label
                    className="flex items-center space-x-2 cursor-pointer"
                    title={
                      template.allowPersonalize
                        ? "Disable Personalize"
                        : "Enable Personalize"
                    }
                  >
                    <input
                      type="checkbox"
                      checked={!!template.allowPersonalize}
                      onChange={async (e) => {
                        const val = (e.target as HTMLInputElement).checked;
                        try {
                          await useAdminStore
                            .getState()
                            .setTemplatePersonalize(template._id, val);
                          await fetchAllTemplates();
                          alert(`Template personalize set to ${val}`);
                        } catch (err) {
                          console.error(err);
                          alert("Failed to toggle personalize");
                        }
                      }}
                      className="sr-only"
                      aria-label={
                        template.allowPersonalize
                          ? `Disable personalize for ${template.name}`
                          : `Enable personalize for ${template.name}`
                      }
                    />
                    <div
                      className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${
                        template.allowPersonalize
                          ? "bg-indigo-600"
                          : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                          template.allowPersonalize ? "translate-x-5" : ""
                        }`}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-700">
                      {template.allowPersonalize
                        ? "Personalize On"
                        : "Personalize"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Info */}
              <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
              <p className="text-gray-600 text-sm mb-4">
                Size: {template.size}
              </p>

              {/* Footer: Set Type (left) and Delete (right) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <label className="text-sm text-gray-600 mr-1">Set Type</label>
                  <select
                    value={template.type || "postcard"}
                    onChange={async (e) => {
                      const newType = e.target.value;
                      try {
                        await useAdminStore
                          .getState()
                          .setTemplateType(template._id, newType);
                        alert("Template type updated");
                        await fetchAllTemplates();
                      } catch (err) {
                        console.error(err);
                        alert("Failed to set template type");
                      }
                    }}
                    className="border rounded px-2 py-1 text-sm w-28 bg-white appearance-none"
                    aria-label={`Set type for ${template.name}`}
                  >
                    <option value="postcard">Postcard</option>
                    <option value="letter">Letter</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenDeleteFor(
                          openDeleteFor === template._id ? null : template._id
                        )
                      }
                      className="flex items-center gap-2 px-3 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                      title={`Delete`}
                      aria-label={`Delete template ${template.name}`}
                      data-delete-button-id={template._id}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">Delete</span>
                    </button>

                    {openDeleteFor === template._id && (
                      <div
                        data-delete-popover-id={template._id}
                        className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md z-10"
                      >
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                          onClick={async () => {
                            const ok = window.confirm(
                              "This will temporarily remove the template from the app (soft-delete). You can re-import later. Continue?"
                            );
                            if (!ok) return;
                            try {
                              await deleteTemplateSoft(template._id);
                              setOpenDeleteFor(null);
                              await fetchAllTemplates();
                              alert("Template temporarily removed");
                            } catch (e) {
                              console.error(e);
                              alert(
                                "Failed to remove template: " +
                                  (e instanceof Error ? e.message : String(e))
                              );
                            }
                          }}
                        >
                          Delete (DB)
                        </button>
                        <div className="border-t" />
                        <button
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                          onClick={async () => {
                            const ok = window.confirm(
                              "PERMANENT: This will delete the design from PostcardMania and remove it from the database. This cannot be undone. Continue?"
                            );
                            if (!ok) return;
                            try {
                              await deleteTemplateExternal(template._id);
                              setOpenDeleteFor(null);
                              await fetchAllTemplates();
                              alert(
                                "Template permanently deleted from PostcardMania and DB"
                              );
                            } catch (e) {
                              console.error(e);
                              alert(
                                "Failed to permanently delete template: " +
                                  (e instanceof Error ? e.message : String(e))
                              );
                            }
                          }}
                        >
                          Delete (PostcardMania)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
