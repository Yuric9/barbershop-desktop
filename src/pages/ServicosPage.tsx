import { money } from "../lib/format";
import { EntityPage } from "../components/EntityPage";
import type { AppCtx } from "../state/useAppState";

export function ServicosPage({ ctx }: { ctx: AppCtx }) {
  const { services, setEditTarget, archived, loadArchived, addService, archive, remove, restore } = ctx;
  return (
    <EntityPage
      title="Serviços"
      archivedKind="service"
      onLoadArchived={loadArchived}
      archived={archived}
      onRestore={restore}
    >
      <form className="form card" onSubmit={addService}>
        <input name="name" placeholder="Serviço" required />
        <input name="price" type="number" min="0.01" step="0.01" placeholder="Preço" required />
        <input name="durationMin" type="number" min="5" step="5" defaultValue="30" />
        <button className="primary">Adicionar serviço</button>
      </form>
      <div className="card data-list">
        {services.map((s) => (
          <div className="data-row" key={s.id}>
            <div>
              <b>{s.name}</b>
              <small>
                {money(s.priceCents)} · {s.durationMin} min
              </small>
            </div>
            <div className="row-actions">
              <button onClick={() => setEditTarget({ kind: "service", item: s })}>Editar</button>
              <button onClick={() => void archive("service", s.id)}>Arquivar</button>
              <button className="danger" onClick={() => void remove("service", s.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </EntityPage>
  );
}
