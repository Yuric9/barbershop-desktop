import { Field } from "../components/ui";
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
        <Field label="Nome do serviço">
          <input name="name" placeholder="Ex.: Corte masculino" required />
        </Field>
        <Field label="Preço (R$)">
          <input name="price" type="number" min="0.01" step="0.01" placeholder="Ex.: 40,00" required />
        </Field>
        <Field label="Duração (minutos)">
          <input name="durationMin" type="number" min="5" step="5" defaultValue="30" />
        </Field>
        <button className="primary">Adicionar serviço</button>
      </form>
      <div className="card data-list">
        {services.length === 0 && (
          <p className="muted empty-list">
            Nenhum serviço cadastrado. Cadastre os serviços para montar a agenda e lançar no caixa.
          </p>
        )}
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
