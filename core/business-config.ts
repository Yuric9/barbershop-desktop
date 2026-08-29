export type BusinessHours = {
  enabled: boolean;
  open: string;
  close: string;
};

export type WeeklyBusinessHours = {
  monday: BusinessHours;
  tuesday: BusinessHours;
  wednesday: BusinessHours;
  thursday: BusinessHours;
  friday: BusinessHours;
  saturday: BusinessHours;
  sunday: BusinessHours;
};

export type BusinessConfig = {
  schemaVersion: number;
  businessName: string;
  logoPath: string;
  phone: string;
  whatsapp: string;
  address: string;
  ownerName: string;
  locale: string;
  currency: string;
  timeZone: string;
  hours: WeeklyBusinessHours;
  backupDirectory: string;
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_BUSINESS_HOURS: WeeklyBusinessHours = {
  monday: { enabled: true, open: "09:00", close: "19:00" },
  tuesday: { enabled: true, open: "09:00", close: "19:00" },
  wednesday: { enabled: true, open: "09:00", close: "19:00" },
  thursday: { enabled: true, open: "09:00", close: "19:00" },
  friday: { enabled: true, open: "09:00", close: "19:00" },
  saturday: { enabled: true, open: "08:00", close: "18:00" },
  sunday: { enabled: false, open: "08:00", close: "12:00" },
};

export function createDefaultBusinessConfig(now = new Date().toISOString()): BusinessConfig {
  return {
    schemaVersion: 1,
    businessName: "Minha Barbearia",
    logoPath: "",
    phone: "",
    whatsapp: "",
    address: "",
    ownerName: "",
    locale: "pt-BR",
    currency: "BRL",
    timeZone: "America/Sao_Paulo",
    hours: DEFAULT_BUSINESS_HOURS,
    backupDirectory: "",
    createdAt: now,
    updatedAt: now,
  };
}
