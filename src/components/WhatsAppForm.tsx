import { FormEvent } from "react";
import type { WhatsAppSettings } from "../desktop-api";

export function WhatsAppForm({
  value,
  onSave,
}: {
  value: WhatsAppSettings;
  onSave: (v: WhatsAppSettings) => Promise<void>;
}) {
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await onSave({
      enabled: f.get("enabled") === "on",
      apiBaseUrl: String(f.get("apiBaseUrl") || "https://graph.facebook.com"),
      apiVersion: String(f.get("apiVersion") || "v23.0"),
      phoneNumberId: String(f.get("phoneNumberId") || ""),
      accessToken: String(f.get("accessToken") || ""),
      socialLinksText: String(f.get("socialLinksText") || ""),
    });
  }
  return (
    <form className="settings-form" onSubmit={submit}>
      <label className="check">
        <input name="enabled" type="checkbox" defaultChecked={value.enabled} /> Ativar integração oficial
      </label>
      <label>
        Base da API
        <input
          name="apiBaseUrl"
          defaultValue="https://graph.facebook.com"
          readOnly
          title="Endereço oficial da Meta (fixo por segurança)"
        />
      </label>
      <label>
        Versão Graph API
        <input name="apiVersion" defaultValue={value.apiVersion} />
      </label>
      <label>
        Phone Number ID
        <input name="phoneNumberId" defaultValue={value.phoneNumberId} />
      </label>
      <label>
        Access Token
        <input
          name="accessToken"
          type="password"
          autoComplete="off"
          defaultValue=""
          placeholder={
            value.hasAccessToken ? "Token salvo — deixe em branco para manter" : "Cole o Access Token aqui"
          }
        />
      </label>
      <label>
        Links/redes usados no cadastro
        <textarea name="socialLinksText" defaultValue={value.socialLinksText} rows={4} />
      </label>
      <button className="primary">Salvar WhatsApp</button>
    </form>
  );
}
