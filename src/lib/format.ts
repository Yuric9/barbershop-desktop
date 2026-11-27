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

// Datas "AAAA-MM-DD" são lidas em UTC para não "voltar um dia" no fuso do Brasil.
const brDate = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
/** "2026-11-27" → "27/11/2026". Valor vazio ou inválido volta como veio. */
export const formatDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return iso && !Number.isNaN(d.getTime()) ? brDate.format(d) : iso;
};
const brDateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
/** "2026-11-27 14:30:00" → "27/11/2026 14:30". */
export const formatDateTime = (value: string) => {
  const d = new Date(value.replace(" ", "T"));
  return value && !Number.isNaN(d.getTime()) ? brDateTime.format(d) : value;
};
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
