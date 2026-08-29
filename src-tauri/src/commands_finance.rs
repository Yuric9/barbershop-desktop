#[tauri::command]
fn list_cash_transactions(state:State<DbState>,start:Option<String>,end:Option<String>)->Result<Vec<CashTransaction>,String>{
    let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?; operations::ensure_schema(&c)?;
    let a=start.unwrap_or_else(||"0000-01-01".into()); let b=end.unwrap_or_else(||"9999-12-31".into());
    let mut s=c.prepare("SELECT id,kind,description,amount_cents,date,payment_method,client_id,staff_id,staff_name,source,sale_type,commission_percent,commission_cents,net_cents FROM cash_transactions WHERE date BETWEEN ?1 AND ?2 ORDER BY date DESC,id DESC LIMIT 2000").map_err(|e|e.to_string())?;
    let rows=s.query_map(params![a,b],|r|Ok(CashTransaction{id:r.get(0)?,kind:r.get(1)?,description:r.get(2)?,amount_cents:r.get(3)?,date:r.get(4)?,payment_method:r.get(5)?,client_id:r.get(6)?,staff_id:r.get(7)?,staff_name:r.get(8)?,source:r.get(9)?,sale_type:r.get(10)?,commission_percent:r.get(11)?,commission_cents:r.get(12)?,net_cents:r.get(13)?})).map_err(|e|e.to_string())?;
    rows.collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())
}

#[tauri::command]
fn create_cash_transaction(state:State<DbState>,input:CreateCashInput)->Result<CashTransaction,String>{
    let kind=if input.kind=="despesa"{"despesa"}else{"entrada"}; let mut desc=input.description.trim().to_string();
    if desc.is_empty(){return Err("Informe a descrição do lançamento.".into())} if !valid_date(&input.date){return Err("Data inválida.".into())}
    let payment=input.payment_method.unwrap_or_default(); let sale_type=input.sale_type.unwrap_or_else(||"other".into());
    let mut c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?; operations::ensure_schema(&c)?;
    let(staff_name,service_default,product_default)=staff_identity(&c,input.staff_id)?; let mut amount=input.amount_cents; let mut commission_percent=0; let mut commission_cents=0;
    let tx=c.transaction().map_err(|e|e.to_string())?;
    if kind=="entrada"&&sale_type=="product"{
        let product_id=input.product_id.ok_or("Selecione o produto vendido.")?; let qty=input.quantity.unwrap_or(1).max(1);
        let(product_name,price,stock):(String,i64,i64)=tx.query_row("SELECT name,price_cents,stock FROM products WHERE id=?1 AND active=1",params![product_id],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?))).map_err(|_|"Produto não encontrado.".to_string())?;
        if stock<qty{return Err("Estoque insuficiente para esta venda.".into())} amount=price*qty; desc=format!("Venda de produto — {} x{}",product_name,qty);
        tx.execute("UPDATE products SET stock=stock-?1 WHERE id=?2",params![qty,product_id]).map_err(|e|e.to_string())?;
        tx.execute("INSERT INTO stock_movements(product_id,quantity,note,created_at) VALUES(?1,?2,?3,?4)",params![product_id,-qty,format!("Venda no caixa — {}",desc),Utc::now().to_rfc3339()]).map_err(|e|e.to_string())?;
        commission_percent=if input.staff_id.is_some(){product_default.clamp(0,100)}else{0}; commission_cents=amount*commission_percent/100;
    } else if kind=="entrada"&&sale_type=="service"{
        if amount<=0{return Err("Informe um valor maior que zero.".into())}
        if let Some(staff_id)=input.staff_id{commission_percent=service_commission_percent(&tx,staff_id,input.service_id,service_default)?;commission_cents=amount*commission_percent/100}
    } else if amount<=0{return Err("Informe um valor maior que zero.".into())}
    let net=if kind=="entrada"{amount-commission_cents}else{-amount};
    tx.execute("INSERT INTO cash_transactions(kind,description,amount_cents,date,client_id,staff_id,staff_name,payment_method,source,sale_type,commission_percent,commission_cents,net_cents,settlement_id,created_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,'manual',?9,?10,?11,?12,NULL,?13)",params![kind,desc,amount,input.date,input.client_id,input.staff_id,staff_name,payment,sale_type,commission_percent,commission_cents,net,Utc::now().to_rfc3339()]).map_err(|e|e.to_string())?;
    let id=tx.last_insert_rowid(); tx.commit().map_err(|e|e.to_string())?;
    Ok(CashTransaction{id,kind:kind.into(),description:desc,amount_cents:amount,date:input.date,payment_method:payment,client_id:input.client_id,staff_id:input.staff_id,staff_name,source:"manual".into(),sale_type,commission_percent,commission_cents,net_cents:net})
}

#[tauri::command]
fn monthly_report(state:State<DbState>,year:i32)->Result<MonthlyReport,String>{
    if !(2000..=2100).contains(&year){return Err("Ano inválido.".into())}
    let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    let mut months=Vec::new(); let mut yi=0; let mut ye=0; let mut yc=0;
    for m in 1..=12u32{
        let prefix=format!("{:04}-{:02}",year,m);
        let(income,expense,commission,count,attendances):(i64,i64,i64,i64,i64)=c.query_row("SELECT COALESCE(SUM(CASE WHEN kind='entrada' THEN amount_cents ELSE 0 END),0),COALESCE(SUM(CASE WHEN kind='despesa' THEN amount_cents ELSE 0 END),0),COALESCE(SUM(CASE WHEN kind='entrada' THEN commission_cents ELSE 0 END),0),COUNT(*),COALESCE(SUM(CASE WHEN kind='entrada' AND sale_type='service' THEN 1 ELSE 0 END),0) FROM cash_transactions WHERE substr(date,1,7)=?1",params![prefix],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?,r.get(4)?))).map_err(|e|e.to_string())?;
        yi+=income; ye+=expense; yc+=commission;
        months.push(MonthSummary{month:m,income_cents:income,expense_cents:expense,commission_cents:commission,balance_cents:income-expense-commission,transactions:count,attendances});
    }
    Ok(MonthlyReport{year,months,year_income_cents:yi,year_expense_cents:ye,year_commission_cents:yc,year_balance_cents:yi-ye-yc})
}

#[tauri::command]
fn list_products(state:State<DbState>)->Result<Vec<Product>,String>{
    let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    let mut s=c.prepare("SELECT id,name,description,price_cents,stock,active FROM products WHERE active=1 ORDER BY name COLLATE NOCASE").map_err(|e|e.to_string())?;
    let rows=s.query_map([],|r|Ok(Product{id:r.get(0)?,name:r.get(1)?,description:r.get(2)?,price_cents:r.get(3)?,stock:r.get(4)?,active:r.get::<_,i64>(5)?!=0})).map_err(|e|e.to_string())?;
    rows.collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())
}
#[tauri::command]
fn create_product(state:State<DbState>,input:CreateProductInput)->Result<Product,String>{
    let name=input.name.trim();if name.is_empty(){return Err("Informe o nome do produto.".into())}if input.price_cents<=0{return Err("Informe um preço maior que zero.".into())}if input.stock<0{return Err("Estoque inválido.".into())}
    let desc=input.description.unwrap_or_default();let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    c.execute("INSERT INTO products(name,description,price_cents,stock,active,created_at) VALUES(?1,?2,?3,?4,1,?5)",params![name,desc,input.price_cents,input.stock,Utc::now().to_rfc3339()]).map_err(|e|e.to_string())?;
    Ok(Product{id:c.last_insert_rowid(),name:name.into(),description:desc,price_cents:input.price_cents,stock:input.stock,active:true})
}
#[tauri::command]
fn adjust_stock(state:State<DbState>,input:StockAdjustmentInput)->Result<(),String>{
    if input.quantity==0{return Err("Informe uma quantidade diferente de zero.".into())}let note=input.note.unwrap_or_default();let mut c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;
    let current:i64=c.query_row("SELECT stock FROM products WHERE id=?1 AND active=1",params![input.product_id],|r|r.get(0)).map_err(|_|"Produto não encontrado.".to_string())?;if current+input.quantity<0{return Err("Estoque insuficiente.".into())}
    let tx=c.transaction().map_err(|e|e.to_string())?;tx.execute("UPDATE products SET stock=stock+?1 WHERE id=?2",params![input.quantity,input.product_id]).map_err(|e|e.to_string())?;tx.execute("INSERT INTO stock_movements(product_id,quantity,note,created_at) VALUES(?1,?2,?3,?4)",params![input.product_id,input.quantity,note,Utc::now().to_rfc3339()]).map_err(|e|e.to_string())?;tx.commit().map_err(|e|e.to_string())?;Ok(())
}

#[tauri::command]
fn get_business_settings(state:State<DbState>)->Result<BusinessSettings,String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;c.query_row("SELECT business_name,owner_name,phone,whatsapp,address,logo_path,currency,timezone,backup_destination,configured FROM business_settings WHERE id=1",[],|r|Ok(BusinessSettings{business_name:r.get(0)?,owner_name:r.get(1)?,phone:r.get(2)?,whatsapp:r.get(3)?,address:r.get(4)?,logo_path:r.get(5)?,currency:r.get(6)?,timezone:r.get(7)?,backup_destination:r.get(8)?,configured:r.get::<_,i64>(9)?!=0})).map_err(|e|e.to_string())}
#[tauri::command]
fn save_business_settings(state:State<DbState>,input:BusinessSettings)->Result<BusinessSettings,String>{let name=input.business_name.trim();if name.is_empty(){return Err("Informe o nome da barbearia.".into())}let currency=if input.currency.trim().is_empty(){"BRL"}else{input.currency.trim()};let timezone=if input.timezone.trim().is_empty(){"America/Sao_Paulo"}else{input.timezone.trim()};let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;c.execute("UPDATE business_settings SET business_name=?1,owner_name=?2,phone=?3,whatsapp=?4,address=?5,logo_path=?6,currency=?7,timezone=?8,backup_destination=?9,configured=1,updated_at=?10 WHERE id=1",params![name,input.owner_name.trim(),input.phone.trim(),input.whatsapp.trim(),input.address.trim(),input.logo_path.trim(),currency,timezone,input.backup_destination.trim(),Utc::now().to_rfc3339()]).map_err(|e|e.to_string())?;Ok(BusinessSettings{business_name:name.into(),owner_name:input.owner_name,phone:input.phone,whatsapp:input.whatsapp,address:input.address,logo_path:input.logo_path,currency:currency.into(),timezone:timezone.into(),backup_destination:input.backup_destination,configured:true})}

#[tauri::command]
fn list_backups(state:State<DbState>)->Result<Vec<BackupItem>,String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;let dir=backup_dir(&state,&c);fs::create_dir_all(&dir).map_err(|e|e.to_string())?;let mut out=Vec::new();for entry in fs::read_dir(&dir).map_err(|e|e.to_string())?{let p=entry.map_err(|e|e.to_string())?.path();if p.extension().and_then(|x|x.to_str())!=Some("db"){continue}let meta=fs::metadata(&p).map_err(|e|e.to_string())?;out.push(BackupItem{file_name:p.file_name().and_then(|x|x.to_str()).unwrap_or("").into(),path:p.display().to_string(),size_bytes:meta.len(),created_at:backup_timestamp(&p)})}out.sort_by(|a,b|b.file_name.cmp(&a.file_name));Ok(out)}
#[tauri::command]
fn create_backup(state:State<DbState>)->Result<BackupItem,String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;let dir=backup_dir(&state,&c);fs::create_dir_all(&dir).map_err(|e|e.to_string())?;let stamp=Local::now().format("%Y%m%d-%H%M%S").to_string();let path=dir.join(format!("barbershop-backup-{}.db",stamp));let escaped=path.display().to_string().replace('\'',"''");c.execute_batch("PRAGMA wal_checkpoint(FULL);").map_err(|e|e.to_string())?;c.execute_batch(&format!("VACUUM INTO '{}';",escaped)).map_err(|e|e.to_string())?;let meta=fs::metadata(&path).map_err(|e|e.to_string())?;Ok(BackupItem{file_name:path.file_name().and_then(|x|x.to_str()).unwrap_or("").into(),path:path.display().to_string(),size_bytes:meta.len(),created_at:backup_timestamp(&path)})}
#[tauri::command]
fn restore_backup(state:State<DbState>,path:String)->Result<(),String>{let source=PathBuf::from(&path);if !source.exists(){return Err("Arquivo de backup não encontrado.".into())}let check=Connection::open(&source).map_err(|e|format!("Backup inválido: {}",e))?;let integrity:String=check.query_row("PRAGMA integrity_check",[],|r|r.get(0)).map_err(|e|e.to_string())?;if integrity!="ok"{return Err(format!("Backup reprovado na verificação: {}",integrity))}drop(check);let mut guard=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;let safety_dir=PathBuf::from(&state.storage_root).join("backups");fs::create_dir_all(&safety_dir).map_err(|e|e.to_string())?;guard.execute_batch("PRAGMA wal_checkpoint(FULL);").map_err(|e|e.to_string())?;let safety=safety_dir.join(format!("pre-restore-{}.db",Local::now().format("%Y%m%d-%H%M%S")));let esc=safety.display().to_string().replace('\'',"''");guard.execute_batch(&format!("VACUUM INTO '{}';",esc)).map_err(|e|e.to_string())?;let memory=Connection::open_in_memory().map_err(|e|e.to_string())?;let old=std::mem::replace(&mut *guard,memory);drop(old);let db=PathBuf::from(&state.database_path);let _=fs::remove_file(format!("{}-wal",state.database_path));let _=fs::remove_file(format!("{}-shm",state.database_path));fs::copy(&source,&db).map_err(|e|e.to_string())?;let reopened=Connection::open(&db).map_err(|e|e.to_string())?;initialize_database(&reopened)?;*guard=reopened;Ok(())}
#[tauri::command]
fn maintenance_report(state:State<DbState>)->Result<MaintenanceReport,String>{let c=state.connection.lock().map_err(|_|"Banco ocupado".to_string())?;let integrity:String=c.query_row("PRAGMA integrity_check",[],|r|r.get(0)).map_err(|e|e.to_string())?;let schema:i64=c.query_row("SELECT version FROM schema_meta WHERE id=1",[],|r|r.get(0)).map_err(|e|e.to_string())?;let size=fs::metadata(&state.database_path).map(|m|m.len()).unwrap_or(0);let dir=backup_dir(&state,&c);let mut last=String::new();if let Ok(entries)=fs::read_dir(dir){for e in entries.flatten(){let p=e.path();if p.extension().and_then(|x|x.to_str())==Some("db"){let t=backup_timestamp(&p);if t>last{last=t}}}}Ok(MaintenanceReport{integrity,database_size_bytes:size,schema_version:schema,storage_mode:state.storage_mode.clone(),database_path:state.database_path.clone(),last_backup:last})}
