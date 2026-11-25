import type { BusinessSettings, WhatsAppSettings } from "../desktop-api";

export const localDate = () => {
  const d = new Date(),
    o = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - o).toISOString().slice(0, 10);
};
export const monthStart = () =>
  `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
export const money = (c: number) => `R$ ${(c / 100).toFixed(2).replace(".", ",")}`;
export const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
export const emptySettings: BusinessSettings = {
  businessName: "",
  ownerName: "",
  phone: "",
  whatsapp: "",
  address: "",
  logoPath: "",
  currency: "BRL",
  timezone: "America/Sao_Paulo",
  backupDestination: "",
  configured: false,
};
export const emptyWhatsApp: WhatsAppSettings = {
  enabled: false,
  apiBaseUrl: "https://graph.facebook.com",
  apiVersion: "v23.0",
  phoneNumberId: "",
  accessToken: "",
  socialLinksText: "",
};
