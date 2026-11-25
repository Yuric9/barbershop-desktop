import type { BusinessSettings, WhatsAppSettings } from "../desktop-api";

export const localDate = () => {
  const d = new Date(),
    o = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - o).toISOString().slice(0, 10);
};
export const monthStart = () =>
  `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
// Formato brasileiro com separador de milhar: R$ 1.500,00 e -R$ 1.453,00.
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const money = (c: number) => brl.format(c / 100);
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

/** Dias inteiros desde uma data "AAAA-MM-DD HH:MM" (formato do backup). null se vazia ou inválida. */
export const daysSince = (value: string) => {
  if (!value) return null;
  const t = new Date(value.replace(" ", "T")).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
};

/** "1 serviço", "2 serviços", "0 serviços". */
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
