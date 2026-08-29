#[tauri::command]
fn health(state: State<DbState>) -> Result<Health, String> {
    let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    let v=c.query_row("SELECT version FROM schema_meta WHERE id=1",[],|r|r.get(0)).map_err(|e|e.to_string())?;
    Ok(Health{storage_mode:state.storage_mode.clone(),database_path:state.database_path.clone(),schema_version:v})
}

#[tauri::command]
fn list_clients(state:State<DbState>)->Result<Vec<Client>,String>{
    let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    operations::ensure_schema(&c)?;
    let mut s=c.prepare("SELECT id,name,phone,birth_date,created_at FROM clients WHERE COALESCE(active,1)=1 ORDER BY name COLLATE NOCASE").map_err(|e|e.to_string())?;
    let rows=s.query_map([],|r|Ok(Client{id:r.get(0)?,name:r.get(1)?,phone:r.get(2)?,birth_date:r.get(3)?,created_at:r.get(4)?})).map_err(|e|e.to_string())?;
    rows.collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())
}
#[tauri::command]
fn create_client(state:State<DbState>,input:CreateClientInput)->Result<Client,String>{
    let name=input.name.trim(); let phone=normalize_phone(&input.phone);
    if name.is_empty(){return Err("Informe o nome do cliente.".into())}
    if phone.len()<8{return Err("Informe um telefone válido.".into())}
    let birth=input.birth_date.unwrap_or_default(); let created=Utc::now().to_rfc3339();
    let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    operations::ensure_schema(&c)?;
    c.execute("INSERT INTO clients(name,phone,birth_date,active,created_at) VALUES(?1,?2,?3,1,?4)",params![name,phone,birth,created]).map_err(|e|e.to_string())?;
    Ok(Client{id:c.last_insert_rowid(),name:name.into(),phone,birth_date:birth,created_at:created})
}

#[tauri::command]
fn list_services(state:State<DbState>)->Result<Vec<Service>,String>{
    let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    let mut s=c.prepare("SELECT id,name,price_cents,duration_min,active FROM services WHERE active=1 ORDER BY name COLLATE NOCASE").map_err(|e|e.to_string())?;
    let rows=s.query_map([],|r|Ok(Service{id:r.get(0)?,name:r.get(1)?,price_cents:r.get(2)?,duration_min:r.get(3)?,active:r.get::<_,i64>(4)?!=0})).map_err(|e|e.to_string())?;
    rows.collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())
}
#[tauri::command]
fn create_service(state:State<DbState>,input:CreateServiceInput)->Result<Service,String>{
    let name=input.name.trim(); if name.is_empty(){return Err("Informe o nome do serviço.".into())}
    if input.price_cents<=0{return Err("Informe um preço maior que zero.".into())}
    if input.duration_min<5{return Err("A duração mínima é de 5 minutos.".into())}
    let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    c.execute("INSERT INTO services(name,price_cents,duration_min,active) VALUES(?1,?2,?3,1)",params![name,input.price_cents,input.duration_min]).map_err(|e|e.to_string())?;
    Ok(Service{id:c.last_insert_rowid(),name:name.into(),price_cents:input.price_cents,duration_min:input.duration_min,active:true})
}

#[tauri::command]
fn list_staff(state:State<DbState>)->Result<Vec<Staff>,String>{
    let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    let mut s=c.prepare("SELECT id,name,phone,commission_percent,product_commission_percent,active,owner FROM staff WHERE active=1 ORDER BY owner DESC,name COLLATE NOCASE").map_err(|e|e.to_string())?;
    let rows=s.query_map([],|r|Ok(Staff{id:r.get(0)?,name:r.get(1)?,phone:r.get(2)?,commission_percent:r.get(3)?,product_commission_percent:r.get(4)?,active:r.get::<_,i64>(5)?!=0,owner:r.get::<_,i64>(6)?!=0})).map_err(|e|e.to_string())?;
    rows.collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())
}
#[tauri::command]
fn create_staff(state:State<DbState>,input:CreateStaffInput)->Result<Staff,String>{
    let name=input.name.trim(); if name.is_empty(){return Err("Informe o nome do colaborador.".into())}
    let phone=normalize_phone(&input.phone.unwrap_or_default());
    let commission=input.commission_percent.unwrap_or(40).clamp(0,100);
    let product_commission=input.product_commission_percent.unwrap_or(0).clamp(0,100);
    let owner=input.owner.unwrap_or(false);
    let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    c.execute("INSERT INTO staff(name,phone,commission_percent,product_commission_percent,active,owner,created_at) VALUES(?1,?2,?3,?4,1,?5,?6)",params![name,phone,commission,product_commission,if owner{1}else{0},Utc::now().to_rfc3339()]).map_err(|e|e.to_string())?;
    Ok(Staff{id:c.last_insert_rowid(),name:name.into(),phone,commission_percent:commission,product_commission_percent:product_commission,active:true,owner})
}
#[tauri::command]
fn list_staff_service_commissions(state:State<DbState>,staff_id:i64)->Result<Vec<StaffServiceCommission>,String>{
    let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    let mut s=c.prepare("SELECT s.id,s.name,COALESCE(ssc.commission_percent,st.commission_percent) FROM services s JOIN staff st ON st.id=?1 LEFT JOIN staff_service_commissions ssc ON ssc.staff_id=st.id AND ssc.service_id=s.id WHERE s.active=1 ORDER BY s.name COLLATE NOCASE").map_err(|e|e.to_string())?;
    let rows=s.query_map(params![staff_id],|r|Ok(StaffServiceCommission{staff_id,service_id:r.get(0)?,service_name:r.get(1)?,commission_percent:r.get(2)?})).map_err(|e|e.to_string())?;
    rows.collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())
}
#[tauri::command]
fn set_staff_service_commission(state:State<DbState>,input:SetStaffServiceCommissionInput)->Result<(),String>{
    if !(0..=100).contains(&input.commission_percent){return Err("Percentual inválido.".into())}
    let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    c.execute("INSERT INTO staff_service_commissions(staff_id,service_id,commission_percent) VALUES(?1,?2,?3) ON CONFLICT(staff_id,service_id) DO UPDATE SET commission_percent=excluded.commission_percent",params![input.staff_id,input.service_id,input.commission_percent]).map_err(|e|e.to_string())?; Ok(())
}
#[tauri::command]
fn staff_performance(state:State<DbState>,start:Option<String>,end:Option<String>)->Result<Vec<StaffPerformance>,String>{
    let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?; operations::ensure_schema(&c)?;
    let a=start.unwrap_or_else(||"0000-01-01".into()); let b=end.unwrap_or_else(||"9999-12-31".into());
    let mut s=c.prepare("SELECT st.id,st.name,COALESCE(SUM(ct.amount_cents),0),COALESCE(SUM(ct.commission_cents),0),COALESCE(SUM(ct.net_cents),0),COALESCE(SUM(CASE WHEN ct.sale_type='service' THEN 1 ELSE 0 END),0),COALESCE(SUM(CASE WHEN ct.sale_type='product' THEN 1 ELSE 0 END),0) FROM staff st LEFT JOIN cash_transactions ct ON ct.staff_id=st.id AND ct.kind='entrada' AND ct.date BETWEEN ?1 AND ?2 AND ct.settlement_id IS NULL WHERE st.active=1 GROUP BY st.id,st.name ORDER BY st.name COLLATE NOCASE").map_err(|e|e.to_string())?;
    let rows=s.query_map(params![a,b],|r|Ok(StaffPerformance{staff_id:r.get(0)?,staff_name:r.get(1)?,gross_cents:r.get(2)?,commission_cents:r.get(3)?,net_cents:r.get(4)?,service_sales:r.get(5)?,product_sales:r.get(6)?})).map_err(|e|e.to_string())?;
    rows.collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())
}

#[tauri::command]
fn availability(state:State<DbState>,input:AvailabilityInput)->Result<Availability,String>{
    let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    let(_,dur,total)=service_summary(&c,&input.service_ids)?;
    let(start,end)=opening_hours::operating_window(&c,&input.date)?.ok_or("A barbearia está configurada como fechada neste dia.")?;
    let today=Local::now().format("%Y-%m-%d").to_string();
    let now=Local::now().format("%H").to_string().parse::<i64>().unwrap_or(0)*60+Local::now().format("%M").to_string().parse::<i64>().unwrap_or(0);
    let mut out=Vec::new(); let mut m=start;
    while m<end {
        if !(input.date==today&&m<=now){let t=format!("{:02}:{:02}",m/60,m%60);if slot_available(&c,&input.date,&t,dur,input.staff_id,None)?{out.push(t)}}
        m+=30;
    }
    Ok(Availability{duration_min:dur,total_cents:total,available_times:out})
}

#[tauri::command]
fn list_appointments(state:State<DbState>,date:Option<String>)->Result<Vec<Appointment>,String>{
    let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    let sql=if date.is_some(){"SELECT id,client_id,client_name,phone,staff_id,staff_name,service_names,date,time,duration_min,total_cents,status,payment_method,note,cash_transaction_id,created_at FROM appointments WHERE date=?1 ORDER BY time"}else{"SELECT id,client_id,client_name,phone,staff_id,staff_name,service_names,date,time,duration_min,total_cents,status,payment_method,note,cash_transaction_id,created_at FROM appointments ORDER BY date DESC,time DESC LIMIT 250"};
    let mut s=c.prepare(sql).map_err(|e|e.to_string())?;
    let map=|r:&rusqlite::Row|Ok(Appointment{id:r.get(0)?,client_id:r.get(1)?,client_name:r.get(2)?,phone:r.get(3)?,staff_id:r.get(4)?,staff_name:r.get(5)?,service_names:r.get(6)?,date:r.get(7)?,time:r.get(8)?,duration_min:r.get(9)?,total_cents:r.get(10)?,status:r.get(11)?,payment_method:r.get(12)?,note:r.get(13)?,cash_transaction_id:r.get(14)?,created_at:r.get(15)?});
    if let Some(d)=date {let rows=s.query_map(params![d],map).map_err(|e|e.to_string())?;rows.collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())}
    else {let rows=s.query_map([],map).map_err(|e|e.to_string())?;rows.collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())}
}
#[tauri::command]
fn create_appointment(state:State<DbState>,input:CreateAppointmentInput)->Result<Appointment,String>{
    let mut c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    let(services,dur,total)=service_summary(&c,&input.service_ids)?;
    if !slot_available(&c,&input.date,&input.time,dur,input.staff_id,None)?{return Err("Este horário não está disponível.".into())}
    let name=input.client_name.trim(); if name.is_empty(){return Err("Informe o cliente.".into())}
    let phone=normalize_phone(&input.phone);
    let staff_name=if let Some(id)=input.staff_id{c.query_row("SELECT name FROM staff WHERE id=?1 AND active=1",params![id],|r|r.get::<_,String>(0)).map_err(|_|"Colaborador indisponível".to_string())?}else{"Sem colaborador definido".into()};
    let names=services.iter().map(|x|x.1.clone()).collect::<Vec<_>>().join(" + "); let note=input.note.unwrap_or_default(); let created=Utc::now().to_rfc3339();
    let tx=c.transaction().map_err(|e|e.to_string())?;
    tx.execute("INSERT INTO appointments(client_id,client_name,phone,staff_id,staff_name,service_names,date,time,duration_min,total_cents,status,payment_method,note,created_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,'Pendente','',?11,?12)",params![input.client_id,name,phone,input.staff_id,staff_name,names,input.date,input.time,dur,total,note,created]).map_err(|e|e.to_string())?;
    let id=tx.last_insert_rowid();
    for(sid,sname,price,d) in &services {tx.execute("INSERT INTO appointment_services(appointment_id,service_id,service_name,price_cents,duration_min) VALUES(?1,?2,?3,?4,?5)",params![id,sid,sname,price,d]).map_err(|e|e.to_string())?;}
    tx.commit().map_err(|e|e.to_string())?;
    Ok(Appointment{id,client_id:input.client_id,client_name:name.into(),phone,staff_id:input.staff_id,staff_name,service_names:names,date:input.date,time:input.time,duration_min:dur,total_cents:total,status:"Pendente".into(),payment_method:"".into(),note,cash_transaction_id:None,created_at:created})
}
#[tauri::command]
fn update_appointment(state:State<DbState>,input:UpdateAppointmentInput)->Result<(),String>{
    let mut c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    if !["Pendente","Confirmado","Finalizado","Cancelado"].contains(&input.status.as_str()){return Err("Status inválido.".into())}
    let cur=c.query_row("SELECT client_id,client_name,staff_id,service_names,total_cents,date,cash_transaction_id FROM appointments WHERE id=?1",params![input.id],|r|Ok((r.get::<_,Option<i64>>(0)?,r.get::<_,String>(1)?,r.get::<_,Option<i64>>(2)?,r.get::<_,String>(3)?,r.get::<_,i64>(4)?,r.get::<_,String>(5)?,r.get::<_,Option<i64>>(6)?))).map_err(|_|"Agendamento não encontrado".to_string())?;
    let payment=input.payment_method.unwrap_or_default(); let note=input.note.unwrap_or_default(); let mut commission_percent=0; let mut commission_cents=0; let mut staff_name=String::new();
    if let Some(staff_id)=cur.2{let(identity,default_percent,_)=staff_identity(&c,Some(staff_id))?;staff_name=identity;let calc=appointment_commission(&c,input.id,staff_id,default_percent)?;commission_percent=calc.0;commission_cents=calc.1}
    let tx=c.transaction().map_err(|e|e.to_string())?; let mut cash_id=cur.6;
    if input.status=="Finalizado"&&cash_id.is_none(){
        if payment.trim().is_empty(){return Err("Informe a forma de pagamento.".into())}
        let net=cur.4-commission_cents;
        tx.execute("INSERT INTO cash_transactions(kind,description,amount_cents,date,appointment_id,client_id,staff_id,staff_name,payment_method,source,sale_type,commission_percent,commission_cents,net_cents,settlement_id,created_at) VALUES('entrada',?1,?2,?3,?4,?5,?6,?7,?8,'atendimento','service',?9,?10,?11,NULL,?12)",params![format!("{} — {}",cur.3,cur.1),cur.4,cur.5,input.id,cur.0,cur.2,staff_name,payment,commission_percent,commission_cents,net,Utc::now().to_rfc3339()]).map_err(|e|e.to_string())?;
        cash_id=Some(tx.last_insert_rowid());
    }
    tx.execute("UPDATE appointments SET status=?1,payment_method=CASE WHEN ?2='' THEN payment_method ELSE ?2 END,note=CASE WHEN ?3='' THEN note ELSE ?3 END,cash_transaction_id=?4 WHERE id=?5",params![input.status,payment,note,cash_id,input.id]).map_err(|e|e.to_string())?;
    tx.commit().map_err(|e|e.to_string())?; Ok(())
}

#[tauri::command]
fn list_schedule_blocks(state:State<DbState>,date:Option<String>)->Result<Vec<ScheduleBlock>,String>{
    let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    let mut s=c.prepare("SELECT id,date,time,staff_id,reason FROM schedule_blocks WHERE (?1 IS NULL OR date=?1) ORDER BY date,time").map_err(|e|e.to_string())?;
    let rows=s.query_map(params![date],|r|Ok(ScheduleBlock{id:r.get(0)?,date:r.get(1)?,time:r.get(2)?,staff_id:r.get(3)?,reason:r.get(4)?})).map_err(|e|e.to_string())?;
    rows.collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())
}
#[tauri::command]
fn create_schedule_block(state:State<DbState>,input:CreateScheduleBlockInput)->Result<ScheduleBlock,String>{
    let reason=input.reason.trim(); if reason.is_empty(){return Err("Informe o motivo do bloqueio.".into())}
    let time=input.time.unwrap_or_else(||"Dia inteiro".into()); if time!="Dia inteiro"&&time_to_minutes(&time).is_none(){return Err("Horário inválido.".into())}
    let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    c.execute("INSERT INTO schedule_blocks(date,time,staff_id,reason,created_at) VALUES(?1,?2,?3,?4,?5)",params![input.date,time,input.staff_id,reason,Utc::now().to_rfc3339()]).map_err(|e|e.to_string())?;
    Ok(ScheduleBlock{id:c.last_insert_rowid(),date:input.date,time,staff_id:input.staff_id,reason:reason.into()})
}
