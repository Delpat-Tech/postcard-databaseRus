import { useEffect, useState } from "react";
import { useOrderStore } from "../store/orderStore";
import { useNavigate } from "react-router-dom";

export default function Templates() {
  const { templates, fetchTemplates, isLoading, setCurrentOrder } = useOrderStore();
  const navigate = useNavigate();
  const [loadingEditor, setLoadingEditor] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates().catch((e) => console.error(e));
  }, [fetchTemplates]);

  const openEditor = async (templateId: string) => {
    try {
      setLoadingEditor(templateId);
      const url = await useOrderStore.getState().openTemplateEditor(templateId);
      window.open(url, "_blank");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingEditor(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Select a template</h2>
              <p className="text-sm text-gray-500">Step 1 — Choose a template for your postcard</p>
            </div>
            <div>
              <button onClick={() => navigate('/order')} className="px-3 py-2 border rounded">Back</button>
            </div>
          </div>

          {isLoading && <p>Loading templates...</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t) => (
              <div key={t._id} className="card p-4 border rounded">
                {t.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.previewUrl} alt={t.name} className="w-full h-auto" />
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">No preview</div>
                )}
                <div className="mt-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{t.name}</h3>
                      <p className="text-sm text-gray-500">Size: {t.size}</p>
                    </div>
                    <div>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${t.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {t.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => {
                        // set order design to this template (store DB _id and pcmDesignId)
                        setCurrentOrder({ templateId: t._id, designId: t.pcmDesignId || t._id, designName: t.name, designSize: t.size, isCustomDesign: false });
                        navigate('/order');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Select
                    </button>

                    <button
                      onClick={() => openEditor(t._id)}
                      className="px-4 py-2 border rounded text-blue-600 hover:bg-gray-50"
                      disabled={loadingEditor === t._id}
                    >
                      {loadingEditor === t._id ? "Opening…" : "Personalize"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


