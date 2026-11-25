import { Field } from "../components/ui";
import { desktopApi } from "../desktop-api";
import { money } from "../lib/format";
import { EntityPage } from "../components/EntityPage";
import type { AppCtx } from "../state/useAppState";

export function ProdutosPage({ ctx }: { ctx: AppCtx }) {
  const { products, setEditTarget, archived, loadArchived, mutate, addProduct, archive, remove, restore } =
    ctx;
  return (
    <EntityPage
      title="Produtos / Estoque"
      archivedKind="product"
      onLoadArchived={loadArchived}
      archived={archived}
      onRestore={restore}
    >
      <form className="form card" onSubmit={addProduct}>
        <Field label="Nome do produto">
          <input name="name" placeholder="Ex.: Pomada modeladora" required />
        </Field>
        <Field label="Descrição (opcional)">
          <input name="description" placeholder="Ex.: 120 g, efeito seco" />
        </Field>
        <Field label="Preço de venda (R$)">
          <input name="price" type="number" min="0.01" step="0.01" placeholder="Ex.: 45,00" required />
        </Field>
        <Field label="Quantidade em estoque">
          <input name="stock" type="number" min="0" step="1" defaultValue="0" />
        </Field>
        <button className="primary">Adicionar produto</button>
      </form>
      <div className="card data-list">
        {products.length === 0 && (
          <p className="muted empty-list">
            Nenhum produto cadastrado. Preencha os campos acima e clique em Adicionar produto.
          </p>
        )}
        {products.map((p) => (
          <div className="data-row" key={p.id}>
            <div>
              <b>{p.name}</b>
              <small>
                {money(p.priceCents)} · Estoque {p.stock}
              </small>
            </div>
            <div className="row-actions">
              <button onClick={() => setEditTarget({ kind: "product", item: p })}>Editar</button>
              <button
                onClick={async () => {
                  const raw = window.prompt(
                    `Ajustar o estoque de ${p.name} (hoje: ${p.stock}).\n\n` +
                      "Digite quantas unidades entraram (ex.: 10) ou saíram por perda/uso (ex.: -2).\n" +
                      "Venda para cliente não é aqui: lance no Caixa como Venda de produto.",
                    "1",
                  );
                  if (raw === null) return;
                  const quantity = Number(raw.trim().replace(",", "."));
                  if (!Number.isInteger(quantity) || quantity === 0) {
                    window.alert("Digite um número inteiro diferente de zero, como 10 ou -2.");
                    return;
                  }
                  await mutate(
                    () =>
                      desktopApi.adjustStock({
                        productId: p.id,
                        quantity,
                        note: "Ajuste manual",
                      }),
                    "Estoque atualizado.",
                  );
                }}
              >
                Estoque
              </button>
              <button onClick={() => void archive("product", p.id)}>Arquivar</button>
              <button className="danger" onClick={() => void remove("product", p.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </EntityPage>
  );
}
