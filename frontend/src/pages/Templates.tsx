import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useOrderStore } from "../store/orderStore";

export default function Templates() {
  const { templates, fetchTemplates, isLoading } = useOrderStore();

  useEffect(() => {
    fetchTemplates().catch((e) => console.error(e));
  }, [fetchTemplates]);

  return (
    <div>
      <h2>Select a Template</h2>
      {isLoading && <p>Loading templates...</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((t) => (
          <div key={t._id} className="card p-4 border rounded">
            <img src={t.previewUrl} alt={t.name} className="w-full h-auto" />
            <h3 className="mt-2 font-semibold">{t.name}</h3>
            <p className="text-sm text-gray-500">Size: {t.size}</p>
            <Link to={`/design/${t._id}`} className="text-blue-600">
              Personalize
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}


