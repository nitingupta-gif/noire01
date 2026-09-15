"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  user: { name: string | null; email: string };
  address: { city: string; state: string; pincode: string };
  items: { quantity: number; product: { name: string } }[];
};

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  salePrice: number | null;
  stock: number;
  published: boolean;
  category: { name: string };
};

const statuses = ["ORDER_PLACED", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"];
const money = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

export function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState({ total: 0, revenue: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    const [ordersRes, productsRes] = await Promise.all([
      fetch("/api/admin/orders?limit=100"),
      fetch("/api/admin/products?page=1"),
    ]);
    if (ordersRes.ok && productsRes.ok) {
      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();
      setOrders(ordersData.orders);
      setProducts(productsData.products);
      setSummary({ total: ordersData.total, revenue: ordersData.summary.revenue, pending: ordersData.summary.pending });
    }
    setLoading(false);
  };

  useEffect(() => {
    void Promise.resolve().then(loadDashboard);
  }, []);

  const updateOrder = async (id: string, status: string) => {
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (response.ok) {
      setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
      setMessage("Order status updated");
    }
  };

  const updateProduct = async (product: Product, field: "price" | "salePrice" | "stock", value: string) => {
    const numericValue = value === "" ? null : Math.round(Number(value) * (field === "stock" ? 1 : 100));
    if (numericValue !== null && Number.isNaN(numericValue)) return;
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: numericValue }),
    });
    if (response.ok) {
      const updated = await response.json();
      setProducts((current) => current.map((item) => item.id === product.id ? updated : item));
      setMessage(`${product.name} updated`);
    }
  };

  const togglePublished = async (product: Product) => {
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !product.published }),
    });
    if (response.ok) {
      const updated = await response.json();
      setProducts((current) => current.map((item) => item.id === product.id ? updated : item));
    }
  };

  return (
    <main className="admin-shell mx-auto min-h-screen max-w-[1440px] px-5 py-10 md:px-10">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="admin-kicker">NOIRÉ CONTROL ROOM</p>
          <h1 className="font-display text-4xl">Admin dashboard</h1>
          <p className="mt-2 text-sm admin-muted">Orders, revenue and catalogue management in one place.</p>
        </div>
        <button className="admin-refresh" onClick={loadDashboard}>Refresh data</button>
      </div>

      {message && <p className="admin-message">{message}</p>}
      <div className="admin-stats">
        <div><span>Total orders</span><strong>{summary.total}</strong></div>
        <div><span>Gross revenue</span><strong>{money(summary.revenue)}</strong></div>
        <div><span>Needs action</span><strong>{summary.pending}</strong></div>
        <div><span>Products loaded</span><strong>{products.length}</strong></div>
      </div>

      <section className="admin-section">
        <div className="admin-section-heading"><div><p className="admin-kicker">FULFILMENT</p><h2>Recent orders</h2></div><span>{orders.length} shown</span></div>
        {loading ? <p className="admin-muted">Loading orders...</p> : orders.length === 0 ? <p className="admin-muted">No orders yet.</p> : (
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>
            {orders.map((order) => <tr key={order.id}><td><strong>{order.orderNumber}</strong><small>{new Date(order.createdAt).toLocaleString("en-IN")}</small></td><td>{order.user.name || "Guest"}<small>{order.user.email}</small><small>{order.address.city}, {order.address.state}</small></td><td>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items<small>{order.paymentMethod} · {order.paymentStatus}</small></td><td>{money(order.total)}</td><td><select value={order.status} onChange={(event) => updateOrder(order.id, event.target.value)}>{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></td></tr>)}
          </tbody></table></div>
        )}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading"><div><p className="admin-kicker">CATALOGUE</p><h2>Products and pricing</h2></div><span>Edit values in rupees</span></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Price</th><th>Sale price</th><th>Stock</th><th>Store</th></tr></thead><tbody>
          {products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><small>{product.category.name} · {product.sku}</small></td><td><input className="admin-input" type="number" defaultValue={product.price / 100} onBlur={(event) => updateProduct(product, "price", event.target.value)} /></td><td><input className="admin-input" type="number" placeholder="None" defaultValue={product.salePrice ? product.salePrice / 100 : ""} onBlur={(event) => updateProduct(product, "salePrice", event.target.value)} /></td><td><input className="admin-input admin-stock" type="number" defaultValue={product.stock} onBlur={(event) => updateProduct(product, "stock", event.target.value)} /></td><td><button className={`admin-toggle ${product.published ? "is-live" : ""}`} onClick={() => togglePublished(product)}>{product.published ? "Live" : "Hidden"}</button></td></tr>)}
        </tbody></table></div>
      </section>
    </main>
  );
}
