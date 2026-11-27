import { FormEvent } from "react";
import type { Appointment } from "../desktop-api";
import { money } from "../lib/format";

export function FinishDrawer({
  item,
  onClose,
  onSubmit,
}: {
  item: Appointment;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="drawer compact-drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2>Finalizar atendimento</h2>
          <button type="button" onClick={onClose} aria-label="Fechar">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="checkout-total">
          <span>{item.clientName}</span>
          <b>{money(item.totalCents)}</b>
          <small>{item.serviceNames}</small>
        </div>
        <form className="drawer-form" onSubmit={(e) => void onSubmit(e)}>
          <label>
            Forma de pagamento
            <select name="paymentMethod" defaultValue="Dinheiro">
              <option>Dinheiro</option>
              <option>Pix</option>
              <option>Débito</option>
              <option>Crédito</option>
            </select>
          </label>
          <button className="primary">Finalizar e lançar no Caixa</button>
        </form>
      </aside>
    </div>
  );
}
