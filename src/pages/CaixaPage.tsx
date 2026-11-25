import { money } from "../lib/format";
import { Kpi } from "../components/ui";
import type { AppCtx } from "../state/useAppState";

export function CaixaPage({ ctx }: { ctx: AppCtx }) {
  const {
    clients,
    services,
    staff,
    cash,
    products,
    cashStart,
    setCashStart,
    cashEnd,
    setCashEnd,
    cashEntryDate,
    setCashEntryDate,
    cashSaleType,
    cashDescription,
    setCashDescription,
    cashAmount,
    setCashAmount,
    cashServiceId,
    setEditTarget,
    income,
    expense,
    commissions,
    balance,
    refresh,
    selectCashService,
    changeCashSaleType,
    addCash,
    deleteCash,
  } = ctx;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Caixa</h1>
          <p className="muted">
            Entradas e despesas do período. Cada serviço lançado aqui conta como um atendimento.
          </p>
        </div>
      </div>
      <div className="kpi-grid">
        <Kpi label="Entradas brutas" value={money(income)} />
        <Kpi label="Despesas" value={money(expense)} />
        <Kpi label="Comissões" value={money(commissions)} />
        <Kpi label="Resultado da barbearia" value={money(balance)} />
      </div>
      <form className="card form cash-form" onSubmit={addCash}>
        <select name="kind">
          <option value="entrada">Entrada</option>
          <option value="despesa">Despesa</option>
        </select>
        <select value={cashSaleType} onChange={(e) => changeCashSaleType(e.target.value as any)}>
          <option value="service">Serviço</option>
          <option value="product">Venda de produto</option>
          <option value="other">Outro lançamento</option>
        </select>
        {cashSaleType === "service" && (
          <select
            name="serviceId"
            value={cashServiceId}
            onChange={(e) => selectCashService(e.target.value)}
            required
          >
            <option value="">Selecione o serviço</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {money(s.priceCents)}
              </option>
            ))}
          </select>
        )}
        <input
          name="description"
          value={cashDescription}
          onChange={(e) => setCashDescription(e.target.value)}
          placeholder="Descrição"
          readOnly={cashSaleType === "service" && !!cashServiceId}
          required={cashSaleType !== "product"}
        />
        {cashSaleType !== "product" && (
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={cashAmount}
            onChange={(e) => setCashAmount(e.target.value)}
            placeholder="Valor"
            readOnly={cashSaleType === "service" && !!cashServiceId}
            required
          />
        )}
        {cashSaleType === "product" && (
          <>
            <select name="productId" required>
              <option value="">Produto vendido</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {money(p.priceCents)} · estoque {p.stock}
                </option>
              ))}
            </select>
            <input name="quantity" type="number" min="1" step="1" defaultValue="1" />
          </>
        )}
        <input
          name="date"
          type="date"
          value={cashEntryDate}
          onChange={(e) => setCashEntryDate(e.target.value)}
          required
        />
        <select name="paymentMethod">
          <option value="Dinheiro">Dinheiro</option>
          <option value="Pix">Pix</option>
          <option value="Débito">Débito</option>
          <option value="Crédito">Crédito</option>
        </select>
        <select name="clientId">
          <option value="">Sem cliente</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="staffId">
          <option value="">Sem colaborador</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button className="primary">Salvar lançamento</button>
      </form>
      <div className="filter card compact">
        <input type="date" value={cashStart} onChange={(e) => setCashStart(e.target.value)} />
        <input type="date" value={cashEnd} onChange={(e) => setCashEnd(e.target.value)} />
        <button onClick={() => void refresh()}>Filtrar</button>
      </div>
      <div className="card data-list">
        {cash.length ? (
          cash.map((i) => (
            <div className="data-row" key={i.id}>
              <div>
                <b>{i.description}</b>
                <small>
                  {i.date.split("-").reverse().join("/")} · {i.paymentMethod || "Sem forma"}
                  {i.staffName ? ` · ${i.staffName}` : ""}
                  {i.saleType === "service" ? " · Atendimento" : ""}
                </small>
                {i.commissionCents > 0 && (
                  <small>
                    Comissão {i.commissionPercent}% = {money(i.commissionCents)} · Parte da barbearia{" "}
                    {money(i.netCents)}
                  </small>
                )}
              </div>
              <div className="row-actions">
                <strong className={i.kind === "despesa" ? "negative" : "positive"}>
                  {i.kind === "despesa" ? "-" : "+"} {money(i.amountCents)}
                </strong>
                {i.source === "manual" && i.saleType !== "product" && (
                  <button onClick={() => setEditTarget({ kind: "cash", item: i })}>Editar</button>
                )}
                <button className="danger" onClick={() => void deleteCash(i)}>
                  Excluir
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="muted">Nenhum lançamento no período.</p>
        )}
      </div>
    </>
  );
}
