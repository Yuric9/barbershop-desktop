import { daysSince, money } from "../lib/format";
import { desktopApi } from "../desktop-api";
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
    maintenance,
    mutate,
  } = ctx;
  // A página só aparece depois que as configurações carregaram (ver AppModern), então nunca é null aqui.
  const settings = ctx.settings!;
  // Sem backup há mais de 7 dias (ou nunca): o backup automático pode estar falhando
  // (ex.: pasta de backup num pendrive que não está conectado).
  const backupAge = maintenance ? daysSince(maintenance.lastBackup) : null;
  const backupStale = maintenance !== null && (backupAge === null || backupAge > 7);
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
      {backupStale && (
        <div className="warning backup-warning">
          <span>
            {backupAge === null
              ? "Nenhum backup encontrado. Se este computador quebrar, os dados da barbearia se perdem."
              : `O último backup foi há ${backupAge} dias. Confira se a pasta de backup está disponível.`}
          </span>
          <button
            className="primary small"
            onClick={() => void mutate(() => desktopApi.createBackup(), "Backup criado.")}
          >
            Criar backup agora
          </button>
        </div>
      )}
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
            <p className="muted">Nenhum atendimento hoje. Use + Novo agendamento para marcar.</p>
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
