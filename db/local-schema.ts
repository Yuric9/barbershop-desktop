import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const desktopMeta = sqliteTable("desktop_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const desktopBusiness = sqliteTable("desktop_business", {
  id: integer("id").primaryKey().default(1),
  businessName: text("business_name").notNull(),
  logoPath: text("logo_path").notNull().default(""),
  phone: text("phone").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  address: text("address").notNull().default(""),
  ownerName: text("owner_name").notNull().default(""),
  locale: text("locale").notNull().default("pt-BR"),
  currency: text("currency").notNull().default("BRL"),
  timeZone: text("time_zone").notNull().default("America/Sao_Paulo"),
  backupDirectory: text("backup_directory").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const desktopBusinessHours = sqliteTable("desktop_business_hours", {
  dayOfWeek: integer("day_of_week").primaryKey(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  openTime: text("open_time").notNull(),
  closeTime: text("close_time").notNull(),
});

// The operational tables (clients, services, appointments, transactions,
// collaborators, products and reports) will be migrated from db/schema.ts.
// Keeping the new desktop metadata isolated lets us convert persistence
// incrementally without touching the production D1 layer.
