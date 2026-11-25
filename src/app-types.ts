import type { Appointment, CashTransaction, Client, Product, Service, Staff } from "./desktop-api";

export type Tab =
  | "status"
  | "agenda"
  | "caixa"
  | "clientes"
  | "profissionais"
  | "servicos"
  | "produtos"
  | "relatorios"
  | "remarketing"
  | "configuracoes";
export type EditTarget =
  | { kind: "client"; item: Client }
  | { kind: "service"; item: Service }
  | { kind: "staff"; item: Staff }
  | { kind: "product"; item: Product }
  | { kind: "cash"; item: CashTransaction }
  | { kind: "appointment"; item: Appointment };
