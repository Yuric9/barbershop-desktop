import { FormEvent, useState } from "react";
import type { Client, Service, Staff } from "../desktop-api";
import { desktopApi } from "../desktop-api";
import type { EditTarget } from "../app-types";

// Nome que aparece no título da gaveta para cada tipo de registro.
const kindTitle: Record<EditTarget["kind"], string> = {
  client: "cliente",
  service: "serviço",
  staff: "colaborador",
  product: "produto",
  cash: "lançamento",
  appointment: "agendamento",
};

export function EditDrawer({
  target,
  clients,
  services,
  staff,
  onClose,
  onSaved,
}: {
  target: EditTarget;
  clients: Client[];
  services: Service[];
  staff: Staff[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [chosen, setChosen] = useState<number[]>(
      target.kind === "appointment"
        ? services.filter((s) => target.item.serviceNames.split(" + ").includes(s.name)).map((s) => s.id)
        : [],
    ),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setErr("");
    try {
      if (target.kind === "client")
        await desktopApi.updateClient({
          id: target.item.id,
          name: String(f.get("name") || ""),
          phone: String(f.get("phone") || ""),
          birthDate: String(f.get("birthDate") || ""),
        });
      if (target.kind === "service")
        await desktopApi.updateService({
          id: target.item.id,
          name: String(f.get("name") || ""),
          priceCents: Math.round(Number(f.get("price")) * 100),
          durationMin: Number(f.get("durationMin")),
        });
      if (target.kind === "staff")
        await desktopApi.updateStaff({
          id: target.item.id,
          name: String(f.get("name") || ""),
          phone: String(f.get("phone") || ""),
          commissionPercent: Number(f.get("commission")),
          productCommissionPercent: Number(f.get("productCommission")),
        });
      if (target.kind === "product")
        await desktopApi.updateProduct({
          id: target.item.id,
          name: String(f.get("name") || ""),
          description: String(f.get("description") || ""),
          priceCents: Math.round(Number(f.get("price")) * 100),
        });
      if (target.kind === "cash")
        await desktopApi.updateCashTransaction({
          id: target.item.id,
          description: String(f.get("description") || ""),
          amountCents: Math.round(Number(f.get("amount")) * 100),
          date: String(f.get("date")),
          paymentMethod: String(f.get("paymentMethod") || ""),
          clientId: Number(f.get("clientId") || 0) || null,
          staffId: Number(f.get("staffId") || 0) || null,
        });
      if (target.kind === "appointment") {
        const clientId = Number(f.get("clientId") || 0) || null,
          client = clients.find((c) => c.id === clientId);
        await desktopApi.editAppointment({
          id: target.item.id,
          clientId,
          clientName: client?.name || String(f.get("clientName") || ""),
          phone: client?.phone || String(f.get("phone") || ""),
          staffId: Number(f.get("staffId") || 0) || null,
          serviceIds: chosen,
          date: String(f.get("date")),
          time: String(f.get("time")),
          note: String(f.get("note") || ""),
        });
      }
      await onSaved();
    } catch (x) {
      setErr(String(x));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2>Editar {kindTitle[target.kind]}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        {err && (
          <div className="error" role="alert">
            {err}
          </div>
        )}
        <form className="drawer-form" onSubmit={submit}>
          {target.kind === "client" && (
            <>
              <label>
                Nome
                <input name="name" defaultValue={target.item.name} />
              </label>
              <label>
                Telefone
                <input name="phone" type="tel" autoComplete="tel" defaultValue={target.item.phone} />
              </label>
              <label>
                Aniversário
                <input name="birthDate" type="date" defaultValue={target.item.birthDate} />
              </label>
            </>
          )}
          {target.kind === "service" && (
            <>
              <label>
                Nome
                <input name="name" defaultValue={target.item.name} />
              </label>
              <label>
                Preço
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={(target.item.priceCents / 100).toFixed(2)}
                />
              </label>
              <label>
                Duração
                <input name="durationMin" type="number" defaultValue={target.item.durationMin} />
              </label>
            </>
          )}
          {target.kind === "staff" && (
            <>
              <label>
                Nome
                <input name="name" defaultValue={target.item.name} />
              </label>
              <label>
                Telefone
                <input name="phone" type="tel" autoComplete="tel" defaultValue={target.item.phone} />
              </label>
              <label>
                Comissão serviços %
                <input
                  name="commission"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={target.item.commissionPercent}
                />
              </label>
              <label>
                Comissão produtos %
                <input
                  name="productCommission"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={target.item.productCommissionPercent}
                />
              </label>
            </>
          )}
          {target.kind === "product" && (
            <>
              <label>
                Nome
                <input name="name" defaultValue={target.item.name} />
              </label>
              <label>
                Descrição
                <input name="description" defaultValue={target.item.description} />
              </label>
              <label>
                Preço
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={(target.item.priceCents / 100).toFixed(2)}
                />
              </label>
            </>
          )}
          {target.kind === "cash" && (
            <>
              <label>
                Descrição
                <input name="description" defaultValue={target.item.description} />
              </label>
              <label>
                Valor
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  defaultValue={(target.item.amountCents / 100).toFixed(2)}
                />
              </label>
              <label>
                Data
                <input name="date" type="date" defaultValue={target.item.date} />
              </label>
              <label>
                Pagamento
                <input name="paymentMethod" defaultValue={target.item.paymentMethod} />
              </label>
              <label>
                Cliente
                <select name="clientId" defaultValue={target.item.clientId || ""}>
                  <option value="">Sem cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Colaborador
                <select name="staffId" defaultValue={target.item.staffId || ""}>
                  <option value="">Sem colaborador</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          {target.kind === "appointment" && (
            <>
              <label>
                Cliente
                <select name="clientId" defaultValue={target.item.clientId || ""}>
                  <option value="">Cliente avulso</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Nome avulso
                <input name="clientName" defaultValue={target.item.clientName} />
              </label>
              <label>
                Telefone
                <input name="phone" type="tel" autoComplete="tel" defaultValue={target.item.phone} />
              </label>
              <label>
                Colaborador
                <select name="staffId" defaultValue={target.item.staffId || ""}>
                  <option value="">Sem colaborador</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="service-picker">
                {services.map((s) => (
                  <label key={s.id}>
                    <input
                      type="checkbox"
                      checked={chosen.includes(s.id)}
                      onChange={() =>
                        setChosen((v) => (v.includes(s.id) ? v.filter((x) => x !== s.id) : [...v, s.id]))
                      }
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
              <label>
                Data
                <input name="date" type="date" defaultValue={target.item.date} />
              </label>
              <label>
                Horário
                <input name="time" type="time" defaultValue={target.item.time} />
              </label>
              <label>
                Observação
                <input name="note" defaultValue={target.item.note} />
              </label>
            </>
          )}
          <button className="primary" disabled={busy}>
            {busy ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </aside>
    </div>
  );
}
