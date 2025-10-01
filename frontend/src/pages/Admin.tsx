type Order = { id: number; user: string; product: string; status: string };

export default function Admin() {
  const orders: Order[] = [
    { id: 1, user: "Jane Doe", product: "6x9 Postcard", status: "pending" },
    { id: 2, user: "Acme Inc.", product: "8.5x11 Letter", status: "pending" },
  ];
  return (
    <div>
      <h2>Admin Dashboard</h2>
      {orders.map((o) => (
        <div key={o.id} className="card">
          <h3>Order #{o.id}</h3>
          <p>User: {o.user}</p>
          <p>Product: {o.product}</p>
          <p>Status: {o.status}</p>
          <button>Approve</button>
        </div>
      ))}
    </div>
  );
}


