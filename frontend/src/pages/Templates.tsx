import { useEffect, useState } from "react";
import { useOrderStore } from "../store/orderStore";
import { useNavigate, useLocation } from "react-router-dom";
import { useTemplateStore } from "../store/templateStore";
import { usePublicStore } from "../store/publicStore";

export default function Templates() {
  const { isLoading, setCurrentOrder } = useOrderStore();
  // public templates/prices are now served by publicStore
  const { templates, fetchTemplatesByType } = useTemplateStore();
  const { fetchPricesByType } = usePublicStore();

  const location = useLocation();
  const q = new URLSearchParams(location.search);
  const pageType = (q.get("type") || "postcard");
  const [pricingRules, setPricingRules] = useState<any[]>([]);

  const navigate = useNavigate();
  const [loadingEditor, setLoadingEditor] = useState<string | null>(null);
  // Pricing definitions

  useEffect(() => {
    (async () => {
      try {
        await fetchTemplatesByType(pageType);
      } catch (e) {
        console.error(e);
      }

      try {
        const data = await fetchPricesByType(pageType);
        setPricingRules(data?.pricing || []);
      } catch (e) {
        // ignore
      }
    })();
  }, [fetchTemplatesByType, pageType]);

  const openEditor = async (templateId: string) => {
    try {
      setLoadingEditor(templateId);
      const template = await useTemplateStore.getState().openTemplateEditor(templateId);

      setCurrentOrder({ templateId: template._id, designId: template.pcmDesignId || template._id, designName: template.name, designSize: pricingRules.find(p => p.sizeLabel === template.size)?.sizeKey, isCustomDesign: true });
      navigate('/order');

      window.open(template.url, "_blank");
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
                        setCurrentOrder({ templateId: t._id, designId: t.pcmDesignId || t._id, designName: t.name, designSize: pricingRules.find(p => p.sizeLabel === t.size)?.sizeKey, isCustomDesign: false });
                        navigate(`/order?step=1&type=${encodeURIComponent(pageType)}`);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Select
                    </button>

                    {t.allowPersonalize !== false && (
                      <button
                        onClick={() => openEditor(t._id)}
                        className="px-4 py-2 border rounded text-blue-600 hover:bg-gray-50"
                        disabled={loadingEditor === t._id}
                      >
                        {loadingEditor === t._id ? "Opening…" : "Personalize"}
                      </button>
                    )}
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


