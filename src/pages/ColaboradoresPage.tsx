import { money } from "../lib/format";
import { EntityPage } from "../components/EntityPage";
import type { AppCtx } from "../state/useAppState";

export function ColaboradoresPage({ ctx }: { ctx: AppCtx }) {
  const {
    staff,
    performance,
    settlementStart,
    setSettlementStart,
    settlementEnd,
    setSettlementEnd,
    settlements,
    settlementStaff,
    setSettlementStaff,
    setEditTarget,
    archived,
    refresh,
    loadArchived,
    loadSettlements,
    addStaff,
    archive,
    remove,
    restore,
    closeSettlement,
    reopenSettlement,
  } = ctx;
  return (
    <EntityPage
      title="Colaboradores"
      archivedKind="staff"
      onLoadArchived={loadArchived}
      archived={archived}
      onRestore={restore}
    >
      <div className="card filter compact">
        <span className="muted">Período para cálculo/fechamento:</span>
        <input type="date" value={settlementStart} onChange={(e) => setSettlementStart(e.target.value)} />
        <input type="date" value={settlementEnd} onChange={(e) => setSettlementEnd(e.target.value)} />
        <button onClick={() => void refresh()}>Atualizar período</button>
      </div>
      <form className="form card" onSubmit={addStaff}>
        <input name="name" placeholder="Nome" required />
        <input name="phone" placeholder="Telefone" />
        <input name="commission" type="number" min="0" max="100" defaultValue="40" placeholder="% serviços" />
        <input
          name="productCommission"
          type="number"
          min="0"
          max="100"
          defaultValue="0"
          placeholder="% produtos"
        />
        <button className="primary">Adicionar colaborador</button>
      </form>
      <div className="card data-list">
        {staff.map((s) => {
          const p = performance.find((x) => x.staffId === s.id);
          return (
            <div className="data-row" key={s.id}>
              <div>
                <b>{s.name}</b>
                <small>
                  Serviços {s.commissionPercent}% · Produtos {s.productCommissionPercent}%
                </small>
                <small>
                  Em aberto no período: produção {money(p?.grossCents || 0)} · comissão a pagar{" "}
                  {money(p?.commissionCents || 0)} · parte da barbearia {money(p?.netCents || 0)}
                </small>
                <small>
                  {p?.serviceSales || 0} serviços · {p?.productSales || 0} vendas de produtos
                </small>
              </div>
              <div className="row-actions">
                <button className="primary small" onClick={() => void closeSettlement(s)}>
                  Fazer fechamento
                </button>
                <button onClick={() => void loadSettlements(s)}>Histórico</button>
                <button onClick={() => setEditTarget({ kind: "staff", item: s })}>Editar</button>
                <button onClick={() => void archive("staff", s.id)}>Arquivar</button>
                <button className="danger" onClick={() => void remove("staff", s.id)}>
                  Excluir
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {settlementStaff && (
        <div className="card">
          <div className="page-head">
            <div>
              <h2>Fechamentos de {settlementStaff.name}</h2>
              <p className="muted">
                O fechamento registra o acerto sem criar uma nova despesa no Caixa, evitando descontar a
                comissão duas vezes.
              </p>
            </div>
            <button onClick={() => setSettlementStaff(null)}>Fechar histórico</button>
          </div>
          {settlements.length ? (
            settlements.map((s) => (
              <div className="data-row" key={s.id}>
                <div>
                  <b>
                    {s.startDate.split("-").reverse().join("/")} a {s.endDate.split("-").reverse().join("/")}
                  </b>
                  <small>
                    Produção {money(s.grossCents)} · Comissão paga {money(s.commissionCents)} · Parte da
                    barbearia {money(s.netCents)}
                  </small>
                  <small>
                    {s.serviceSales} serviços · {s.productSales} produtos · fechado em{" "}
                    {new Date(s.createdAt).toLocaleString("pt-BR")}
                  </small>
                </div>
                <button onClick={() => void reopenSettlement(s)}>Reabrir</button>
              </div>
            ))
          ) : (
            <p className="muted">Nenhum fechamento registrado para este colaborador.</p>
          )}
        </div>
      )}
    </EntityPage>
  );
}
