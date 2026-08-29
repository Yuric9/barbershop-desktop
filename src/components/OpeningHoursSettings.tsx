import { FormEvent, useMemo } from "react";

export type OpeningHour = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
};

const labels = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export function OpeningHoursSettings({
  value,
  onSave,
}: {
  value: OpeningHour[];
  onSave: (rows: OpeningHour[]) => Promise<void>;
}) {
  const normalized = useMemo(() => labels.map((_, day) => value.find(row => row.dayOfWeek === day) || {
    dayOfWeek: day,
    startTime: "08:00",
    endTime: "18:00",
    enabled: false,
  }), [value]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const rows = normalized.map(row => ({
      dayOfWeek: row.dayOfWeek,
      enabled: data.get(`enabled-${row.dayOfWeek}`) === "on",
      startTime: String(data.get(`start-${row.dayOfWeek}`) || ""),
      endTime: String(data.get(`end-${row.dayOfWeek}`) || ""),
    }));
    await onSave(rows);
  }

  return <form className="opening-hours" onSubmit={submit}>
    <p className="muted">A Agenda deve usar estes horários para calcular os slots disponíveis. Dias desmarcados ficam fechados.</p>
    {normalized.map(row => <div className="opening-hour-row" key={row.dayOfWeek}>
      <label className="day-toggle">
        <input name={`enabled-${row.dayOfWeek}`} type="checkbox" defaultChecked={row.enabled}/>
        <span>{labels[row.dayOfWeek]}</span>
      </label>
      <input name={`start-${row.dayOfWeek}`} type="time" defaultValue={row.startTime}/>
      <span>até</span>
      <input name={`end-${row.dayOfWeek}`} type="time" defaultValue={row.endTime}/>
    </div>)}
    <button>Salvar horários de funcionamento</button>
  </form>;
}
