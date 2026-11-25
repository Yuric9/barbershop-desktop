import { money } from "../lib/format";
import { Kpi, Metric } from "../components/ui";
import { AppointmentRow } from "../components/AppointmentRow";
import type { AppCtx } from "../state/useAppState";

export function StatusPage({ ctx }: { ctx: AppCtx }) {
  const {
    setTab,
    appointments,
    agendaDate,
    setEditTarget,
    setFinishTarget,
    income,
    expense,
    commissions,
    concluded,
    ticket,
    balance,
    nextAppointment,
    sendAppointmentWhatsApp,
    changeStatus,
  } = ctx;
  // A página só aparece depois que as configurações carregaram (ver AppModern), então nunca é null aqui.
  const settings = ctx.settings!;
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Visão geral</div>
          <h1>{settings.businessName}</h1>
        </div>
        <button className="primary" onClick={() => setTab("agenda")}>
          + Novo agendamento
        </button>
      </div>
      <div className="kpi-grid">
        <Kpi label="Faturamento do período" value={money(income)} />
        <Kpi label="Atendimentos concluídos" value={String(concluded)} />
        <Kpi label="Ticket médio de serviços" value={money(ticket)} />
        <Kpi
          label="Próximo atendimento"
          value={nextAppointment ? `${nextAppointment.time} · ${nextAppointment.clientName}` : "Agenda livre"}
        />
      </div>
      <div className="split">
        <div className="card">
          <h2>Agenda de {agendaDate.split("-").reverse().join("/")}</h2>
          {appointments.length ? (
            appointments.map((a) => (
              <AppointmentRow
                key={a.id}
                a={a}
                onEdit={() => setEditTarget({ kind: "appointment", item: a })}
                onWhatsApp={() => void sendAppointmentWhatsApp(a)}
                onFinish={() => setFinishTarget(a)}
                onConfirm={() => void changeStatus(a, "Confirmado")}
              />
            ))
          ) : (
            <p className="muted">Nenhum atendimento.</p>
          )}
        </div>
        <div className="card">
          <h2>Resumo financeiro</h2>
          <Metric label="Entradas brutas" value={money(income)} />
          <Metric label="Despesas" value={money(expense)} />
          <Metric label="Comissões a colaboradores" value={money(commissions)} />
          <Metric label="Resultado da barbearia" value={money(balance)} />
        </div>
      </div>
    </>
  );
}
