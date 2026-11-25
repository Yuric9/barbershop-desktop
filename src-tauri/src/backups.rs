//! Backups do banco: cópia manual, cópia automática diária e limpeza das cópias antigas.
//!
//! A cópia é feita com `VACUUM INTO`, que gera um arquivo .db completo e consistente
//! mesmo com o app aberto.

use rusqlite::Connection;
use std::{
    fs,
    path::{Path, PathBuf},
    time::{Duration, SystemTime},
};

/// Prefixo das cópias automáticas (as manuais usam "barbershop-backup").
pub const AUTO_PREFIX: &str = "auto-backup";
/// Uma nova cópia automática é feita quando a mais recente tem mais que isto.
pub const AUTO_INTERVAL: Duration = Duration::from_secs(24 * 60 * 60);
/// Quantas cópias automáticas ficam guardadas (as mais antigas são apagadas).
pub const AUTO_KEEP: usize = 14;

/// Grava uma cópia do banco em `dir` com o nome `<prefixo>-AAAAMMDD-HHMMSS.db`.
pub fn write_backup(c: &Connection, dir: &Path, prefix: &str) -> Result<PathBuf, String> {
    fs::create_dir_all(dir).map_err(|e| format!("Não foi possível usar a pasta de backup: {e}"))?;
    let stamp = chrono::Local::now().format("%Y%m%d-%H%M%S").to_string();
    let mut path = dir.join(format!("{prefix}-{stamp}.db"));
    // Dois backups no mesmo segundo não podem ter o mesmo nome (VACUUM INTO falha se o arquivo existe).
    let mut n = 2;
    while path.exists() {
        path = dir.join(format!("{prefix}-{stamp}-{n}.db"));
        n += 1;
    }
    let escaped = path.display().to_string().replace('\'', "''");
    c.execute_batch("PRAGMA wal_checkpoint(FULL);").map_err(|e| e.to_string())?;
    c.execute_batch(&format!("VACUUM INTO '{escaped}';")).map_err(|e| e.to_string())?;
    Ok(path)
}

/// Arquivos .db de uma pasta com a data de modificação, do mais novo para o mais antigo.
fn db_files(dir: &Path) -> Vec<(PathBuf, SystemTime)> {
    let mut out: Vec<(PathBuf, SystemTime)> = fs::read_dir(dir)
        .map(|entries| {
            entries
                .flatten()
                .map(|e| e.path())
                .filter(|p| p.extension().and_then(|x| x.to_str()) == Some("db"))
                .filter_map(|p| fs::metadata(&p).and_then(|m| m.modified()).ok().map(|t| (p, t)))
                .collect()
        })
        .unwrap_or_default();
    out.sort_by(|a, b| b.1.cmp(&a.1));
    out
}

/// Data do backup mais recente (manual ou automático) na pasta, se houver.
pub fn newest_backup(dir: &Path) -> Option<SystemTime> {
    db_files(dir).first().map(|(_, t)| *t)
}

/// Apaga as cópias automáticas mais antigas, mantendo `keep`. Backups manuais nunca são apagados.
pub fn rotate_auto(dir: &Path, keep: usize) -> usize {
    let autos: Vec<PathBuf> = db_files(dir)
        .into_iter()
        .map(|(p, _)| p)
        .filter(|p| p.file_name().and_then(|n| n.to_str()).is_some_and(|n| n.starts_with(AUTO_PREFIX)))
        .collect();
    autos.iter().skip(keep).filter(|p| fs::remove_file(p).is_ok()).count()
}

/// Faz a cópia automática se a mais recente tiver mais de 24h.
/// Tenta a pasta escolhida em Configurações; se ela não estiver disponível (pendrive fora,
/// pasta de rede caída), usa a pasta padrão do app. Devolve o arquivo criado, se criou.
pub fn run_auto_backup(
    c: &Connection,
    primary: &Path,
    fallback: &Path,
    now: SystemTime,
) -> Result<Option<PathBuf>, String> {
    let newest = [primary, fallback].iter().filter_map(|d| newest_backup(d)).max();
    if let Some(t) = newest {
        if now.duration_since(t).unwrap_or_default() < AUTO_INTERVAL {
            return Ok(None);
        }
    }
    let (path, dir) = match write_backup(c, primary, AUTO_PREFIX) {
        Ok(p) => (p, primary),
        Err(_) if primary != fallback => (write_backup(c, fallback, AUTO_PREFIX)?, fallback),
        Err(e) => return Err(e),
    };
    rotate_auto(dir, AUTO_KEEP);
    Ok(Some(path))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_dir(name: &str) -> PathBuf {
        let d = std::env::temp_dir().join(format!("barbershop-test-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&d);
        fs::create_dir_all(&d).unwrap();
        d
    }

    fn db() -> Connection {
        let c = Connection::open_in_memory().unwrap();
        c.execute_batch("CREATE TABLE t(x); INSERT INTO t VALUES(1);").unwrap();
        c
    }

    #[test]
    fn cria_backup_automatico_quando_nao_existe_nenhum() {
        let dir = temp_dir("primeiro");
        let made = run_auto_backup(&db(), &dir, &dir, SystemTime::now()).unwrap();
        assert!(made.is_some());
        assert_eq!(db_files(&dir).len(), 1);
    }

    #[test]
    fn nao_repete_backup_dentro_de_24h() {
        let dir = temp_dir("repetido");
        let c = db();
        run_auto_backup(&c, &dir, &dir, SystemTime::now()).unwrap();
        let again = run_auto_backup(&c, &dir, &dir, SystemTime::now()).unwrap();
        assert!(again.is_none());
        let tomorrow = SystemTime::now() + Duration::from_secs(25 * 3600);
        assert!(run_auto_backup(&c, &dir, &dir, tomorrow).unwrap().is_some());
    }

    #[test]
    fn usa_pasta_padrao_quando_a_escolhida_nao_existe() {
        let fallback = temp_dir("fallback");
        // Um arquivo no lugar da pasta faz o create_dir_all falhar, como um pendrive removido.
        let blocked = temp_dir("bloqueada").join("arquivo");
        fs::write(&blocked, "x").unwrap();
        let made = run_auto_backup(&db(), &blocked.join("sub"), &fallback, SystemTime::now()).unwrap();
        assert!(made.unwrap().starts_with(&fallback));
    }

    #[test]
    fn mantem_so_as_14_automaticas_mais_novas_e_nunca_apaga_manuais() {
        let dir = temp_dir("rotacao");
        let c = db();
        write_backup(&c, &dir, "barbershop-backup").unwrap();
        for _ in 0..16 {
            write_backup(&c, &dir, AUTO_PREFIX).unwrap();
        }
        assert_eq!(rotate_auto(&dir, AUTO_KEEP), 2);
        let names: Vec<String> =
            db_files(&dir).iter().map(|(p, _)| p.file_name().unwrap().to_string_lossy().into_owned()).collect();
        assert_eq!(names.iter().filter(|n| n.starts_with(AUTO_PREFIX)).count(), 14);
        assert_eq!(names.iter().filter(|n| n.starts_with("barbershop-backup")).count(), 1);
    }
}
