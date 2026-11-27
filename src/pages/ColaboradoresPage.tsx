import { Field } from "../components/ui";
import { money, plural, formatDate, formatDateTime } from "../lib/format";
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
        <Field label="Comissões a partir de">
          <input type="date" value={settlementStart} onChange={(e) => setSettlementStart(e.target.value)} />
        </Field>
        <Field label="Até">
          <input type="date" value={settlementEnd} onChange={(e) => setSettlementEnd(e.target.value)} />
        </Field>
        <button onClick={() => void refresh()}>Calcular período</button>
        <small className="muted period-hint">
          Os valores em aberto e o botão Fazer fechamento usam este período.
        </small>
      </div>
      <form className="form card" onSubmit={addStaff}>
        <Field label="Nome do colaborador">
          <input name="name" placeholder="Ex.: Bruno" required />
        </Field>
        <Field label="Telefone (opcional)">
          <input name="phone" type="tel" autoComplete="tel" placeholder="Ex.: (11) 98888-7777" />
        </Field>
        <Field label="Comissão em serviços (%)">
          <input name="commission" type="number" min="0" max="100" defaultValue="40" />
        </Field>
        <Field label="Comissão em produtos (%)">
          <input name="productCommission" type="number" min="0" max="100" defaultValue="0" />
        </Field>
        <button className="primary">Adicionar colaborador</button>
      </form>
      <div className="card data-list">
        {staff.length === 0 && (
          <p className="muted empty-list">
            Nenhum colaborador cadastrado. Cadastre quem atende para calcular as comissões.
          </p>
        )}
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
                  {plural(p?.serviceSales || 0, "serviço", "serviços")} ·{" "}
                  {plural(p?.productSales || 0, "venda de produto", "vendas de produtos")}
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
                    {formatDate(s.startDate)} a {formatDate(s.endDate)}
                  </b>
                  <small>
                    Produção {money(s.grossCents)} · Comissão paga {money(s.commissionCents)} · Parte da
                    barbearia {money(s.netCents)}
                  </small>
                  <small>
                    {plural(s.serviceSales, "serviço", "serviços")} ·{" "}
                    {plural(s.productSales, "produto", "produtos")} · fechado em {formatDateTime(s.createdAt)}
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
