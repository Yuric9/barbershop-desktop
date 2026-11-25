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
      <p className="muted whatsapp-intro">
        Sem a API, os botões de WhatsApp abrem o WhatsApp deste computador com a mensagem pronta: é só
        conferir e enviar. A API oficial da Meta é opcional e envia sozinha as mensagens de cadastro,
        agendamento e finalização, mas exige conta empresarial verificada na Meta. Mensagens de remarketing
        pela API só chegam com um modelo aprovado pela Meta.
      </p>
      <label className="check">
        <input name="enabled" type="checkbox" defaultChecked={value.enabled} /> Usar a API oficial da Meta
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
        <small className="muted">
          Guardado no Cofre de Credenciais do Windows deste computador — não vai para o banco nem para os
          backups. Em outro computador (ou no pendrive em outra máquina), cole o token novamente.
        </small>
      </label>
      <label>
        Links/redes usados no cadastro
        <textarea name="socialLinksText" defaultValue={value.socialLinksText} rows={4} />
      </label>
      <button className="primary">Salvar WhatsApp</button>
    </form>
  );
}
