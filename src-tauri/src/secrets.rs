//! Guarda segredos (como o token do WhatsApp) FORA do banco de dados.
//!
//! - No Windows: usa o Cofre de Credenciais do Windows (Gerenciador de Credenciais),
//!   protegido pela conta do usuário. O segredo não vai para backups nem para o pendrive.
//! - Em outros sistemas (só desenvolvimento/testes): guarda em memória enquanto o app roda.
//!
//! O banco guarda apenas uma "referência" (um nome) que aponta para o segredo no cofre.

#[cfg(windows)]
mod backend {
    /// Nome do "serviço" no Cofre de Credenciais (aparece em Painel de Controle > Gerenciador de Credenciais).
    const SERVICE: &str = "com.yuric9.barbershopdesktop";

    fn entry(reference: &str) -> Result<keyring::Entry, String> {
        keyring::Entry::new(SERVICE, reference).map_err(|e| format!("Cofre de credenciais indisponível: {e}"))
    }

    pub fn get(reference: &str) -> Result<Option<String>, String> {
        match entry(reference)?.get_password() {
            Ok(value) => Ok(Some(value)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(e) => Err(format!("Não foi possível ler o cofre de credenciais: {e}")),
        }
    }

    pub fn set(reference: &str, value: &str) -> Result<(), String> {
        entry(reference)?
            .set_password(value)
            .map_err(|e| format!("Não foi possível gravar no cofre de credenciais: {e}"))
    }
}

#[cfg(not(windows))]
mod backend {
    use std::{collections::HashMap, sync::Mutex};

    static STORE: Mutex<Option<HashMap<String, String>>> = Mutex::new(None);

    pub fn get(reference: &str) -> Result<Option<String>, String> {
        let guard = STORE.lock().map_err(|_| "Cofre ocupado".to_string())?;
        Ok(guard.as_ref().and_then(|m| m.get(reference).cloned()))
    }

    pub fn set(reference: &str, value: &str) -> Result<(), String> {
        let mut guard = STORE.lock().map_err(|_| "Cofre ocupado".to_string())?;
        guard.get_or_insert_with(HashMap::new).insert(reference.to_string(), value.to_string());
        Ok(())
    }
}

pub use backend::{get, set};
