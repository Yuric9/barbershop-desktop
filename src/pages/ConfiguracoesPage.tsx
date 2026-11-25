import { desktopApi } from "../desktop-api";
import { Metric } from "../components/ui";
import { SettingsForm } from "../components/SettingsForm";
import { WhatsAppForm } from "../components/WhatsAppForm";
import { OpeningHoursSettings } from "../components/OpeningHoursSettings";
import type { AppCtx } from "../state/useAppState";

export function ConfiguracoesPage({ ctx }: { ctx: AppCtx }) {
  const { setSettings, setNotice, openingHours, backups, maintenance, whatsApp, setWhatsApp, loadTools, mutate, saveHours } = ctx;
  // A página só aparece depois que as configurações carregaram (ver AppModern), então nunca é null aqui.
  const settings = ctx.settings!;
  return <><h1>Configurações</h1><div className="settings-grid"><div className="card"><h2>Identidade da barbearia</h2><SettingsForm values={settings} onSave={async v=>{const saved=await desktopApi.saveBusinessSettings(v);setSettings(saved);setNotice("Configurações salvas.")}}/></div><div className="card"><h2>Horários de funcionamento</h2><OpeningHoursSettings key={JSON.stringify(openingHours)} value={openingHours} onSave={saveHours}/></div><div className="card"><h2>WhatsApp Cloud API</h2><WhatsAppForm value={whatsApp} onSave={async v=>{const saved=await desktopApi.saveWhatsAppSettings(v);setWhatsApp(saved);setNotice("Configuração do WhatsApp salva.")}}/></div><div className="card"><h2>Backup</h2><button className="primary" onClick={()=>void mutate(()=>desktopApi.createBackup(),"Backup criado.")}>Criar backup agora</button><div className="backup-list">{backups.map(b=><div className="backup-row" key={b.path}><div><b>{b.fileName}</b><small>{b.createdAt}</small></div><button onClick={()=>{if(window.confirm("Restaurar este backup?"))void mutate(()=>desktopApi.restoreBackup(b.path),"Backup restaurado.")}}>Restaurar</button></div>)}</div></div><div className="card"><h2>Manutenção</h2>{maintenance&&<div className="diagnostics"><Metric label="Integridade" value={maintenance.integrity}/><Metric label="Schema" value={String(maintenance.schemaVersion)}/><Metric label="Tamanho" value={`${(maintenance.databaseSizeBytes/1024/1024).toFixed(2)} MB`}/><div className="wide"><small>Banco local</small><code>{maintenance.databasePath}</code></div></div>}<button onClick={()=>void loadTools()}>Verificar novamente</button></div></div></>;
}
