"use client";

import { useState } from "react";

interface MockCard {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
}

const INITIAL_CARDS: MockCard[] = [
  { id: "1", brand: "Visa", last4: "4242", expiry: "08/27", isDefault: true },
];

function CardIcon() {
  return (
    <svg className="w-8 h-5 text-pebble-grey" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="20" rx="3" fill="currentColor" opacity="0.15" />
      <rect y="5" width="32" height="5" fill="currentColor" opacity="0.4" />
      <rect x="3" y="13" width="6" height="3" rx="1" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function AddCardForm({ onSave, onCancel }: { onSave: (card: MockCard) => void; onCancel: () => void }) {
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");

  function formatNumber(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const last4 = number.replace(/\s/g, "").slice(-4);
    const brand = number.startsWith("4") ? "Visa" : number.startsWith("5") ? "Mastercard" : "Card";
    onSave({ id: Date.now().toString(), brand, last4, expiry, isDefault: false });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4 p-4 border border-pebble-grey/20 rounded-xl bg-alabaster-cream">
      <p className="font-bold text-sm text-deep-slate">Add new card</p>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-deep-slate">Name on card</label>
        <input
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="J. Smith"
          className="w-full border border-pebble-grey/30 rounded-lg px-3 py-2 text-sm font-nunito text-deep-slate focus:outline-none focus:ring-2 focus:ring-groomr-gold"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-bold text-deep-slate">Card number</label>
        <input
          required
          value={number}
          onChange={e => setNumber(formatNumber(e.target.value))}
          placeholder="1234 5678 9012 3456"
          className="w-full border border-pebble-grey/30 rounded-lg px-3 py-2 text-sm font-nunito text-deep-slate focus:outline-none focus:ring-2 focus:ring-groomr-gold"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-deep-slate">Expiry</label>
          <input
            required
            value={expiry}
            onChange={e => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/YY"
            className="w-full border border-pebble-grey/30 rounded-lg px-3 py-2 text-sm font-nunito text-deep-slate focus:outline-none focus:ring-2 focus:ring-groomr-gold"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-bold text-deep-slate">CVC</label>
          <input
            required
            value={cvc}
            onChange={e => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="123"
            className="w-full border border-pebble-grey/30 rounded-lg px-3 py-2 text-sm font-nunito text-deep-slate focus:outline-none focus:ring-2 focus:ring-groomr-gold"
          />
        </div>
      </div>

      <p className="text-xs text-pebble-grey flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Your card details are encrypted and stored securely.
      </p>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 bg-groomr-gold text-deep-slate font-nunito font-bold text-sm py-2 rounded-full hover:bg-[#d4ce4a] transition-colors"
        >
          Save card
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-pebble-grey/30 text-pebble-grey font-nunito font-bold text-sm py-2 rounded-full hover:border-deep-slate hover:text-deep-slate transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function PaymentMethodsPage() {
  const [cards, setCards] = useState<MockCard[]>(INITIAL_CARDS);
  const [adding, setAdding] = useState(false);

  function handleSave(card: MockCard) {
    setCards(prev => [...prev, card]);
    setAdding(false);
  }

  function handleRemove(id: string) {
    setCards(prev => prev.filter(c => c.id !== id));
  }

  function handleSetDefault(id: string) {
    setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id })));
  }

  return (
    <div className="font-nunito">
      <h1 className="font-fredoka text-2xl text-deep-slate mb-1">Payment Methods</h1>
      <p className="text-sm text-pebble-grey mb-6">Manage the cards used to pay for bookings.</p>

      <div className="space-y-3">
        {cards.map(card => (
          <div key={card.id} className="flex items-center justify-between gap-4 p-4 border border-pebble-grey/20 rounded-xl bg-white">
            <div className="flex items-center gap-3">
              <CardIcon />
              <div>
                <p className="text-sm font-bold text-deep-slate">
                  {card.brand} •••• {card.last4}
                  {card.isDefault && (
                    <span className="ml-2 text-xs font-bold text-sage-leaf bg-sage-leaf/10 px-2 py-0.5 rounded-full">Default</span>
                  )}
                </p>
                <p className="text-xs text-pebble-grey">Expires {card.expiry}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {!card.isDefault && (
                <button
                  onClick={() => handleSetDefault(card.id)}
                  className="text-xs text-pebble-grey hover:text-deep-slate transition-colors font-bold"
                >
                  Set default
                </button>
              )}
              <button
                onClick={() => handleRemove(card.id)}
                className="text-xs text-muted-terracotta hover:underline font-bold"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        {cards.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-pebble-grey/20 rounded-xl">
            <p className="text-sm text-pebble-grey">No payment methods saved yet.</p>
          </div>
        )}
      </div>

      {adding ? (
        <AddCardForm onSave={handleSave} onCancel={() => setAdding(false)} />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-4 w-full border-2 border-dashed border-pebble-grey/20 rounded-xl py-3 text-sm font-bold text-pebble-grey hover:border-sage-leaf/40 hover:text-sage-leaf transition-colors"
        >
          + Add card
        </button>
      )}
    </div>
  );
}
