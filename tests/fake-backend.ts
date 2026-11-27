import type { Page } from "@playwright/test";

/**
 * Backend falso para os testes.
 *
 * No app de verdade, o React chama o Rust pelo `invoke` do Tauri. No navegador do teste o Rust não existe,
 * então criamos `window.__TAURI_INTERNALS__.invoke` com um "banco de dados" em memória.
 * Cada chamada fica registrada em `window.__calls`, para o teste conferir o que o app pediu ao backend.
 */
export async function useFakeBackend(page: Page) {
  await page.addInitScript(() => {
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    let nextId = 100;

    const db = {
      clients: [
        { id: 1, name: "Diego Souza", phone: "(11) 99999-8888", birthDate: "1990-05-12", createdAt: "" },
      ],
      services: [
        { id: 1, name: "Corte masculino", priceCents: 4000, durationMin: 30, active: true },
        { id: 2, name: "Barba", priceCents: 2500, durationMin: 20, active: true },
      ],
      staff: [
        {
          id: 1,
          name: "Bruno",
          phone: "",
          commissionPercent: 40,
          productCommissionPercent: 10,
          active: true,
          owner: false,
        },
      ],
      products: [{ id: 1, name: "Pomada", description: "", priceCents: 4500, stock: 3, active: true }],
      appointments: [
        {
          id: 1,
          clientId: 1,
          clientName: "Diego Souza",
          phone: "(11) 99999-8888",
          staffId: 1,
          staffName: "Bruno",
          serviceNames: "Corte masculino",
          date: today,
          time: "14:30",
          durationMin: 30,
          totalCents: 4000,
          status: "Pendente",
          paymentMethod: "",
          note: "",
          cashTransactionId: null,
          createdAt: "",
        },
      ],
      cash: [] as Record<string, unknown>[],
    };

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      incomeCents: 0,
      expenseCents: 0,
      commissionCents: 0,
      balanceCents: 0,
      transactions: 0,
      attendances: 0,
    }));

    type Args = { input?: Record<string, any>; id?: number };
    const handlers: Record<string, (a: Args) => unknown> = {
      health: () => ({ storageMode: "installed", databasePath: "teste.db", schemaVersion: 1 }),
      get_business_settings: () => ({
        businessName: "Barbearia Teste",
        ownerName: "",
        phone: "",
        whatsapp: "",
        address: "",
        logoPath: "",
        currency: "BRL",
        timezone: "America/Sao_Paulo",
        backupDestination: "",
        configured: true,
      }),
      list_clients: () => db.clients,
      list_services: () => db.services,
      list_staff: () => db.staff,
      list_products: () => db.products,
      list_appointments: () => db.appointments,
      list_cash_transactions: () => db.cash,
      create_client: ({ input }) => {
        const client = { id: nextId++, createdAt: "", birthDate: "", ...input };
        db.clients.push(client as (typeof db.clients)[number]);
        return client;
      },
      update_appointment: ({ input }) => {
        const a = db.appointments.find((x) => x.id === input!.id);
        if (a) a.status = input!.status;
      },
      create_cash_transaction: ({ input }) => {
        const row = {
          id: nextId++,
          staffName: "",
          source: "manual",
          commissionPercent: 0,
          commissionCents: 0,
          netCents: input!.amountCents,
          ...input,
        };
        db.cash.push(row);
        return row;
      },
      maintenance_report: () => ({
        integrity: "ok",
        databaseSizeBytes: 1,
        schemaVersion: 1,
        storageMode: "installed",
        databasePath: "teste.db",
        lastBackup: `${today} 08:00`,
      }),
      monthly_report: () => ({
        year: 2026,
        months,
        yearIncomeCents: 0,
        yearExpenseCents: 0,
        yearCommissionCents: 0,
        yearBalanceCents: 0,
      }),
      get_whatsapp_settings: () => ({
        enabled: false,
        apiBaseUrl: "https://graph.facebook.com",
        apiVersion: "v23.0",
        phoneNumberId: "",
        accessToken: "",
        socialLinksText: "",
      }),
    };

    const calls: { cmd: string; args: Args }[] = [];
    (window as any).__calls = calls;
    (window as any).__TAURI_INTERNALS__ = {
      invoke: async (cmd: string, args: Args = {}) => {
        calls.push({ cmd, args: JSON.parse(JSON.stringify(args)) });
        const handler = handlers[cmd];
        // Comandos não simulados: listas vazias para "list_*", nada para o resto.
        const result = handler ? handler(args) : cmd.startsWith("list_") ? [] : null;
        return JSON.parse(JSON.stringify(result ?? null));
      },
      transformCallback: () => 0,
    };
  });
}

/** Chamadas que o app fez ao backend com este comando. */
export function callsTo(page: Page, cmd: string) {
  return page.evaluate(
    (c) => (window as any).__calls.filter((x: { cmd: string }) => x.cmd === c).map((x: any) => x.args),
    cmd,
  );
}
