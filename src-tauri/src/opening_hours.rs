use chrono::{Datelike, NaiveDate};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpeningHour {
    pub day_of_week: i64,
    pub start_time: String,
    pub end_time: String,
    pub enabled: bool,
}

fn time_to_minutes(value: &str) -> Option<i64> {
    let mut parts = value.split(':');
    let hour: i64 = parts.next()?.parse().ok()?;
    let minute: i64 = parts.next()?.parse().ok()?;
    if hour > 23 || minute > 59 { return None; }
    Some(hour * 60 + minute)
}

pub fn list(connection: &Connection) -> Result<Vec<OpeningHour>, String> {
    let mut stmt = connection
        .prepare("SELECT day_of_week,start_time,end_time,enabled FROM opening_hours ORDER BY day_of_week")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(OpeningHour {
                day_of_week: row.get(0)?,
                start_time: row.get(1)?,
                end_time: row.get(2)?,
                enabled: row.get::<_, i64>(3)? != 0,
            })
        })
        .map_err(|e| e.to_string())?;

    let opening_hours = rows
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(opening_hours)
}

pub fn save(connection: &mut Connection, rows: Vec<OpeningHour>) -> Result<(), String> {
    if rows.len() != 7 { return Err("Informe os sete dias da semana.".into()); }
    let tx = connection.transaction().map_err(|e| e.to_string())?;
    for row in rows {
        if !(0..=6).contains(&row.day_of_week) { return Err("Dia da semana inválido.".into()); }
        if row.enabled {
            let start = time_to_minutes(&row.start_time).ok_or("Horário inicial inválido.")?;
            let end = time_to_minutes(&row.end_time).ok_or("Horário final inválido.")?;
            if end <= start { return Err("O horário final deve ser maior que o inicial.".into()); }
        }
        tx.execute(
            "INSERT INTO opening_hours(day_of_week,start_time,end_time,enabled) VALUES(?1,?2,?3,?4) ON CONFLICT(day_of_week) DO UPDATE SET start_time=excluded.start_time,end_time=excluded.end_time,enabled=excluded.enabled",
            params![row.day_of_week, row.start_time, row.end_time, if row.enabled {1} else {0}],
        ).map_err(|e| e.to_string())?;
    }
    tx.commit().map_err(|e| e.to_string())
}

pub fn operating_window(connection: &Connection, date: &str) -> Result<Option<(i64, i64)>, String> {
    let parsed = NaiveDate::parse_from_str(date, "%Y-%m-%d").map_err(|_| "Data inválida".to_string())?;
    let day = parsed.weekday().num_days_from_sunday() as i64;
    let row = connection.query_row(
        "SELECT start_time,end_time,enabled FROM opening_hours WHERE day_of_week=?1",
        params![day],
        |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?, r.get::<_, i64>(2)?)),
    );
    match row {
        Ok((start, end, enabled)) => {
            if enabled == 0 { return Ok(None); }
            let start = time_to_minutes(&start).ok_or("Horário inicial configurado é inválido")?;
            let end = time_to_minutes(&end).ok_or("Horário final configurado é inválido")?;
            if end <= start { return Err("Expediente configurado é inválido".into()); }
            Ok(Some((start, end)))
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}
