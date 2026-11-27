import { test, expect, type Page } from "@playwright/test";
import { useFakeBackend, callsTo } from "./fake-backend";

async function openTab(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await useFakeBackend(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Barbearia Teste" })).toBeVisible();
});

test.describe("Agenda", () => {
  test("cancelar pede confirmação e não cancela se a pessoa desistir", async ({ page }) => {
    await openTab(page, "Agenda");
    let message = "";
    page.once("dialog", async (d) => {
      message = d.message();
      await d.dismiss();
    });
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();

    expect(message).toContain("Cancelar o agendamento de Diego Souza às 14:30?");
    expect(await callsTo(page, "update_appointment")).toHaveLength(0);
  });

  test("cancelar com OK envia o status Cancelado", async ({ page }) => {
    await openTab(page, "Agenda");
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();

    await expect(page.getByRole("status")).toHaveText("Agendamento atualizado.");
    expect(await callsTo(page, "update_appointment")).toEqual([{ input: { id: 1, status: "Cancelado" } }]);
  });
});

test.describe("Clientes", () => {
  test("adicionar cliente mostra na lista", async ({ page }) => {
    await openTab(page, "Clientes");
    await page.getByLabel("Nome do cliente").fill("Marcos Lima");
    await page.getByLabel("Telefone com DDD").fill("(11) 98888-1234");
    await page.getByRole("button", { name: "Adicionar cliente" }).click();

    await expect(page.getByRole("status")).toHaveText("Cliente adicionado.");
    await expect(page.getByText("Marcos Lima")).toBeVisible();
  });

  test("gaveta de edição tem título em português e fecha pelo botão Fechar", async ({ page }) => {
    await openTab(page, "Clientes");
    await page.getByRole("button", { name: "Editar" }).first().click();

    const dialog = page.getByRole("dialog", { name: "Editar cliente" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Telefone")).toHaveAttribute("type", "tel");

    await dialog.getByRole("button", { name: "Fechar" }).click();
    await expect(dialog).toBeHidden();
  });
});

test.describe("Caixa", () => {
  test("lançar despesa aparece na lista e no total de despesas", async ({ page }) => {
    await openTab(page, "Caixa");
    await page.getByLabel("Tipo").selectOption("despesa");
    await page.getByLabel("Descrição").fill("Conta de luz");
    await page.getByLabel("Valor (R$)").fill("120.50");
    await page.getByRole("button", { name: "Salvar lançamento" }).click();

    await expect(page.getByRole("status")).toHaveText("Lançamento salvo.");
    await expect(page.locator(".data-row", { hasText: "Conta de luz" })).toContainText("R$ 120,50");
    await expect(page.locator(".kpi", { hasText: "Despesas" })).toContainText("R$ 120,50");

    const [call] = await callsTo(page, "create_cash_transaction");
    expect(call.input).toMatchObject({ kind: "despesa", description: "Conta de luz", amountCents: 12050 });
  });

  test("venda de produto mostra produto e quantidade, sem campo de valor", async ({ page }) => {
    await openTab(page, "Caixa");
    await page.getByLabel("O que entrou").selectOption("product");

    await expect(page.getByRole("combobox", { name: /^Produto/ })).toBeVisible();
    await expect(page.getByLabel("Quantidade")).toHaveValue("1");
    await expect(page.getByLabel("Valor (R$)")).toHaveCount(0);
  });
});
