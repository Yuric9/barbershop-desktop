import { FormEvent } from "react";
import type { BusinessSettings } from "../desktop-api";

export function SettingsForm({
  values,
  onSave,
}: {
  values: BusinessSettings;
  onSave: (v: BusinessSettings) => Promise<void>;
}) {
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await onSave({
      businessName: String(f.get("businessName") || ""),
      ownerName: String(f.get("ownerName") || ""),
      phone: String(f.get("phone") || ""),
      whatsapp: String(f.get("whatsapp") || ""),
      address: String(f.get("address") || ""),
      logoPath: String(f.get("logoPath") || ""),
      currency: String(f.get("currency") || "BRL"),
      timezone: String(f.get("timezone") || "America/Sao_Paulo"),
      backupDestination: String(f.get("backupDestination") || ""),
      configured: true,
    });
  }
  return (
    <form className="settings-form" onSubmit={submit}>
      <label>
        Nome da barbearia
        <input name="businessName" defaultValue={values.businessName} required />
      </label>
      <label>
        Responsável
        <input name="ownerName" defaultValue={values.ownerName} />
      </label>
      <div className="two">
        <label>
          Telefone
          <input name="phone" type="tel" autoComplete="tel" defaultValue={values.phone} />
        </label>
        <label>
          WhatsApp
          <input name="whatsapp" type="tel" autoComplete="tel" defaultValue={values.whatsapp} />
        </label>
      </div>
      <label>
        Endereço
        <input name="address" defaultValue={values.address} />
      </label>
      <label>
        Logo local
        <input name="logoPath" defaultValue={values.logoPath} />
      </label>
      <div className="two">
        <label>
          Moeda
          <input name="currency" defaultValue={values.currency} />
        </label>
        <label>
          Fuso
          <input name="timezone" defaultValue={values.timezone} />
        </label>
      </div>
      <label>
        Pasta de backup
        <input name="backupDestination" defaultValue={values.backupDestination} />
      </label>
      <button className="primary">Salvar configurações</button>
    </form>
  );
}
