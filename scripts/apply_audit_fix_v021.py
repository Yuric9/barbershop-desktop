from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]

# Finance: vincula cada venda ao stock_movement exato.
p = root / "src-tauri/src/commands_finance.rs"
s = p.read_text(encoding="utf-8")
old = "let(staff_name,service_default,product_default)=staff_identity(&c,input.staff_id)?; let mut amount=input.amount_cents; let mut commission_percent=0; let mut commission_cents=0;"
if "let mut stock_movement_id:Option<i64>=None;" not in s:
    assert old in s
    s = s.replace(old, old + " let mut stock_movement_id:Option<i64>=None;", 1)
marker = 'tx.execute("INSERT INTO stock_movements(product_id,quantity,note,created_at) VALUES(?1,?2,?3,?4)",params![product_id,-qty,format!("Venda no caixa — {}",desc),Utc::now().to_rfc3339()]).map_err(|e|e.to_string())?;'
if "stock_movement_id=Some(tx.last_insert_rowid());" not in s:
    assert marker in s
    s = s.replace(marker, marker + "\n        stock_movement_id=Some(tx.last_insert_rowid());", 1)
old_insert = '''tx.execute("INSERT INTO cash_transactions(kind,description,amount_cents,date,client_id,staff_id,staff_name,payment_method,source,sale_type,commission_percent,commission_cents,net_cents,settlement_id,created_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,'manual',?9,?10,?11,?12,NULL,?13)",params![kind,desc,amount,input.date,input.client_id,input.staff_id,staff_name,payment,sale_type,commission_percent,commission_cents,net,Utc::now().to_rfc3339()]).map_err(|e|e.to_string())?;'''
new_insert = '''tx.execute("INSERT INTO cash_transactions(kind,description,amount_cents,date,client_id,staff_id,staff_name,payment_method,source,sale_type,commission_percent,commission_cents,net_cents,settlement_id,stock_movement_id,created_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,'manual',?9,?10,?11,?12,NULL,?13,?14)",params![kind,desc,amount,input.date,input.client_id,input.staff_id,staff_name,payment,sale_type,commission_percent,commission_cents,net,stock_movement_id,Utc::now().to_rfc3339()]).map_err(|e|e.to_string())?;'''
if "settlement_id,stock_movement_id,created_at" not in s:
    assert old_insert in s
    s = s.replace(old_insert, new_insert, 1)
p.write_text(s, encoding="utf-8")

# Operations: migration e restauração de estoque pelo ID correto.
p = root / "src-tauri/src/operations.rs"
s = p.read_text(encoding="utf-8")
anchor = ' let _=c.execute("ALTER TABLE cash_transactions ADD COLUMN settlement_id INTEGER",[]);'
if "ALTER TABLE cash_transactions ADD COLUMN stock_movement_id INTEGER" not in s:
    assert anchor in s
    s = s.replace(anchor, anchor + '\n let _=c.execute("ALTER TABLE cash_transactions ADD COLUMN stock_movement_id INTEGER",[]);', 1)
if "SELECT source,sale_type,description,appointment_id,settlement_id,stock_movement_id FROM cash_transactions" not in s:
    new_fn = '''pub fn delete_cash_transaction(c:&Connection,id:i64)->Result<(),String>{ensure_schema(c)?;let row:(String,String,String,Option<i64>,Option<i64>,Option<i64>)=c.query_row("SELECT source,sale_type,description,appointment_id,settlement_id,stock_movement_id FROM cash_transactions WHERE id=?1",params![id],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?,r.get(4)?,r.get(5)?))).map_err(|_|"Lançamento não encontrado.".to_string())?;if row.4.is_some(){return Err("Este lançamento já está em um fechamento. Reabra o fechamento antes de excluir.".into())}let tx=c.unchecked_transaction().map_err(|e|e.to_string())?;if row.1=="product"{
    let movement:Option<(i64,i64,i64)>=if let Some(movement_id)=row.5{
        tx.query_row("SELECT id,product_id,quantity FROM stock_movements WHERE id=?1",params![movement_id],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?))).optional().map_err(|e|e.to_string())?
    } else {
        let note=format!("Venda no caixa — {}",row.2);
        tx.query_row("SELECT id,product_id,quantity FROM stock_movements WHERE note=?1 AND quantity<0 ORDER BY id DESC LIMIT 1",params![note],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?))).optional().map_err(|e|e.to_string())?
    };
    if let Some((movement_id,product_id,quantity))=movement{tx.execute("UPDATE products SET stock=stock+?1 WHERE id=?2",params![-quantity,product_id]).map_err(|e|e.to_string())?;tx.execute("DELETE FROM stock_movements WHERE id=?1",params![movement_id]).map_err(|e|e.to_string())?;}
}if row.0=="atendimento"{if let Some(appointment_id)=row.3{tx.execute("UPDATE appointments SET status='Confirmado',payment_method='',cash_transaction_id=NULL WHERE id=?1",params![appointment_id]).map_err(|e|e.to_string())?;}}tx.execute("DELETE FROM cash_transactions WHERE id=?1",params![id]).map_err(|e|e.to_string())?;tx.commit().map_err(|e|e.to_string())?;Ok(())}'''
    pattern = r"pub fn delete_cash_transaction\(c:&Connection,id:i64\)->Result<\(\),String>\{.*?\}\n\npub fn create_staff_settlement"
    s, count = re.subn(pattern, new_fn + "\n\npub fn create_staff_settlement", s, count=1, flags=re.S)
    assert count == 1
p.write_text(s, encoding="utf-8")

# Build: remove patch automático e identifica a nova build como v0.2.1.
p = root / ".github/workflows/windows-build.yml"
s = p.read_text(encoding="utf-8")
s = re.sub(r"\n      - name: Apply Rust syntax fix\n.*?(?=\n      - name: Setup Node)", "", s, count=1, flags=re.S)
s = s.replace("v0.2.0", "v0.2.1")
p.write_text(s, encoding="utf-8")

# Versões internas.
for name, oldv, newv in [
    ("package.json", '\"version\": \"0.2.0\"', '\"version\": \"0.2.1\"'),
    ("src-tauri/Cargo.toml", 'version = \"0.2.0\"', 'version = \"0.2.1\"'),
    ("src-tauri/tauri.conf.json", '\"version\": \"0.2.0\"', '\"version\": \"0.2.1\"'),
]:
    q = root / name
    t = q.read_text(encoding="utf-8")
    if newv not in t:
        assert oldv in t
        t = t.replace(oldv, newv, 1)
    q.write_text(t, encoding="utf-8")

print("Correções v0.2.1 aplicadas.")
