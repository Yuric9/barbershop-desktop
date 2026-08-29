struct DbState {
    connection: Mutex<Connection>,
    database_path: String,
    storage_mode: String,
    storage_root: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Health { storage_mode: String, database_path: String, schema_version: i64 }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Client { id: i64, name: String, phone: String, birth_date: String, created_at: String }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateClientInput { name: String, phone: String, birth_date: Option<String> }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Service { id: i64, name: String, price_cents: i64, duration_min: i64, active: bool }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateServiceInput { name: String, price_cents: i64, duration_min: i64 }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Staff { id: i64, name: String, phone: String, commission_percent: i64, product_commission_percent: i64, active: bool, owner: bool }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateStaffInput { name: String, phone: Option<String>, commission_percent: Option<i64>, product_commission_percent: Option<i64>, owner: Option<bool> }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct StaffServiceCommission { staff_id: i64, service_id: i64, service_name: String, commission_percent: i64 }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SetStaffServiceCommissionInput { staff_id: i64, service_id: i64, commission_percent: i64 }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct StaffPerformance { staff_id: i64, staff_name: String, gross_cents: i64, commission_cents: i64, net_cents: i64, service_sales: i64, product_sales: i64 }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Appointment { id: i64, client_id: Option<i64>, client_name: String, phone: String, staff_id: Option<i64>, staff_name: String, service_names: String, date: String, time: String, duration_min: i64, total_cents: i64, status: String, payment_method: String, note: String, cash_transaction_id: Option<i64>, created_at: String }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateAppointmentInput { client_id: Option<i64>, client_name: String, phone: String, staff_id: Option<i64>, service_ids: Vec<i64>, date: String, time: String, note: Option<String> }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateAppointmentInput { id: i64, status: String, payment_method: Option<String>, note: Option<String> }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ScheduleBlock { id: i64, date: String, time: String, staff_id: Option<i64>, reason: String }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateScheduleBlockInput { date: String, time: Option<String>, staff_id: Option<i64>, reason: String }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AvailabilityInput { date: String, service_ids: Vec<i64>, staff_id: Option<i64> }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Availability { duration_min: i64, total_cents: i64, available_times: Vec<String> }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CashTransaction { id: i64, kind: String, description: String, amount_cents: i64, date: String, payment_method: String, client_id: Option<i64>, staff_id: Option<i64>, staff_name: String, source: String, sale_type: String, commission_percent: i64, commission_cents: i64, net_cents: i64 }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateCashInput { kind: String, description: String, amount_cents: i64, date: String, payment_method: Option<String>, client_id: Option<i64>, staff_id: Option<i64>, sale_type: Option<String>, service_id: Option<i64>, product_id: Option<i64>, quantity: Option<i64> }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Product { id: i64, name: String, description: String, price_cents: i64, stock: i64, active: bool }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateProductInput { name: String, description: Option<String>, price_cents: i64, stock: i64 }
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct StockAdjustmentInput { product_id: i64, quantity: i64, note: Option<String> }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MonthlyReport { year: i32, months: Vec<MonthSummary>, year_income_cents: i64, year_expense_cents: i64, year_commission_cents: i64, year_balance_cents: i64 }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MonthSummary { month: u32, income_cents: i64, expense_cents: i64, commission_cents: i64, balance_cents: i64, transactions: i64, attendances: i64 }
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct BusinessSettings { business_name: String, owner_name: String, phone: String, whatsapp: String, address: String, logo_path: String, currency: String, timezone: String, backup_destination: String, configured: bool }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BackupItem { file_name: String, path: String, size_bytes: u64, created_at: String }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MaintenanceReport { integrity: String, database_size_bytes: u64, schema_version: i64, storage_mode: String, database_path: String, last_backup: String }

fn initialize_database(c: &Connection) -> Result<(), String> {
    c.execute_batch("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS schema_meta(id INTEGER PRIMARY KEY CHECK(id=1),version INTEGER NOT NULL); INSERT OR IGNORE INTO schema_meta VALUES(1,6); UPDATE schema_meta SET version=6 WHERE id=1;
CREATE TABLE IF NOT EXISTS clients(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,phone TEXT NOT NULL,birth_date TEXT NOT NULL DEFAULT '',active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL); CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name); CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE TABLE IF NOT EXISTS services(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,price_cents INTEGER NOT NULL,duration_min INTEGER NOT NULL,active INTEGER NOT NULL DEFAULT 1); CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE TABLE IF NOT EXISTS staff(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,phone TEXT NOT NULL DEFAULT '',commission_percent INTEGER NOT NULL DEFAULT 40,product_commission_percent INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 1,owner INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS staff_service_commissions(staff_id INTEGER NOT NULL,service_id INTEGER NOT NULL,commission_percent INTEGER NOT NULL,PRIMARY KEY(staff_id,service_id),FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE,FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS appointments(id INTEGER PRIMARY KEY AUTOINCREMENT,client_id INTEGER,client_name TEXT NOT NULL,phone TEXT NOT NULL DEFAULT '',staff_id INTEGER,staff_name TEXT NOT NULL DEFAULT '',service_names TEXT NOT NULL,date TEXT NOT NULL,time TEXT NOT NULL,duration_min INTEGER NOT NULL,total_cents INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'Pendente',payment_method TEXT NOT NULL DEFAULT '',note TEXT NOT NULL DEFAULT '',cash_transaction_id INTEGER,created_at TEXT NOT NULL,FOREIGN KEY(client_id) REFERENCES clients(id),FOREIGN KEY(staff_id) REFERENCES staff(id)); CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(date,time);
CREATE TABLE IF NOT EXISTS appointment_services(id INTEGER PRIMARY KEY AUTOINCREMENT,appointment_id INTEGER NOT NULL,service_id INTEGER NOT NULL,service_name TEXT NOT NULL,price_cents INTEGER NOT NULL,duration_min INTEGER NOT NULL,FOREIGN KEY(appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,FOREIGN KEY(service_id) REFERENCES services(id));
CREATE TABLE IF NOT EXISTS schedule_blocks(id INTEGER PRIMARY KEY AUTOINCREMENT,date TEXT NOT NULL,time TEXT NOT NULL DEFAULT 'Dia inteiro',staff_id INTEGER,reason TEXT NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(staff_id) REFERENCES staff(id)); CREATE INDEX IF NOT EXISTS idx_schedule_blocks_date ON schedule_blocks(date);
CREATE TABLE IF NOT EXISTS cash_transactions(id INTEGER PRIMARY KEY AUTOINCREMENT,kind TEXT NOT NULL,description TEXT NOT NULL,amount_cents INTEGER NOT NULL,date TEXT NOT NULL,appointment_id INTEGER,client_id INTEGER,staff_id INTEGER,staff_name TEXT NOT NULL DEFAULT '',payment_method TEXT NOT NULL DEFAULT '',source TEXT NOT NULL DEFAULT 'manual',sale_type TEXT NOT NULL DEFAULT 'other',commission_percent INTEGER NOT NULL DEFAULT 0,commission_cents INTEGER NOT NULL DEFAULT 0,net_cents INTEGER NOT NULL DEFAULT 0,settlement_id INTEGER,created_at TEXT NOT NULL,FOREIGN KEY(appointment_id) REFERENCES appointments(id),FOREIGN KEY(client_id) REFERENCES clients(id),FOREIGN KEY(staff_id) REFERENCES staff(id)); CREATE INDEX IF NOT EXISTS idx_cash_date ON cash_transactions(date); CREATE INDEX IF NOT EXISTS idx_cash_staff ON cash_transactions(staff_id,date);
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',price_cents INTEGER NOT NULL,stock INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL); CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE TABLE IF NOT EXISTS stock_movements(id INTEGER PRIMARY KEY AUTOINCREMENT,product_id INTEGER NOT NULL,quantity INTEGER NOT NULL,note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,FOREIGN KEY(product_id) REFERENCES products(id));
CREATE TABLE IF NOT EXISTS business_settings(id INTEGER PRIMARY KEY CHECK(id=1),business_name TEXT NOT NULL DEFAULT '',owner_name TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',whatsapp TEXT NOT NULL DEFAULT '',address TEXT NOT NULL DEFAULT '',logo_path TEXT NOT NULL DEFAULT '',currency TEXT NOT NULL DEFAULT 'BRL',timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',backup_destination TEXT NOT NULL DEFAULT '',configured INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT ''); INSERT OR IGNORE INTO business_settings(id) VALUES(1);
CREATE TABLE IF NOT EXISTS opening_hours(day_of_week INTEGER PRIMARY KEY,start_time TEXT NOT NULL DEFAULT '',end_time TEXT NOT NULL DEFAULT '',enabled INTEGER NOT NULL DEFAULT 1); INSERT OR IGNORE INTO opening_hours(day_of_week,start_time,end_time,enabled) VALUES(0,'08:00','12:00',1),(1,'18:00','20:30',1),(2,'18:00','20:30',1),(3,'18:00','20:30',1),(4,'18:00','20:30',1),(5,'18:00','20:30',1),(6,'08:00','20:30',1);").map_err(|e| e.to_string())?;

    for sql in [
        "ALTER TABLE clients ADD COLUMN active INTEGER NOT NULL DEFAULT 1",
        "ALTER TABLE staff ADD COLUMN product_commission_percent INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE cash_transactions ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'",
        "ALTER TABLE cash_transactions ADD COLUMN staff_name TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE cash_transactions ADD COLUMN sale_type TEXT NOT NULL DEFAULT 'other'",
        "ALTER TABLE cash_transactions ADD COLUMN commission_percent INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE cash_transactions ADD COLUMN commission_cents INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE cash_transactions ADD COLUMN net_cents INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE cash_transactions ADD COLUMN settlement_id INTEGER",
    ] { let _ = c.execute(sql, []); }
    let _ = c.execute("UPDATE cash_transactions SET net_cents=amount_cents WHERE kind='entrada' AND net_cents=0 AND commission_cents=0", []);
    let _ = c.execute("UPDATE cash_transactions SET net_cents=-amount_cents WHERE kind='despesa' AND net_cents=0", []);
    operations::ensure_schema(c)?;
    Ok(())
}

fn resolve_storage_root(app: &tauri::App) -> Result<(PathBuf, String), String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let dir = exe.parent().ok_or("Não foi possível localizar a pasta do executável")?;
    if dir.join("portable.flag").exists() {
        return Ok((dir.join("barbershop-data"), "portable".into()));
    }
    Ok((app.path().app_data_dir().map_err(|e| e.to_string())?, "installed".into()))
}
fn normalize_phone(v: &str) -> String { v.chars().filter(|c| c.is_ascii_digit()).collect() }
fn valid_date(v: &str) -> bool { chrono::NaiveDate::parse_from_str(v, "%Y-%m-%d").is_ok() }
fn time_to_minutes(v: &str) -> Option<i64> { let mut p=v.split(':'); let h:i64=p.next()?.parse().ok()?; let m:i64=p.next()?.parse().ok()?; if h>23||m>59 {None} else {Some(h*60+m)} }
fn overlaps(a:i64, ad:i64, b:i64, bd:i64) -> bool { a < b + bd && b < a + ad }
fn service_summary(c:&Connection, ids:&[i64]) -> Result<(Vec<(i64,String,i64,i64)>,i64,i64),String> {
    let u:Vec<i64>=ids.iter().copied().filter(|id|*id>0).collect::<HashSet<_>>().into_iter().collect();
    if u.is_empty(){return Err("Escolha pelo menos um serviço.".into())}
    let marks=std::iter::repeat("?").take(u.len()).collect::<Vec<_>>().join(",");
    let sql=format!("SELECT id,name,price_cents,duration_min FROM services WHERE active=1 AND id IN ({})",marks);
    let mut s=c.prepare(&sql).map_err(|e|e.to_string())?;
    let rows=s.query_map(params_from_iter(u.iter()),|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?))).map_err(|e|e.to_string())?;
    let v=rows.collect::<Result<Vec<(i64,String,i64,i64)>,_>>().map_err(|e|e.to_string())?;
    if v.len()!=u.len(){return Err("Um ou mais serviços estão indisponíveis.".into())}
    let dur=v.iter().map(|x|x.3).sum(); let total=v.iter().map(|x|x.2).sum(); Ok((v,dur,total))
}
fn slot_available(c:&Connection,date:&str,time:&str,duration:i64,staff_id:Option<i64>,exclude:Option<i64>)->Result<bool,String>{
    let start=time_to_minutes(time).ok_or("Horário inválido")?;
    let mut s=c.prepare("SELECT id,time,duration_min,staff_id FROM appointments WHERE date=?1 AND status<>'Cancelado'").map_err(|e|e.to_string())?;
    let rows=s.query_map(params![date],|r|Ok((r.get::<_,i64>(0)?,r.get::<_,String>(1)?,r.get::<_,i64>(2)?,r.get::<_,Option<i64>>(3)?))).map_err(|e|e.to_string())?;
    for row in rows { let(id,t,d,st)=row.map_err(|e|e.to_string())?; if exclude==Some(id){continue} if staff_id.is_some()&&st.is_some()&&staff_id!=st{continue} if let Some(o)=time_to_minutes(&t){if overlaps(start,duration,o,d){return Ok(false)}} }
    let mut b=c.prepare("SELECT time,staff_id FROM schedule_blocks WHERE date=?1").map_err(|e|e.to_string())?;
    let blocks=b.query_map(params![date],|r|Ok((r.get::<_,String>(0)?,r.get::<_,Option<i64>>(1)?))).map_err(|e|e.to_string())?;
    for row in blocks { let(t,st)=row.map_err(|e|e.to_string())?; if st.is_some()&&staff_id.is_some()&&st!=staff_id{continue} if t=="Dia inteiro"{return Ok(false)} if let Some(o)=time_to_minutes(&t){if overlaps(start,duration,o,30){return Ok(false)}} }
    Ok(true)
}
fn backup_dir(state:&DbState,c:&Connection)->PathBuf{let custom:String=c.query_row("SELECT backup_destination FROM business_settings WHERE id=1",[],|r|r.get(0)).unwrap_or_default();if custom.trim().is_empty(){PathBuf::from(&state.storage_root).join("backups")}else{PathBuf::from(custom)}}
fn backup_timestamp(path:&Path)->String{fs::metadata(path).and_then(|m|m.modified()).ok().map(|t|chrono::DateTime::<Local>::from(t).format("%Y-%m-%d %H:%M").to_string()).unwrap_or_default()}
fn staff_identity(c:&Connection,staff_id:Option<i64>)->Result<(String,i64,i64),String>{if let Some(id)=staff_id{c.query_row("SELECT name,commission_percent,product_commission_percent FROM staff WHERE id=?1 AND active=1",params![id],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?))).map_err(|_|"Colaborador não encontrado ou inativo.".to_string())}else{Ok((String::new(),0,0))}}
fn service_commission_percent(c:&Connection,staff_id:i64,service_id:Option<i64>,default_percent:i64)->Result<i64,String>{if let Some(sid)=service_id{let value=c.query_row("SELECT commission_percent FROM staff_service_commissions WHERE staff_id=?1 AND service_id=?2",params![staff_id,sid],|r|r.get::<_,i64>(0));match value{Ok(v)=>Ok(v.clamp(0,100)),Err(rusqlite::Error::QueryReturnedNoRows)=>Ok(default_percent.clamp(0,100)),Err(e)=>Err(e.to_string())}}else{Ok(default_percent.clamp(0,100))}}
fn appointment_commission(c:&Connection,appointment_id:i64,staff_id:i64,default_percent:i64)->Result<(i64,i64),String>{let mut stmt=c.prepare("SELECT service_id,price_cents FROM appointment_services WHERE appointment_id=?1").map_err(|e|e.to_string())?;let rows=stmt.query_map(params![appointment_id],|r|Ok((r.get::<_,i64>(0)?,r.get::<_,i64>(1)?))).map_err(|e|e.to_string())?;let mut gross=0;let mut commission=0;for row in rows{let(sid,price)=row.map_err(|e|e.to_string())?;let pct=service_commission_percent(c,staff_id,Some(sid),default_percent)?;gross+=price;commission+=price*pct/100}let effective=if gross>0{(commission*100/gross).clamp(0,100)}else{0};Ok((effective,commission))}
