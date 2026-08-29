use chrono::Local;
use rusqlite::{Connection, OptionalExtension};
use serde::Serialize;
use std::{fs, path::{Path, PathBuf}};

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MaintenanceCheck {
    pub key: String,
    pub label: String,
    pub status: String,
    pub detail: String,
    pub repairable: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MaintenanceDiagnosis {
    pub overall_status: String,
    pub checks: Vec<MaintenanceCheck>,
    pub recommended_actions: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RepairResult {
    pub action: String,
    pub success: bool,
    pub message: String,
    pub safety_backup: String,
}

fn scalar_text(connection: &Connection, sql: &str) -> Result<String, String> {
    connection
        .query_row(sql, [], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())
}

fn foreign_key_issues(connection: &Connection) -> Result<i64, String> {
    let mut stmt = connection.prepare("PRAGMA foreign_key_check").map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    let mut count = 0_i64;
    while rows.next().map_err(|e| e.to_string())?.is_some() {
        count += 1;
    }
    Ok(count)
}

fn negative_stock_count(connection: &Connection) -> Result<i64, String> {
    connection
        .query_row("SELECT COUNT(*) FROM products WHERE stock < 0", [], |row| row.get(0))
        .map_err(|e| e.to_string())
}

fn orphan_appointment_cash_count(connection: &Connection) -> Result<i64, String> {
    connection
        .query_row(
            "SELECT COUNT(*) FROM appointments a LEFT JOIN cash_transactions c ON c.id=a.cash_transaction_id WHERE a.cash_transaction_id IS NOT NULL AND c.id IS NULL",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())
}

fn invalid_commission_count(connection: &Connection) -> Result<i64, String> {
    connection
        .query_row(
            "SELECT (SELECT COUNT(*) FROM staff WHERE commission_percent < 0 OR commission_percent > 100 OR product_commission_percent < 0 OR product_commission_percent > 100) + (SELECT COUNT(*) FROM staff_service_commissions WHERE commission_percent < 0 OR commission_percent > 100)",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())
}

fn inconsistent_cash_count(connection: &Connection) -> Result<i64, String> {
    connection
        .query_row(
            "SELECT COUNT(*) FROM cash_transactions WHERE amount_cents < 0 OR commission_cents < 0 OR (kind='entrada' AND net_cents <> amount_cents - commission_cents) OR (kind='despesa' AND net_cents <> -amount_cents)",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())
}

fn schema_version(connection: &Connection) -> Result<i64, String> {
    connection
        .query_row("SELECT version FROM schema_meta WHERE id=1", [], |row| row.get(0))
        .map_err(|e| e.to_string())
}

pub fn diagnose(connection: &Connection, database_path: &Path) -> Result<MaintenanceDiagnosis, String> {
    let mut checks = Vec::new();
    let integrity = scalar_text(connection, "PRAGMA integrity_check")?;
    checks.push(MaintenanceCheck {
        key: "integrity".into(),
        label: "Integridade SQLite".into(),
        status: if integrity == "ok" { "ok".into() } else { "error".into() },
        detail: integrity.clone(),
        repairable: integrity != "ok",
    });

    let quick = scalar_text(connection, "PRAGMA quick_check")?;
    checks.push(MaintenanceCheck {
        key: "quick_check".into(),
        label: "Verificação rápida".into(),
        status: if quick == "ok" { "ok".into() } else { "warning".into() },
        detail: quick,
        repairable: true,
    });

    let fk = foreign_key_issues(connection)?;
    checks.push(MaintenanceCheck {
        key: "foreign_keys".into(),
        label: "Relacionamentos do banco".into(),
        status: if fk == 0 { "ok".into() } else { "error".into() },
        detail: if fk == 0 { "Nenhuma referência quebrada.".into() } else { format!("{} referência(s) quebrada(s).", fk) },
        repairable: fk > 0,
    });

    let stock = negative_stock_count(connection)?;
    checks.push(MaintenanceCheck {
        key: "stock".into(),
        label: "Estoque".into(),
        status: if stock == 0 { "ok".into() } else { "error".into() },
        detail: if stock == 0 { "Nenhum estoque negativo.".into() } else { format!("{} produto(s) com estoque negativo.", stock) },
        repairable: stock > 0,
    });

    let cash = inconsistent_cash_count(connection)?;
    checks.push(MaintenanceCheck {
        key: "cash".into(),
        label: "Consistência do Caixa".into(),
        status: if cash == 0 { "ok".into() } else { "warning".into() },
        detail: if cash == 0 { "Valores bruto, comissão e líquido consistentes.".into() } else { format!("{} lançamento(s) precisam de revisão/reparo.", cash) },
        repairable: cash > 0,
    });

    let orphan = orphan_appointment_cash_count(connection)?;
    checks.push(MaintenanceCheck {
        key: "appointments".into(),
        label: "Agenda x Caixa".into(),
        status: if orphan == 0 { "ok".into() } else { "warning".into() },
        detail: if orphan == 0 { "Vínculos entre atendimentos e Caixa íntegros.".into() } else { format!("{} atendimento(s) apontam para lançamento inexistente.", orphan) },
        repairable: orphan > 0,
    });

    let commission = invalid_commission_count(connection)?;
    checks.push(MaintenanceCheck {
        key: "commissions".into(),
        label: "Regras de comissão".into(),
        status: if commission == 0 { "ok".into() } else { "warning".into() },
        detail: if commission == 0 { "Percentuais dentro de 0% a 100%.".into() } else { format!("{} regra(s) fora do intervalo permitido.", commission) },
        repairable: commission > 0,
    });

    let version = schema_version(connection)?;
    checks.push(MaintenanceCheck {
        key: "schema".into(),
        label: "Versão do banco".into(),
        status: "ok".into(),
        detail: format!("Schema local v{}.", version),
        repairable: false,
    });

    let file_status = if database_path.exists() { "ok" } else { "error" };
    checks.push(MaintenanceCheck {
        key: "database_file".into(),
        label: "Arquivo de dados".into(),
        status: file_status.into(),
        detail: database_path.display().to_string(),
        repairable: false,
    });

    let has_error = checks.iter().any(|c| c.status == "error");
    let has_warning = checks.iter().any(|c| c.status == "warning");
    let overall_status = if has_error { "error" } else if has_warning { "warning" } else { "ok" };
    let mut recommended_actions = Vec::new();
    if integrity != "ok" { recommended_actions.push("Restaurar o último backup íntegro antes de continuar usando o sistema.".into()); }
    if fk > 0 { recommended_actions.push("Executar reparo seguro de referências após criar backup.".into()); }
    if cash > 0 { recommended_actions.push("Recalcular campos derivados do Caixa sem alterar o valor bruto histórico.".into()); }
    if stock > 0 { recommended_actions.push("Corrigir estoque negativo para zero e registrar a ocorrência no log.".into()); }
    if commission > 0 { recommended_actions.push("Limitar regras de comissão ao intervalo de 0% a 100%.".into()); }
    if recommended_actions.is_empty() { recommended_actions.push("Nenhuma correção necessária agora.".into()); }

    Ok(MaintenanceDiagnosis { overall_status: overall_status.into(), checks, recommended_actions })
}

pub fn create_safety_backup(connection: &Connection, backup_dir: &Path, prefix: &str) -> Result<PathBuf, String> {
    fs::create_dir_all(backup_dir).map_err(|e| e.to_string())?;
    connection.execute_batch("PRAGMA wal_checkpoint(FULL);").map_err(|e| e.to_string())?;
    let file = backup_dir.join(format!("{}-{}.db", prefix, Local::now().format("%Y%m%d-%H%M%S")));
    let escaped = file.display().to_string().replace('\'', "''");
    connection.execute_batch(&format!("VACUUM INTO '{}';", escaped)).map_err(|e| e.to_string())?;
    Ok(file)
}

pub fn run_safe_repair(connection: &Connection, backup_dir: &Path, action: &str) -> Result<RepairResult, String> {
    let safety = create_safety_backup(connection, backup_dir, "pre-repair")?;
    let result = match action {
        "checkpoint" => connection.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);"),
        "reindex" => connection.execute_batch("REINDEX; PRAGMA optimize;"),
        "optimize" => connection.execute_batch("PRAGMA optimize;"),
        "vacuum" => connection.execute_batch("VACUUM; PRAGMA optimize;"),
        "repair_cash" => connection.execute_batch(
            "UPDATE cash_transactions SET commission_cents=CASE WHEN commission_cents < 0 THEN 0 WHEN commission_cents > amount_cents THEN amount_cents ELSE commission_cents END; UPDATE cash_transactions SET net_cents=CASE WHEN kind='entrada' THEN amount_cents-commission_cents ELSE -amount_cents END;"
        ),
        "repair_stock" => connection.execute_batch("UPDATE products SET stock=0 WHERE stock < 0;"),
        "repair_commissions" => connection.execute_batch(
            "UPDATE staff SET commission_percent=MAX(0,MIN(100,commission_percent)), product_commission_percent=MAX(0,MIN(100,product_commission_percent)); UPDATE staff_service_commissions SET commission_percent=MAX(0,MIN(100,commission_percent));"
        ),
        "repair_appointment_links" => connection.execute_batch(
            "UPDATE appointments SET cash_transaction_id=NULL WHERE cash_transaction_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM cash_transactions c WHERE c.id=appointments.cash_transaction_id);"
        ),
        "standard_repair" => connection.execute_batch(
            "PRAGMA wal_checkpoint(FULL); REINDEX; UPDATE cash_transactions SET commission_cents=CASE WHEN commission_cents < 0 THEN 0 WHEN commission_cents > amount_cents THEN amount_cents ELSE commission_cents END; UPDATE cash_transactions SET net_cents=CASE WHEN kind='entrada' THEN amount_cents-commission_cents ELSE -amount_cents END; UPDATE products SET stock=0 WHERE stock < 0; UPDATE staff SET commission_percent=MAX(0,MIN(100,commission_percent)), product_commission_percent=MAX(0,MIN(100,product_commission_percent)); UPDATE staff_service_commissions SET commission_percent=MAX(0,MIN(100,commission_percent)); UPDATE appointments SET cash_transaction_id=NULL WHERE cash_transaction_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM cash_transactions c WHERE c.id=appointments.cash_transaction_id); PRAGMA optimize;"
        ),
        _ => return Err("Ação de manutenção desconhecida.".into()),
    };

    result.map_err(|e| e.to_string())?;
    Ok(RepairResult {
        action: action.into(),
        success: true,
        message: "Manutenção concluída. Um backup de segurança foi criado antes da alteração.".into(),
        safety_backup: safety.display().to_string(),
    })
}

pub fn write_support_report(log_dir: &Path, diagnosis: &MaintenanceDiagnosis, database_path: &Path, storage_mode: &str) -> Result<String, String> {
    fs::create_dir_all(log_dir).map_err(|e| e.to_string())?;
    let path = log_dir.join(format!("diagnostico-{}.txt", Local::now().format("%Y%m%d-%H%M%S")));
    let mut text = String::new();
    text.push_str("GESTAO DA BARBEARIA - RELATORIO DE DIAGNOSTICO\n");
    text.push_str(&format!("Data: {}\n", Local::now().format("%d/%m/%Y %H:%M:%S")));
    text.push_str(&format!("Modo: {}\n", storage_mode));
    text.push_str(&format!("Banco: {}\n", database_path.display()));
    text.push_str(&format!("Status geral: {}\n\n", diagnosis.overall_status));
    for check in &diagnosis.checks {
        text.push_str(&format!("[{}] {} - {}\n", check.status.to_uppercase(), check.label, check.detail));
    }
    text.push_str("\nAções recomendadas:\n");
    for action in &diagnosis.recommended_actions { text.push_str(&format!("- {}\n", action)); }
    fs::write(&path, text).map_err(|e| e.to_string())?;
    Ok(path.display().to_string())
}

pub fn last_backup_path(connection: &Connection) -> Option<String> {
    connection
        .query_row("SELECT backup_destination FROM business_settings WHERE id=1", [], |row| row.get::<_, String>(0))
        .optional()
        .ok()
        .flatten()
}
