import { money } from "../lib/format";
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
        <input
          className="date-field"
          type="date"
          value={agendaDate}
          onChange={(e) => setAgendaDate(e.target.value)}
        />
      </div>
      <div className="agenda-layout modern-agenda">
        <form className="card appointment-form" onSubmit={addAppointment}>
          <h2>Novo agendamento</h2>
          <select name="clientId">
            <option value="">Cliente avulso</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="two">
            <input name="clientName" placeholder="Nome se avulso" />
            <input name="phone" placeholder="Telefone" />
          </div>
          <select name="staffId">
            <option value="">Sem colaborador</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
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
          <input
            name="date"
            type="date"
            value={agendaDate}
            onChange={(e) => setAgendaDate(e.target.value)}
            required
          />
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
          <input name="note" placeholder="Observação" />
          <button className="primary" disabled={!selectedTime}>
            Salvar agendamento
          </button>
        </form>
        <div className="card">
          <h2>{agendaDate.split("-").reverse().join("/")}</h2>
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
