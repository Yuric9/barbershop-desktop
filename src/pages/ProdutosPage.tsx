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
        <input name="name" placeholder="Produto" required />
        <input name="description" placeholder="Descrição" />
        <input name="price" type="number" min="0.01" step="0.01" placeholder="Preço" required />
        <input name="stock" type="number" min="0" step="1" defaultValue="0" />
        <button className="primary">Adicionar produto</button>
      </form>
      <div className="card data-list">
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
                  const raw = window.prompt("Ajuste de estoque (+ entrada / - saída):", "1");
                  if (raw !== null)
                    await mutate(
                      () =>
                        desktopApi.adjustStock({
                          productId: p.id,
                          quantity: Number(raw),
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
