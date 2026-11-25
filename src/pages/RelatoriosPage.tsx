import { money, months } from "../lib/format";
import { Kpi, Field } from "../components/ui";
import type { AppCtx } from "../state/useAppState";

export function RelatoriosPage({ ctx }: { ctx: AppCtx }) {
  const { report, reportYear, setReportYear, loadReport, openMonth } = ctx;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Relatórios</h1>
          <p className="muted">Resultado mês a mês. O saldo já desconta despesas e comissões.</p>
        </div>
        <div className="filter">
          <Field label="Ano">
            <input
              type="number"
              min="2000"
              max="2100"
              value={reportYear}
              onChange={(e) => setReportYear(Number(e.target.value))}
            />
          </Field>
          <button onClick={() => void loadReport()}>Atualizar</button>
        </div>
      </div>
      {report && (
        <>
          <div className="kpi-grid">
            <Kpi label="Faturamento anual" value={money(report.yearIncomeCents)} />
            <Kpi label="Despesas anuais" value={money(report.yearExpenseCents)} />
            <Kpi label="Comissões anuais" value={money(report.yearCommissionCents)} />
            <Kpi label="Resultado da barbearia" value={money(report.yearBalanceCents)} />
          </div>
          <div className="card report-table modern-report">
            {report.months.map((m) => (
              <div className="report-row" key={m.month}>
                <b>{months[m.month - 1]}</b>
                <span>Entradas {money(m.incomeCents)}</span>
                <span>Despesas {money(m.expenseCents)}</span>
                <span>Comissões {money(m.commissionCents)}</span>
                <span>Saldo {money(m.balanceCents)}</span>
                <small>
                  {m.attendances} atend. · {m.transactions} lanç.
                </small>
                <div className="row-actions">
                  <button onClick={() => openMonth(m.month, false)}>Ver lançamentos</button>
                  <button className="primary small" onClick={() => openMonth(m.month, true)}>
                    + Lançar neste mês
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
