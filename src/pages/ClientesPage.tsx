import { EntityPage } from "../components/EntityPage";
import type { AppCtx } from "../state/useAppState";

export function ClientesPage({ ctx }: { ctx: AppCtx }) {
  const { clients, setEditTarget, archived, loadArchived, addClient, archive, remove, restore } = ctx;
  return <EntityPage title="Clientes" archivedKind="client" onLoadArchived={loadArchived} archived={archived} onRestore={restore}><form className="form card" onSubmit={addClient}><input name="name" placeholder="Nome" required/><input name="phone" placeholder="Telefone" required/><input name="birthDate" type="date"/><button className="primary">Adicionar cliente</button></form><div className="card data-list">{clients.map(c=><div className="data-row" key={c.id}><div><b>{c.name}</b><small>{c.phone}{c.birthDate?` · Aniversário ${c.birthDate.split('-').reverse().join('/')}`:""}</small></div><div className="row-actions"><button onClick={()=>setEditTarget({kind:"client",item:c})}>Editar</button><button onClick={()=>void archive("client",c.id)}>Arquivar</button><button className="danger" onClick={()=>void remove("client",c.id)}>Excluir</button></div></div>)}</div></EntityPage>;
}
