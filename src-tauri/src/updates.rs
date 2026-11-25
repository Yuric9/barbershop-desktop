//! Atualização automática pelo GitHub Releases.
//!
//! Cada atualização é assinada com uma chave secreta (gratuita, diferente do certificado
//! da Microsoft). O app só instala arquivos com assinatura válida para a chave pública abaixo.
//! A chave pública entra no build pela variável BARBERSHOP_UPDATER_PUBKEY (GitHub Actions);
//! sem ela (builds de teste e desenvolvimento), a atualização fica desligada.

use serde::Serialize;
use tauri::{AppHandle, Runtime};
use tauri_plugin_updater::UpdaterExt;

pub const UPDATER_PUBKEY: Option<&str> = option_env!("BARBERSHOP_UPDATER_PUBKEY");

pub fn enabled() -> bool {
    UPDATER_PUBKEY.is_some_and(|k| !k.trim().is_empty())
}

/// Plugin de atualização. A chave pública só é aplicada quando veio no build oficial;
/// nos outros builds vale a da configuração (vazia), e `enabled()` mantém a verificação desligada.
pub fn plugin<R: Runtime>() -> tauri::plugin::TauriPlugin<R, tauri_plugin_updater::Config> {
    let builder = tauri_plugin_updater::Builder::new();
    match UPDATER_PUBKEY {
        Some(key) if enabled() => builder.pubkey(key.trim()).build(),
        _ => builder.build(),
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    pub version: String,
    pub notes: String,
    /// No modo portátil o instalador criaria uma segunda cópia em outro lugar,
    /// então a tela oferece a página de download em vez de instalar.
    pub portable: bool,
}

pub async fn check<R: Runtime>(app: &AppHandle<R>, portable: bool) -> Result<Option<UpdateInfo>, String> {
    if !enabled() {
        return Ok(None);
    }
    let update = app
        .updater()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| format!("Não foi possível verificar atualizações: {e}"))?;
    Ok(update.map(|u| UpdateInfo { version: u.version.clone(), notes: u.body.clone().unwrap_or_default(), portable }))
}

pub async fn install<R: Runtime>(app: &AppHandle<R>, portable: bool) -> Result<(), String> {
    if portable {
        return Err("No modo portátil, baixe a versão nova na página de downloads.".into());
    }
    if !enabled() {
        return Err("Atualização automática não está configurada nesta versão.".into());
    }
    let update = app
        .updater()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| format!("Não foi possível verificar atualizações: {e}"))?
        .ok_or("Nenhuma atualização disponível.")?;
    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(|e| format!("Não foi possível instalar a atualização: {e}"))?;
    app.restart();
}
