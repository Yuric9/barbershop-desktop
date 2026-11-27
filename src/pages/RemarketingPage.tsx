import { Field } from "../components/ui";
import { money, formatDate } from "../lib/format";
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
        <Field label="Clientes sem visita há">
          <select value={remarketingDays} onChange={(e) => setRemarketingDays(Number(e.target.value))}>
            <option value={30}>30 dias ou mais</option>
            <option value={45}>45 dias ou mais</option>
            <option value={60}>60 dias ou mais</option>
            <option value={90}>90 dias ou mais</option>
          </select>
        </Field>
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
                  {c.lastVisit ? `Última visita ${formatDate(c.lastVisit)}` : "Sem atendimento registrado"}
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
          <p className="muted">Nenhum cliente está há tanto tempo sem visita.</p>
        )}
      </div>
    </>
  );
}
