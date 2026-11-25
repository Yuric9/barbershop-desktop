import { Field } from "../components/ui";
import { EntityPage } from "../components/EntityPage";
import type { AppCtx } from "../state/useAppState";

export function ClientesPage({ ctx }: { ctx: AppCtx }) {
  const { clients, setEditTarget, archived, loadArchived, addClient, archive, remove, restore } = ctx;
  return (
    <EntityPage
      title="Clientes"
      archivedKind="client"
      onLoadArchived={loadArchived}
      archived={archived}
      onRestore={restore}
    >
      <form className="form card" onSubmit={addClient}>
        <Field label="Nome do cliente">
          <input name="name" placeholder="Ex.: Diego Souza" required />
        </Field>
        <Field label="Telefone com DDD">
          <input name="phone" placeholder="Ex.: (11) 99999-8888" required />
        </Field>
        <Field label="Aniversário (opcional)">
          <input name="birthDate" type="date" />
        </Field>
        <button className="primary">Adicionar cliente</button>
      </form>
      <div className="card data-list">
        {clients.length === 0 && (
          <p className="muted empty-list">
            Nenhum cliente cadastrado. Preencha os campos acima e clique em Adicionar cliente.
          </p>
        )}
        {clients.map((c) => (
          <div className="data-row" key={c.id}>
            <div>
              <b>{c.name}</b>
              <small>
                {c.phone}
                {c.birthDate ? ` · Aniversário ${c.birthDate.split("-").reverse().join("/")}` : ""}
              </small>
            </div>
            <div className="row-actions">
              <button onClick={() => setEditTarget({ kind: "client", item: c })}>Editar</button>
              <button onClick={() => void archive("client", c.id)}>Arquivar</button>
              <button className="danger" onClick={() => void remove("client", c.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </EntityPage>
  );
}
