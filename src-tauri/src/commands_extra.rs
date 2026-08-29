#[derive(Deserialize)]
#[serde(rename_all="camelCase")]
struct EditAppointmentFullInput { id:i64, client_id:Option<i64>, client_name:String, phone:String, staff_id:Option<i64>, service_ids:Vec<i64>, date:String, time:String, note:Option<String> }

#[tauri::command]
fn edit_appointment_full(state:State<DbState>,input:EditAppointmentFullInput)->Result<(),String>{
    let mut c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    let status:String=c.query_row("SELECT status FROM appointments WHERE id=?1",params![input.id],|r|r.get(0)).map_err(|_|"Agendamento não encontrado.".to_string())?;
    if status=="Finalizado"||status=="Cancelado"{return Err("Atendimento finalizado/cancelado não pode ser alterado diretamente. Exclua/corrija o lançamento ou faça um novo agendamento.".into())}
    let(services,dur,total)=service_summary(&c,&input.service_ids)?;
    if !slot_available(&c,&input.date,&input.time,dur,input.staff_id,Some(input.id))?{return Err("Este horário conflita com outro atendimento ou bloqueio.".into())}
    let name=input.client_name.trim();if name.is_empty(){return Err("Informe o cliente.".into())}
    let phone=normalize_phone(&input.phone);
    let staff_name=if let Some(id)=input.staff_id{c.query_row("SELECT name FROM staff WHERE id=?1 AND active=1",params![id],|r|r.get::<_,String>(0)).map_err(|_|"Colaborador indisponível".to_string())?}else{"Sem colaborador definido".into()};
    let names=services.iter().map(|x|x.1.clone()).collect::<Vec<_>>().join(" + ");let note=input.note.unwrap_or_default();
    let tx=c.transaction().map_err(|e|e.to_string())?;
    tx.execute("UPDATE appointments SET client_id=?1,client_name=?2,phone=?3,staff_id=?4,staff_name=?5,service_names=?6,date=?7,time=?8,duration_min=?9,total_cents=?10,note=?11 WHERE id=?12",params![input.client_id,name,phone,input.staff_id,staff_name,names,input.date,input.time,dur,total,note,input.id]).map_err(|e|e.to_string())?;
    tx.execute("DELETE FROM appointment_services WHERE appointment_id=?1",params![input.id]).map_err(|e|e.to_string())?;
    for(sid,sname,price,d) in &services {tx.execute("INSERT INTO appointment_services(appointment_id,service_id,service_name,price_cents,duration_min) VALUES(?1,?2,?3,?4,?5)",params![input.id,sid,sname,price,d]).map_err(|e|e.to_string())?;}
    tx.commit().map_err(|e|e.to_string())?;Ok(())
}

#[tauri::command] fn list_opening_hours_cmd(state:State<DbState>)->Result<Vec<opening_hours::OpeningHour>,String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;opening_hours::list(&c)}
#[tauri::command] fn save_opening_hours_cmd(state:State<DbState>,rows:Vec<opening_hours::OpeningHour>)->Result<(),String>{let mut c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;opening_hours::save(&mut c,rows)}

#[tauri::command] fn update_client_record(state:State<DbState>,input:operations::UpdateClientInput)->Result<(),String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::update_client(&c,input)}
#[tauri::command] fn set_client_active(state:State<DbState>,id:i64,active:bool)->Result<(),String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::set_client_active(&c,id,active)}
#[tauri::command] fn delete_client_safe(state:State<DbState>,id:i64)->Result<(),String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::delete_client_safe(&c,id)}
#[tauri::command] fn update_service_record(state:State<DbState>,input:operations::UpdateServiceInput)->Result<(),String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::update_service(&c,input)}
#[tauri::command] fn set_service_active(state:State<DbState>,id:i64,active:bool)->Result<(),String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::set_service_active(&c,id,active)}
#[tauri::command] fn delete_service_safe(state:State<DbState>,id:i64)->Result<(),String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::delete_service_safe(&c,id)}
#[tauri::command] fn update_staff_record(state:State<DbState>,input:operations::UpdateStaffInput)->Result<(),String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::update_staff(&c,input)}
#[tauri::command] fn set_staff_active(state:State<DbState>,id:i64,active:bool)->Result<(),String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::set_staff_active(&c,id,active)}
#[tauri::command] fn delete_staff_safe(state:State<DbState>,id:i64)->Result<(),String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::delete_staff_safe(&c,id)}
#[tauri::command] fn update_product_record(state:State<DbState>,input:operations::UpdateProductInput)->Result<(),String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::update_product(&c,input)}
#[tauri::command] fn set_product_active(state:State<DbState>,id:i64,active:bool)->Result<(),String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::set_product_active(&c,id,active)}
#[tauri::command] fn delete_product_safe(state:State<DbState>,id:i64)->Result<(),String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::delete_product_safe(&c,id)}
#[tauri::command] fn archived_items(state:State<DbState>,kind:String)->Result<Vec<operations::ArchivedItem>,String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::archived_items(&c,&kind)}
#[tauri::command] fn restore_archived(state:State<DbState>,kind:String,id:i64)->Result<(),String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::restore_archived(&c,&kind,id)}

#[tauri::command] fn update_cash_record(state:State<DbState>,input:operations::UpdateCashInput)->Result<(),String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::update_cash_manual(&c,input)}
#[tauri::command] fn delete_cash_record(state:State<DbState>,id:i64)->Result<(),String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::delete_cash_transaction(&c,id)}

#[tauri::command] fn create_staff_settlement(state:State<DbState>,staff_id:i64,start_date:String,end_date:String)->Result<operations::StaffSettlement,String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::create_staff_settlement(&c,staff_id,&start_date,&end_date)}
#[tauri::command] fn list_staff_settlements(state:State<DbState>,staff_id:i64)->Result<Vec<operations::StaffSettlement>,String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::list_staff_settlements(&c,staff_id)}
#[tauri::command] fn reopen_staff_settlement(state:State<DbState>,id:i64)->Result<(),String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::reopen_staff_settlement(&c,id)}

#[tauri::command] fn remarketing_clients(state:State<DbState>,minimum_days:i64,reference_date:String)->Result<Vec<operations::RemarketingClient>,String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::remarketing_clients(&c,minimum_days,&reference_date)}
#[tauri::command] fn get_whatsapp_settings(state:State<DbState>)->Result<operations::WhatsAppSettings,String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::get_whatsapp_settings(&c)}
#[tauri::command] fn save_whatsapp_settings(state:State<DbState>,input:operations::WhatsAppSettings)->Result<operations::WhatsAppSettings,String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::save_whatsapp_settings(&c,input)}
#[tauri::command] fn send_whatsapp_text(state:State<DbState>,client_id:Option<i64>,phone:String,message_type:String,text:String)->Result<operations::WhatsAppSendResult,String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;operations::send_whatsapp_text(&c,client_id,phone,message_type,text)}

#[tauri::command] fn maintenance_diagnosis(state:State<DbState>)->Result<maintenance::MaintenanceDiagnosis,String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;maintenance::diagnose(&c,Path::new(&state.database_path))}
#[tauri::command] fn run_maintenance_repair(state:State<DbState>,action:String)->Result<maintenance::RepairResult,String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;let dir=PathBuf::from(&state.storage_root).join("backups");maintenance::run_safe_repair(&c,&dir,&action)}
#[tauri::command] fn write_support_report(state:State<DbState>)->Result<String,String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;let diagnosis=maintenance::diagnose(&c,Path::new(&state.database_path))?;let dir=PathBuf::from(&state.storage_root).join("logs");maintenance::write_support_report(&dir,&diagnosis,Path::new(&state.database_path),&state.storage_mode)}
