import { money } from "../lib/format";
import type { AppCtx } from "../state/useAppState";

export function RemarketingPage({ ctx }: { ctx: AppCtx }) {
  const {
    remarketingDays,
    setRemarketingDays,
    remarketing,
    remarketingText,
    setRemarketingText,
    sendRemarketing,
  } = ctx;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Remarketing</h1>
          <p className="muted">Clientes sem atendimento de serviço no período selecionado.</p>
        </div>
        <select value={remarketingDays} onChange={(e) => setRemarketingDays(Number(e.target.value))}>
          <option value={30}>30+ dias</option>
          <option value={45}>45+ dias</option>
          <option value={60}>60+ dias</option>
          <option value={90}>90+ dias</option>
        </select>
      </div>
      <div className="card">
        <label className="stack">
          Mensagem da campanha
          <textarea value={remarketingText} onChange={(e) => setRemarketingText(e.target.value)} rows={4} />
        </label>
        <small className="muted">Use {"{nome}"} para inserir o primeiro nome do cliente.</small>
      </div>
      <div className="card data-list">
        {remarketing.length ? (
          remarketing.map((c) => (
            <div className="data-row" key={c.id}>
              <div>
                <b>{c.name}</b>
                <small>
                  {c.phone} · {c.daysWithoutVisit} dias sem voltar · {c.visits} atendimentos ·{" "}
                  {money(c.totalSpentCents)} gastos
                </small>
                <small>
                  {c.lastVisit
                    ? `Última visita ${c.lastVisit.split("-").reverse().join("/")}`
                    : "Sem atendimento registrado"}
                </small>
              </div>
              <div className="row-actions">
                <button className="primary" onClick={() => void sendRemarketing(c)}>
                  Enviar WhatsApp
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="muted">Nenhum cliente neste filtro.</p>
        )}
      </div>
    </>
  );
}
