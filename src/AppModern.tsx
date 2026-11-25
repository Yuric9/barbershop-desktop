import { desktopApi } from "./desktop-api";
import { emptySettings } from "./lib/format";
import type { Tab } from "./app-types";
import { EditDrawer } from "./components/EditDrawer";
import { FinishDrawer } from "./components/FinishDrawer";
import { SettingsForm } from "./components/SettingsForm";
import { useAppState } from "./state/useAppState";
import { StatusPage } from "./pages/StatusPage";
import { AgendaPage } from "./pages/AgendaPage";
import { CaixaPage } from "./pages/CaixaPage";
import { ClientesPage } from "./pages/ClientesPage";
import { ServicosPage } from "./pages/ServicosPage";
import { ColaboradoresPage } from "./pages/ColaboradoresPage";
import { ProdutosPage } from "./pages/ProdutosPage";
import { RelatoriosPage } from "./pages/RelatoriosPage";
import { RemarketingPage } from "./pages/RemarketingPage";
import { ConfiguracoesPage } from "./pages/ConfiguracoesPage";

export default function AppModern() {
  const ctx = useAppState();
  const {
    tab,
    setTab,
    health,
    clients,
    services,
    staff,
    cash,
    settings,
    setSettings,
    error,
    notice,
    setNotice,
    editTarget,
    setEditTarget,
    finishTarget,
    setFinishTarget,
    remarketing,
    archived,
    refresh,
    finishAppointment,
  } = ctx;
  if (settings === null) return <main className="loading-screen">Abrindo banco local...</main>;
  if (!settings.configured)
    return (
      <main className="onboarding">
        <div className="onboarding-card">
          <div className="eyebrow">Primeira configuração</div>
          <h1>Prepare sua barbearia</h1>
          <p>Os dados principais ficam neste computador. O WhatsApp é configurado depois.</p>
          <SettingsForm
            values={emptySettings}
            onSave={async (v) => {
              const saved = await desktopApi.saveBusinessSettings(v);
              setSettings(saved);
              await refresh();
            }}
          />
        </div>
      </main>
    );

  const nav: [Tab, string][] = [
    ["status", "Início"],
    ["agenda", "Agenda"],
    ["caixa", "Caixa"],
    ["clientes", "Clientes"],
    ["profissionais", "Colaboradores"],
    ["servicos", "Serviços"],
    ["produtos", "Produtos"],
    ["relatorios", "Relatórios"],
    ["remarketing", "Remarketing"],
    ["configuracoes", "Configurações"],
  ];
  return (
    <main className="shell modern-shell">
      <aside>
        <div className="brand">
          <strong>{settings.businessName}</strong>
          <small>Desktop · {health?.storageMode === "portable" ? "Portátil" : "Instalado"}</small>
        </div>
        {nav.map(([k, l]) => (
          <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
        <div className="shortcut-help">
          <small>F2 Caixa · F3 Agenda · Esc fechar</small>
        </div>
      </aside>
      <section className="content modern-content">
        {error && <div className="error">{error}</div>}
        {notice && <div className="notice">{notice}</div>}

        {tab === "status" && <StatusPage ctx={ctx} />}

        {tab === "agenda" && <AgendaPage ctx={ctx} />}

        {tab === "caixa" && <CaixaPage ctx={ctx} />}

        {tab === "clientes" && <ClientesPage ctx={ctx} />}
        {tab === "servicos" && <ServicosPage ctx={ctx} />}

        {tab === "profissionais" && <ColaboradoresPage ctx={ctx} />}

        {tab === "produtos" && <ProdutosPage ctx={ctx} />}

        {tab === "relatorios" && <RelatoriosPage ctx={ctx} />}

        {tab === "remarketing" && <RemarketingPage ctx={ctx} />}

        {tab === "configuracoes" && <ConfiguracoesPage ctx={ctx} />}
      </section>
      {editTarget && (
        <EditDrawer
          target={editTarget}
          clients={clients}
          services={services}
          staff={staff}
          onClose={() => setEditTarget(null)}
          onSaved={async () => {
            setEditTarget(null);
            await refresh();
            setNotice("Alteração salva.");
          }}
        />
      )}
      {finishTarget && (
        <FinishDrawer
          item={finishTarget}
          onClose={() => setFinishTarget(null)}
          onSubmit={finishAppointment}
        />
      )}
    </main>
  );
}
