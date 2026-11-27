import { Field } from "../components/ui";
import { money, formatDate } from "../lib/format";
import { AppointmentRow } from "../components/AppointmentRow";
import type { AppCtx } from "../state/useAppState";

export function AgendaPage({ ctx }: { ctx: AppCtx }) {
  const {
    clients,
    services,
    staff,
    appointments,
    agendaDate,
    setAgendaDate,
    selectedServices,
    availableTimes,
    availabilityDuration,
    availabilityTotal,
    selectedTime,
    setSelectedTime,
    setEditTarget,
    setFinishTarget,
    toggleService,
    checkAvailability,
    overtimeWarning,
    addAppointment,
    sendAppointmentWhatsApp,
    changeStatus,
  } = ctx;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Agenda</h1>
          <p className="muted">Os horários livres seguem o funcionamento definido em Configurações.</p>
        </div>
        <Field label="Dia mostrado na agenda">
          <input
            className="date-field"
            type="date"
            value={agendaDate}
            onChange={(e) => setAgendaDate(e.target.value)}
          />
        </Field>
      </div>
      <div className="agenda-layout modern-agenda">
        <form className="card appointment-form" onSubmit={addAppointment}>
          <h2>Novo agendamento</h2>
          <Field label="Cliente">
            <select name="clientId">
              <option value="">Cliente sem cadastro (preencha abaixo)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="two">
            <Field label="Nome (sem cadastro)">
              <input name="clientName" placeholder="Ex.: João" />
            </Field>
            <Field label="Telefone (sem cadastro)">
              <input name="phone" type="tel" autoComplete="tel" placeholder="Ex.: (11) 99999-8888" />
            </Field>
          </div>
          <Field label="Colaborador">
            <select name="staffId">
              <option value="">Ainda não definido</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          {/* Grupo de caixas de seleção: não pode ficar dentro de <label>, por isso é uma <div>. */}
          <div className="field">
            <span className="field-label">Serviços (marque um ou mais)</span>
            <div className="service-picker">
              {services.map((s) => (
                <label key={s.id}>
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(s.id)}
                    onChange={() => toggleService(s.id)}
                  />
                  <span>
                    {s.name}
                    <small>
                      {money(s.priceCents)} · {s.durationMin} min
                    </small>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <Field label="Data">
            <input
              name="date"
              type="date"
              value={agendaDate}
              onChange={(e) => setAgendaDate(e.target.value)}
              required
            />
          </Field>
          <button
            type="button"
            className="secondary"
            onClick={(e) => void checkAvailability(e.currentTarget.form!)}
          >
            Ver horários disponíveis
          </button>
          {availableTimes.length > 0 && (
            <>
              <div className="slot-grid">
                {availableTimes.map((t) => (
                  <button
                    type="button"
                    key={t}
                    className={selectedTime === t ? "slot active" : "slot"}
                    onClick={() => setSelectedTime(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input type="hidden" name="time" value={selectedTime} />
              <div className="summary">
                {availabilityDuration} min · {money(availabilityTotal)}
              </div>
              {overtimeWarning() && <div className="warning">{overtimeWarning()}</div>}
            </>
          )}
          <Field label="Observação (opcional)">
            <input name="note" placeholder="Ex.: prefere máquina 2" />
          </Field>
          <button className="primary" disabled={!selectedTime}>
            Salvar agendamento
          </button>
        </form>
        <div className="card">
          <h2>{formatDate(agendaDate)}</h2>
          {appointments.length ? (
            appointments.map((a) => (
              <AppointmentRow
                key={a.id}
                a={a}
                onEdit={() => setEditTarget({ kind: "appointment", item: a })}
                onWhatsApp={() => void sendAppointmentWhatsApp(a)}
                onFinish={() => setFinishTarget(a)}
                onConfirm={() => void changeStatus(a, "Confirmado")}
                onCancel={() => void changeStatus(a, "Cancelado")}
              />
            ))
          ) : (
            <p className="muted">Nenhum agendamento para esta data.</p>
          )}
        </div>
      </div>
    </>
  );
}
