use chrono::{Local, Utc};
use rusqlite::{params, params_from_iter, Connection};
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, fs, path::{Path, PathBuf}, sync::Mutex};
use tauri::{Manager, State};

mod backups;
mod maintenance;
mod opening_hours;
mod operations;
mod secrets;
mod updates;

include!("model_core.rs");
include!("commands_base.rs");
include!("commands_finance.rs");
include!("commands_extra.rs");

/// Backup automático: 30 s depois de abrir e depois a cada hora, verifica se o último
/// backup tem mais de 24 h e, se tiver, cria um novo (mantendo os 14 automáticos mais recentes).
fn start_auto_backup(handle: tauri::AppHandle) {
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_secs(30));
        loop {
            let state = handle.state::<DbState>();
            if let Ok(c) = state.connection.lock() {
                let primary = backup_dir(&state, &c);
                let fallback = PathBuf::from(&state.storage_root).join("backups");
                if let Err(e) = backups::run_auto_backup(&c, &primary, &fallback, std::time::SystemTime::now()) {
                    let log = PathBuf::from(&state.storage_root).join("logs").join("backup-automatico.log");
                    let _ = fs::write(log, format!("{} {}\n", Local::now().format("%Y-%m-%d %H:%M"), e));
                }
            }
            std::thread::sleep(std::time::Duration::from_secs(60 * 60));
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(updates::plugin())
        .setup(|app| {
            let (root, mode) = resolve_storage_root(app).map_err(std::io::Error::other)?;
            for p in ["data", "backups", "logs", "assets", "config"] {
                fs::create_dir_all(root.join(p))?;
            }
            let db = root.join("data").join("barbershop.db");
            let c = Connection::open(&db).map_err(std::io::Error::other)?;
            initialize_database(&c).map_err(std::io::Error::other)?;
            app.manage(DbState {
                connection: Mutex::new(c),
                database_path: db.display().to_string(),
                storage_mode: mode,
                storage_root: root.display().to_string(),
            });
            start_auto_backup(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            health,
            list_clients, create_client, update_client_record, set_client_active, delete_client_safe,
            list_services, create_service, update_service_record, set_service_active, delete_service_safe,
            list_staff, create_staff, update_staff_record, set_staff_active, delete_staff_safe,
            list_staff_service_commissions, set_staff_service_commission, staff_performance,
            create_staff_settlement, list_staff_settlements, reopen_staff_settlement,
            availability, list_appointments, create_appointment, edit_appointment_full, update_appointment,
            list_schedule_blocks, create_schedule_block,
            list_cash_transactions, create_cash_transaction, update_cash_record, delete_cash_record,
            monthly_report,
            list_products, create_product, update_product_record, set_product_active, delete_product_safe, adjust_stock,
            archived_items, restore_archived,
            list_opening_hours_cmd, save_opening_hours_cmd,
            remarketing_clients,
            get_whatsapp_settings, save_whatsapp_settings, send_whatsapp_text, open_whatsapp_link,
            get_business_settings, save_business_settings,
            list_backups, create_backup, restore_backup,
            maintenance_report, maintenance_diagnosis, run_maintenance_repair, write_support_report,
            check_update, install_update, open_download_page
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o aplicativo desktop");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn db() -> Connection {
        let c = Connection::open_in_memory().unwrap();
        initialize_database(&c).unwrap();
        c
    }

    #[test]
    fn editar_despesa_mantem_liquido_negativo() {
        let c = db();
        c.execute("INSERT INTO cash_transactions(kind,description,amount_cents,date,source,sale_type,net_cents,created_at) VALUES('despesa','Aluguel',5000,'2026-11-01','manual','other',-5000,'x')", []).unwrap();
        let id = c.last_insert_rowid();
        operations::update_cash_manual(&c, operations::UpdateCashInput { id, description: "Aluguel nov".into(), amount_cents: 6000, date: "2026-11-02".into(), payment_method: None, client_id: None, staff_id: None }).unwrap();
        let (net, com): (i64, i64) = c.query_row("SELECT net_cents,commission_cents FROM cash_transactions WHERE id=?1", params![id], |r| Ok((r.get(0)?, r.get(1)?))).unwrap();
        assert_eq!((net, com), (-6000, 0));
    }

    #[test]
    fn editar_lancamento_rejeita_data_invalida() {
        let c = db();
        c.execute("INSERT INTO cash_transactions(kind,description,amount_cents,date,source,sale_type,net_cents,created_at) VALUES('entrada','Corte',3000,'2026-11-01','manual','service',3000,'x')", []).unwrap();
        let id = c.last_insert_rowid();
        let r = operations::update_cash_manual(&c, operations::UpdateCashInput { id, description: "Corte".into(), amount_cents: 3000, date: "31/11/2026".into(), payment_method: None, client_id: None, staff_id: None });
        assert!(r.is_err());
    }

    #[test]
    fn whatsapp_token_nao_vai_para_tela_e_branco_mantem() {
        let c = db();
        let mut s = operations::get_whatsapp_settings(&c).unwrap();
        s.access_token = "EAAB-token-secreto".into();
        s.api_version = "v23.0".into();
        s.phone_number_id = "123456".into();
        let saved = operations::save_whatsapp_settings(&c, s.clone()).unwrap();
        assert_eq!(saved.access_token, "");
        assert!(saved.has_access_token);
        s.access_token = "".into();
        operations::save_whatsapp_settings(&c, s.clone()).unwrap();
        assert_eq!(operations::get_whatsapp_settings(&c).unwrap().access_token, "EAAB-token-secreto");
    }

    #[test]
    fn whatsapp_rejeita_url_que_nao_e_da_meta() {
        let c = db();
        let mut s = operations::get_whatsapp_settings(&c).unwrap();
        s.api_base_url = "https://servidor-estranho.com".into();
        assert!(operations::save_whatsapp_settings(&c, s.clone()).is_err());
        s.api_base_url = "https://graph.facebook.com".into();
        s.api_version = "v23.0/../../outro".into();
        assert!(operations::save_whatsapp_settings(&c, s).is_err());
    }

    #[test]
    fn whatsapp_desativado_nao_cria_log_pendente() {
        let c = db();
        assert!(operations::prepare_whatsapp_send(&c, None, "11999998888", "teste", "oi").is_err());
        let n: i64 = c.query_row("SELECT COUNT(*) FROM whatsapp_messages", [], |r| r.get(0)).unwrap();
        assert_eq!(n, 0);
    }

    #[test]
    fn token_salvo_fica_no_cofre_e_nao_no_banco() {
        let c = db();
        let mut s = operations::get_whatsapp_settings(&c).unwrap();
        s.access_token = "EAAB-cofre".into();
        operations::save_whatsapp_settings(&c, s).unwrap();
        let no_banco: String = c.query_row("SELECT access_token FROM whatsapp_settings WHERE id=1", [], |r| r.get(0)).unwrap();
        assert_eq!(no_banco, "", "o token não pode ficar gravado no banco (iria junto nos backups)");
        assert_eq!(operations::get_whatsapp_settings(&c).unwrap().access_token, "EAAB-cofre");
    }

    #[test]
    fn token_antigo_no_banco_e_migrado_para_o_cofre() {
        let c = db();
        c.execute("UPDATE whatsapp_settings SET access_token='EAAB-legado' WHERE id=1", []).unwrap();
        let s = operations::get_whatsapp_settings(&c).unwrap();
        assert_eq!(s.access_token, "EAAB-legado");
        assert!(s.has_access_token);
        let no_banco: String = c.query_row("SELECT access_token FROM whatsapp_settings WHERE id=1", [], |r| r.get(0)).unwrap();
        assert_eq!(no_banco, "");
        assert_eq!(operations::get_whatsapp_settings(&c).unwrap().access_token, "EAAB-legado");
    }

    #[test]
    fn cada_banco_tem_sua_propria_referencia_no_cofre() {
        let a = db();
        let b = db();
        let mut s = operations::get_whatsapp_settings(&a).unwrap();
        s.access_token = "EAAB-so-do-a".into();
        operations::save_whatsapp_settings(&a, s).unwrap();
        assert!(!operations::get_whatsapp_settings(&b).unwrap().has_access_token);
    }

    #[test]
    fn link_do_whatsapp_tem_ddi_e_mensagem_codificada() {
        let url = operations::whatsapp_link("(11) 99999-8888", "Olá, Diego! 10:00 & tudo").unwrap();
        assert_eq!(url, "https://wa.me/5511999998888?text=Ol%C3%A1%2C%20Diego%21%2010%3A00%20%26%20tudo");
        assert!(operations::whatsapp_link("5511999998888", "x").unwrap().starts_with("https://wa.me/5511999998888?"));
        assert!(operations::whatsapp_link("9999-8888", "x").is_err());
    }
}