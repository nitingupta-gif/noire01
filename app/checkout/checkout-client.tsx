"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CheckoutAddress = {
  id: string;
  fullName: string;
  mobile: string;
  house: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
};

type CheckoutForm = {
  fullName: string;
  mobile: string;
  house: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
};

type CheckoutProps = {
  items: unknown[];
  addresses: CheckoutAddress[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
};

type JsonResponse = {
  error?: string;
  id?: string;
  orderId?: string;
  keyId?: string;
  amount?: number;
  currency?: string;
  razorpayOrderId?: string;
};

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayResponse) => Promise<void> | void;
  modal: { ondismiss: () => void };
  theme: { color: string };
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

export function CheckoutClient({ items, addresses, subtotal, shipping, tax, total }: CheckoutProps) {
  const router = useRouter();
  const [selectedAddr, setSelectedAddr] = useState<string | null>(addresses[0]?.id ?? null);
  const [addingNew, setAddingNew] = useState(addresses.length === 0);
  const [form, setForm] = useState<CheckoutForm>({ fullName: "", mobile: "", house: "", street: "", city: "", state: "", pincode: "" });
  const [payment, setPayment] = useState("COD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const money = (n: number) => "₹" + (n / 100).toLocaleString("en-IN");

  const parseJsonResponse = async (res: Response): Promise<JsonResponse> => {
    const text = await res.text();
    if (!text) return {};

    try {
      return JSON.parse(text) as JsonResponse;
    } catch {
      return { error: "Something went wrong while placing the order. Please try again." };
    }
  };

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePlaceOrder = async () => {
    setError("");
    setLoading(true);

    let addressId = selectedAddr;

    if (addingNew) {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        setError(data.error || "Please check your address details");
        setLoading(false);
        return;
      }
      addressId = data.id ?? null;
    }

    if (!addressId) {
      setError("Please select or add an address");
      setLoading(false);
      return;
    }

    const orderRes = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId, paymentMethod: payment }),
    });
    const orderData = await parseJsonResponse(orderRes);
    if (!orderRes.ok) {
      setError(orderData.error || "Could not place order");
      setLoading(false);
      return;
    }

    if (payment === "COD") {
      router.push(`/order-confirmation/${orderData.orderId ?? ""}`);
      return;
    }

    // Razorpay flow
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setError("Could not load payment gateway. Check your connection.");
      setLoading(false);
      return;
    }

    const rpRes = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: orderData.orderId }),
    });
    const rpData = await parseJsonResponse(rpRes);
    if (!rpRes.ok) {
      setError(rpData.error || "Could not initiate payment");
      setLoading(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: rpData.keyId ?? "",
      amount: rpData.amount ?? 0,
      currency: rpData.currency ?? "INR",
      order_id: rpData.razorpayOrderId ?? "",
      name: "NOIRÉ",
      description: "Order payment",
      handler: async (response: RazorpayResponse) => {
        const verifyRes = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        if (verifyRes.ok) {
          router.push(`/order-confirmation/${orderData.orderId ?? ""}`);
        } else {
          setError("Payment verification failed. Contact support.");
        }
      },
      modal: {
        ondismiss: () => setLoading(false),
      },
      theme: { color: "#FF3D68" },
    });
    rzp.open();
  };

  return (
    <div suppressHydrationWarning className="max-w-[900px] mx-auto px-5 md:px-10 py-10">
      <h1 className="font-display text-3xl mb-8" style={{ color: "#211A2E" }}>Checkout</h1>

      {/* Address */}
      <div className="mb-8">
        <span className="text-sm" style={{ color: "#211A2E" }}>Delivery Address</span>
        {addresses.length > 0 && !addingNew && (
          <div className="flex flex-col gap-2 mt-3">
            {addresses.map((a: CheckoutAddress) => (
              <label key={a.id} className="p-3 flex gap-2 cursor-pointer text-sm" style={{ border: `1px solid ${selectedAddr === a.id ? "#FF3D68" : "#EDE0D0"}` }}>
                <input type="radio" checked={selectedAddr === a.id} onChange={() => setSelectedAddr(a.id)} />
                <span style={{ color: "#211A2E" }}>
                  {a.fullName} · {a.mobile}<br />
                  <span style={{ color: "#7A7086" }}>{a.house}, {a.street}, {a.city}, {a.state} - {a.pincode}</span>
                </span>
              </label>
            ))}
            <button type="button" className="text-xs self-start mt-1" style={{ color: "#FF3D68" }} onClick={() => setAddingNew(true)}>
              + Add new address
            </button>
          </div>
        )}

        {addingNew && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {([
              ["fullName", "Full Name"],
              ["mobile", "Mobile Number"],
              ["house", "House / Flat"],
              ["street", "Street / Area"],
              ["city", "City"],
              ["state", "State"],
              ["pincode", "Pincode"],
            ] as Array<[keyof CheckoutForm, string]>).map(([k, label]) => (
              <input
                key={k}
                placeholder={label}
                value={form[k]}
                onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                className="px-3 py-2.5 text-sm"
                style={{ border: "1px solid #EDE0D0" }}
              />
            ))}
            {addresses.length > 0 && (
              <button type="button" className="text-xs self-start" style={{ color: "#7A7086" }} onClick={() => setAddingNew(false)}>
                Cancel — use saved address
              </button>
            )}
          </div>
        )}
      </div>

      {/* Payment */}
      <div className="mb-8">
        <span className="text-sm" style={{ color: "#211A2E" }}>Payment Method</span>
        <div className="flex flex-col gap-2 mt-3">
          <label className="p-3 flex items-center gap-2 cursor-pointer text-sm" style={{ border: `1px solid ${payment === "COD" ? "#FF3D68" : "#EDE0D0"}` }}>
            <input type="radio" checked={payment === "COD"} onChange={() => setPayment("COD")} />
            <span style={{ color: "#211A2E" }}>Cash on Delivery</span>
          </label>
          <label className="p-3 flex items-center gap-2 cursor-pointer text-sm" style={{ border: `1px solid ${payment === "RAZORPAY" ? "#FF3D68" : "#EDE0D0"}` }}>
            <input type="radio" checked={payment === "RAZORPAY"} onChange={() => setPayment("RAZORPAY")} />
            <span style={{ color: "#211A2E" }}>Pay Online (Razorpay)</span>
          </label>
        </div>
      </div>

      {/* Order summary */}
      <div className="p-4 mb-6" style={{ border: "1px solid #EDE0D0" }}>
        <div className="flex justify-between text-sm mb-1"><span style={{ color: "#7A7086" }}>Subtotal</span><span style={{ color: "#211A2E" }}>{money(subtotal)}</span></div>
        <div className="flex justify-between text-sm mb-1"><span style={{ color: "#7A7086" }}>Shipping</span><span style={{ color: "#211A2E" }}>{shipping === 0 ? "Free" : money(shipping)}</span></div>
        <div className="flex justify-between text-sm mb-1"><span style={{ color: "#7A7086" }}>Tax</span><span style={{ color: "#211A2E" }}>{money(tax)}</span></div>
        <div className="flex justify-between text-base mt-2 pt-2" style={{ borderTop: "1px solid #EDE0D0" }}>
          <span style={{ color: "#211A2E" }}>Total</span><span style={{ color: "#211A2E" }}>{money(total)}</span>
        </div>
      </div>

      {error && <p className="text-xs mb-4" style={{ color: "#B4664F" }}>{error}</p>}

      <button
        type="button"
        onClick={handlePlaceOrder}
        disabled={loading}
        className="w-full py-4 text-xs tracking-widest disabled:opacity-50"
        style={{ background: "#FF3D68", color: "#fff" }}
      >
        {loading ? "PLACING ORDER..." : "PLACE ORDER"}
      </button>
    </div>
  );
}