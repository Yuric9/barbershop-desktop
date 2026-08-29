use rusqlite::{params, Connection};
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientHistoryItem {
    pub id: i64,
    pub date: String,
    pub description: String,
    pub amount_cents: i64,
    pub sale_type: String,
    pub staff_name: String,
    pub payment_method: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientSummary {
    pub client_id: i64,
    pub client_name: String,
    pub phone: String,
    pub birth_date: String,
    pub visits: i64,
    pub total_spent_cents: i64,
    pub last_visit: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RemarketingClient {
    pub client_id: i64,
    pub client_name: String,
    pub phone: String,
    pub last_visit: String,
    pub days_without_visit: i64,
    pub total_spent_cents: i64,
}

pub fn summary(connection: &Connection, client_id: i64) -> Result<ClientSummary, String> {
    connection.query_row(
        "SELECT c.id,c.name,c.phone,c.birth_date,COUNT(ct.id),COALESCE(SUM(CASE WHEN ct.kind='entrada' THEN ct.amount_cents ELSE 0 END),0),COALESCE(MAX(ct.date),'') FROM clients c LEFT JOIN cash_transactions ct ON ct.client_id=c.id WHERE c.id=?1 GROUP BY c.id,c.name,c.phone,c.birth_date",
        params![client_id],
        |r| Ok(ClientSummary {
            client_id: r.get(0)?,
            client_name: r.get(1)?,
            phone: r.get(2)?,
            birth_date: r.get(3)?,
            visits: r.get(4)?,
            total_spent_cents: r.get(5)?,
            last_visit: r.get(6)?,
        }),
    ).map_err(|_| "Cliente não encontrado.".to_string())
}

pub fn history(connection: &Connection, client_id: i64) -> Result<Vec<ClientHistoryItem>, String> {
    let mut stmt = connection.prepare(
        "SELECT id,date,description,amount_cents,sale_type,staff_name,payment_method FROM cash_transactions WHERE client_id=?1 AND kind='entrada' ORDER BY date DESC,id DESC LIMIT 500"
    ).map_err(|e| e.to_string())?;
    stmt.query_map(params![client_id], |r| Ok(ClientHistoryItem {
        id: r.get(0)?,
        date: r.get(1)?,
        description: r.get(2)?,
        amount_cents: r.get(3)?,
        sale_type: r.get(4)?,
        staff_name: r.get(5)?,
        payment_method: r.get(6)?,
    })).map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

pub fn inactive_clients(connection: &Connection, minimum_days: i64, reference_date: &str) -> Result<Vec<RemarketingClient>, String> {
    if minimum_days < 1 { return Err("O período mínimo deve ser de pelo menos um dia.".into()); }
    let mut stmt = connection.prepare(
        "SELECT c.id,c.name,c.phone,COALESCE(MAX(ct.date),''),CAST(julianday(?2)-julianday(COALESCE(MAX(ct.date),date(c.created_at))) AS INTEGER),COALESCE(SUM(CASE WHEN ct.kind='entrada' THEN ct.amount_cents ELSE 0 END),0) FROM clients c LEFT JOIN cash_transactions ct ON ct.client_id=c.id GROUP BY c.id,c.name,c.phone,c.created_at HAVING CAST(julianday(?2)-julianday(COALESCE(MAX(ct.date),date(c.created_at))) AS INTEGER) >= ?1 ORDER BY 5 DESC,c.name COLLATE NOCASE"
    ).map_err(|e| e.to_string())?;
    stmt.query_map(params![minimum_days, reference_date], |r| Ok(RemarketingClient {
        client_id: r.get(0)?,
        client_name: r.get(1)?,
        phone: r.get(2)?,
        last_visit: r.get(3)?,
        days_without_visit: r.get(4)?,
        total_spent_cents: r.get(5)?,
    })).map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}
