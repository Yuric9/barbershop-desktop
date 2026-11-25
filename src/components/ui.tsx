import type { ReactNode } from "react";
export function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card kpi">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

/** Campo com rótulo fixo em cima: o texto não some quando a pessoa começa a digitar. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
