import * as React from 'react';

export function RepairedPricingCard() {
  return (
    <article
      className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-foreground"
      style={{ transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Studio Plan
        </h2>
        <img alt="" aria-hidden="true" src="/plan-badge.png" className="h-8 w-8 rounded-lg" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Experience seamless performance built for digital scale.
      </p>
      <div className="mt-6">
        <button className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-[44px] min-w-[44px] px-3 py-2 bg-primary text-primary-foreground rounded-xl font-medium">
          Select Studio Plan
        </button>
      </div>
    </article>
  );
}
