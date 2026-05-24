"use client";

import { useState } from "react";

export function CalculatorWidget() {
  const [bookings, setBookings] = useState(20);
  const [avgPrice, setAvgPrice] = useState(55);

  const gross = bookings * avgPrice * 4; // monthly (×4 weeks)
  const fee   = gross * 0.08;
  const net   = gross - fee;

  return (
    <div className="bg-white border border-pebble-grey/20 rounded-[24px] p-7 shadow-subtle space-y-6">
      {/* Bookings slider */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label className="text-sm font-bold text-deep-slate">Bookings per week</label>
          <span className="font-fredoka text-2xl text-deep-slate">{bookings}</span>
        </div>
        <input
          type="range"
          min="5"
          max="60"
          value={bookings}
          onChange={(e) => setBookings(+e.target.value)}
          className="w-full accent-groomr-gold h-2"
          aria-label="Bookings per week"
        />
      </div>

      {/* Price slider */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label className="text-sm font-bold text-deep-slate">Average price per groom</label>
          <span className="font-fredoka text-2xl text-deep-slate">£{avgPrice}</span>
        </div>
        <input
          type="range"
          min="20"
          max="120"
          value={avgPrice}
          onChange={(e) => setAvgPrice(+e.target.value)}
          className="w-full accent-groomr-gold h-2"
          aria-label="Average price per groom"
        />
      </div>

      {/* Result */}
      <div className="bg-deep-slate text-alabaster-cream rounded-2xl p-6 space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-sage-leaf text-sm font-bold">You take home / month</span>
          <span className="font-fredoka text-4xl text-groomr-gold">
            £{Math.round(net).toLocaleString()}
          </span>
        </div>
        <div className="text-xs text-sage-leaf font-bold flex justify-between pt-3 border-t border-sage-leaf/30">
          <span>Groomr fee (8%)</span>
          <span>£{Math.round(fee).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
