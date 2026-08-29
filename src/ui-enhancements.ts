type UiTheme = "dark" | "light";

type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type FormControlSnapshot = {
  element: FormControl;
  value: string;
  checked?: boolean;
};
type PendingFormSnapshot = {
  form: HTMLFormElement;
  controls: FormControlSnapshot[];
  errorRevision: number;
};

const THEME_KEY = "gestao-barbearia-theme";
let scheduled = false;
let errorRevision = 0;
let lastErrorText = "";
let pendingForm: PendingFormSnapshot | null = null;

function readTheme(): UiTheme {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function applyTheme(theme: UiTheme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // A preferência visual é opcional; o app continua funcionando sem storage.
  }
}

function enhanceThemeSettings() {
  const settingsTitle = [...document.querySelectorAll(".modern-content > h1")]
    .find(node => node.textContent?.trim() === "Configurações");
  if (!settingsTitle) return;

  const grid = settingsTitle.nextElementSibling;
  if (!(grid instanceof HTMLElement) || !grid.classList.contains("settings-grid")) return;

  let card = grid.querySelector<HTMLElement>("[data-ui-theme-card]");
  if (!card) {
    card = document.createElement("div");
    card.className = "card ui-theme-card";
    card.dataset.uiThemeCard = "true";
    card.innerHTML = `
      <div class="ui-theme-copy">
        <h2>Aparência</h2>
        <p class="muted">Alterne entre tema escuro e claro. A escolha fica salva neste computador.</p>
      </div>
      <button type="button" class="ui-theme-switch" role="switch" aria-label="Alternar tema claro e escuro">
        <span class="ui-theme-track"><span class="ui-theme-knob"></span></span>
        <span class="ui-theme-label"></span>
      </button>
    `;
    grid.prepend(card);

    card.querySelector<HTMLButtonElement>(".ui-theme-switch")?.addEventListener("click", () => {
      const next: UiTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      applyTheme(next);
      renderThemeControl();
    });
  }

  renderThemeControl();
}

function renderThemeControl() {
  const button = document.querySelector<HTMLButtonElement>(".ui-theme-switch");
  const label = button?.querySelector<HTMLElement>(".ui-theme-label");
  if (!button || !label) return;
  const light = document.documentElement.dataset.theme === "light";
  button.setAttribute("aria-checked", String(light));
  button.classList.toggle("is-light", light);
  label.textContent = light ? "Tema claro" : "Tema escuro";
}

function markCashField(element: Element | null, role: string) {
  if (!(element instanceof HTMLElement)) return;
  element.dataset.cashRole = role;
}

function enhanceCash() {
  const form = document.querySelector<HTMLFormElement>("form.cash-form");
  if (!form) return;

  const kind = form.querySelector<HTMLSelectElement>('select[name="kind"]');
  const saleType = [...form.querySelectorAll<HTMLSelectElement>("select")]
    .find(select => !select.name);
  const service = form.querySelector<HTMLSelectElement>('select[name="serviceId"]');
  const description = form.querySelector<HTMLInputElement>('input[name="description"]');
  const amount = form.querySelector<HTMLInputElement>('input[name="amount"]');
  const client = form.querySelector<HTMLSelectElement>('select[name="clientId"]');
  const date = form.querySelector<HTMLInputElement>('input[name="date"]');
  const payment = form.querySelector<HTMLSelectElement>('select[name="paymentMethod"]');
  const staff = form.querySelector<HTMLSelectElement>('select[name="staffId"]');
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"], button:not([type])');

  if (saleType) saleType.dataset.uiHidden = "true";
  if (description) {
    description.dataset.uiHidden = "true";
    description.tabIndex = -1;
  }

  if (amount) {
    amount.readOnly = false;
    amount.removeAttribute("readonly");
    amount.title = "O valor sugerido vem do serviço cadastrado, mas pode ser editado neste lançamento.";
  }

  if (kind) kind.title = "Tipo do lançamento";
  if (service) service.title = "Serviço cadastrado";
  if (client) client.title = "Cliente";
  if (date) date.title = "Data do lançamento";
  if (payment) payment.title = "Forma de pagamento";
  if (staff) staff.title = "Colaborador ou administrador";

  markCashField(kind, "kind");
  markCashField(service, "service");
  markCashField(amount, "amount");
  markCashField(client, "client");
  markCashField(date, "date");
  markCashField(payment, "payment");
  markCashField(staff, "staff");
  markCashField(submit, "submit");

  if (service && !service.dataset.uiCashListener) {
    service.dataset.uiCashListener = "true";
    service.addEventListener("change", () => {
      requestAnimationFrame(() => enhanceCash());
    });
  }

  let note = form.querySelector<HTMLElement>("[data-cash-reset-note]");
  if (!note) {
    note = document.createElement("div");
    note.className = "cash-reset-note";
    note.dataset.cashResetNote = "true";
    note.textContent = "Após salvar, os campos do lançamento são limpos automaticamente para o próximo registro.";
    form.append(note);
  }

  const kpis = document.querySelectorAll<HTMLElement>(".modern-content .kpi-grid .kpi");
  if (kpis.length >= 4) {
    const tones = ["income", "expense", "commission", "balance"];
    kpis.forEach((card, index) => {
      if (index > 3) return;
      card.classList.add("cash-kpi-visual", `cash-kpi-${tones[index]}`);
    });
  }
}

function currentErrorText() {
  return document.querySelector<HTMLElement>(".modern-content > .error")?.textContent?.trim() || "";
}

function updateErrorRevision() {
  const next = currentErrorText();
  if (next !== lastErrorText) {
    lastErrorText = next;
    errorRevision += 1;
  }
}

function isCreateForm(form: HTMLFormElement) {
  if (form.classList.contains("cash-form") || form.classList.contains("appointment-form")) return true;
  if (!form.classList.contains("form") || !form.classList.contains("card")) return false;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"], button:not([type])');
  const label = submit?.textContent?.trim() || "";
  return ["Adicionar cliente", "Adicionar serviço", "Adicionar colaborador", "Adicionar produto"].includes(label);
}

function snapshotForm(form: HTMLFormElement): PendingFormSnapshot {
  const controls = [...form.querySelectorAll<FormControl>("input[name], select[name], textarea[name]")]
    .map(element => ({
      element,
      value: element.value,
      checked: element instanceof HTMLInputElement && ["checkbox", "radio"].includes(element.type)
        ? element.checked
        : undefined,
    }));
  return { form, controls, errorRevision };
}

function setControlValue(element: FormControl, value: string, checked?: boolean) {
  if (!element.isConnected) return;

  if (element instanceof HTMLInputElement) {
    if (["checkbox", "radio"].includes(element.type) && checked !== undefined) {
      const checkedSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked")?.set;
      checkedSetter?.call(element, checked);
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    valueSetter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  if (element instanceof HTMLSelectElement) {
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
    valueSetter?.call(element, value);
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  const valueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  valueSetter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function restoreFailedForm(snapshot: PendingFormSnapshot) {
  snapshot.controls.forEach(control => setControlValue(control.element, control.value, control.checked));
  const first = snapshot.controls.find(control => {
    const element = control.element;
    return element.isConnected && !element.hasAttribute("data-ui-hidden") && !element.hasAttribute("disabled");
  });
  first?.element.focus();
}

function auditFormResetBehavior() {
  if (document.documentElement.dataset.formResetAudit === "ready") return;
  document.documentElement.dataset.formResetAudit = "ready";

  document.addEventListener("submit", event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !isCreateForm(form)) return;
    updateErrorRevision();
    pendingForm = snapshotForm(form);
  }, true);

  document.addEventListener("reset", event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !pendingForm || pendingForm.form !== form) return;
    const snapshot = pendingForm;
    pendingForm = null;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      updateErrorRevision();
      if (currentErrorText() && errorRevision > snapshot.errorRevision) {
        restoreFailedForm(snapshot);
      }
    }));
  }, true);
}

function enhanceAll() {
  updateErrorRevision();
  enhanceCash();
  enhanceThemeSettings();
  auditFormResetBehavior();
}

function scheduleEnhance() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    enhanceAll();
  });
}

applyTheme(readTheme());

const observer = new MutationObserver(scheduleEnhance);
observer.observe(document.documentElement, { childList: true, subtree: true });
scheduleEnhance();
