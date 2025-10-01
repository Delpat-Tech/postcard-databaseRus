import { Link } from "react-router-dom";

type Template = { id: number; name: string; previewUrl: string };

const templates: Template[] = [
  {
    id: 1,
    name: "Modern Blue",
    previewUrl: "https://via.placeholder.com/300x200?text=Modern+Blue",
  },
  {
    id: 2,
    name: "Minimal White",
    previewUrl: "https://via.placeholder.com/300x200?text=Minimal+White",
  },
];

export default function Templates() {
  return (
    <div>
      <h2>Select a Template</h2>
      {templates.map((t) => (
        <div key={t.id} className="card">
          <img src={t.previewUrl} alt={t.name} style={{ maxWidth: "100%" }} />
          <h3>{t.name}</h3>
          <Link to={`/design/${t.id}`}>Personalize</Link>
        </div>
      ))}
    </div>
  );
}


