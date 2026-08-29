use chrono::{Local, Utc};
use rusqlite::{params, params_from_iter, Connection};
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, fs, path::{Path, PathBuf}, sync::Mutex};
use tauri::{Manager, State};

mod maintenance;
mod opening_hours;
mod operations;

include!("model_core.rs");
include!("commands_base.rs");
include!("commands_finance.rs");
include!("commands_extra.rs");

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
            get_whatsapp_settings, save_whatsapp_settings, send_whatsapp_text,
            get_business_settings, save_business_settings,
            list_backups, create_backup, restore_backup,
            maintenance_report, maintenance_diagnosis, run_maintenance_repair, write_support_report
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o aplicativo desktop");
}
