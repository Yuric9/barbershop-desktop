import { FormEvent, useEffect, useMemo, useState } from "react";
import type {
  Appointment,
  ArchivedItem,
  BackupItem,
  BusinessSettings,
  CashTransaction,
  Client,
  Health,
  MaintenanceReport,
  MonthlyReport,
  OpeningHour,
  Product,
  RemarketingClient,
  Service,
  Staff,
  StaffPerformance,
  StaffSettlement,
  WhatsAppSettings,
  UpdateInfo,
} from "../desktop-api";
import { desktopApi } from "../desktop-api";
import { localDate, monthStart, money, emptyWhatsApp } from "../lib/format";
import type { Tab, EditTarget } from "../app-types";

export function useAppState() {
  const [tab, setTab] = useState<Tab>("status"),
    [health, setHealth] = useState<Health | null>(null),
    [clients, setClients] = useState<Client[]>([]),
    [services, setServices] = useState<Service[]>([]),
    [staff, setStaff] = useState<Staff[]>([]),
    [appointments, setAppointments] = useState<Appointment[]>([]),
    [cash, setCash] = useState<CashTransaction[]>([]),
    [products, setProducts] = useState<Product[]>([]),
    [settings, setSettings] = useState<BusinessSettings | null>(null),
    [report, setReport] = useState<MonthlyReport | null>(null),
    [performance, setPerformance] = useState<StaffPerformance[]>([]);
  const [agendaDate, setAgendaDate] = useState(localDate()),
    [selectedServices, setSelectedServices] = useState<number[]>([]),
    [availableTimes, setAvailableTimes] = useState<string[]>([]),
    [availabilityDuration, setAvailabilityDuration] = useState(0),
    [availabilityTotal, setAvailabilityTotal] = useState(0),
    [selectedTime, setSelectedTime] = useState("");
  const [cashStart, setCashStart] = useState(monthStart()),
    [cashEnd, setCashEnd] = useState(localDate()),
    [cashEntryDate, setCashEntryDate] = useState(localDate()),
    [cashKind, setCashKind] = useState<"entrada" | "despesa">("entrada"),
    [cashSaleType, setCashSaleType] = useState<"service" | "product" | "other">("service"),
    [cashDescription, setCashDescription] = useState(""),
    [cashAmount, setCashAmount] = useState(""),
    [cashServiceId, setCashServiceId] = useState("");
  const [settlementStart, setSettlementStart] = useState(monthStart()),
    [settlementEnd, setSettlementEnd] = useState(localDate()),
    [settlements, setSettlements] = useState<StaffSettlement[]>([]),
    [settlementStaff, setSettlementStaff] = useState<Staff | null>(null);
  const [reportYear, setReportYear] = useState(new Date().getFullYear()),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [editTarget, setEditTarget] = useState<EditTarget | null>(null),
    [finishTarget, setFinishTarget] = useState<Appointment | null>(null);
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>([]),
    [backups, setBackups] = useState<BackupItem[]>([]),
    [maintenance, setMaintenance] = useState<MaintenanceReport | null>(null),
    [whatsApp, setWhatsApp] = useState<WhatsAppSettings>(emptyWhatsApp);
  const [remarketingDays, setRemarketingDays] = useState(30),
    [remarketing, setRemarketing] = useState<RemarketingClient[]>([]),
    [remarketingText, setRemarketingText] = useState(
      "Olá, {nome}! Sentimos sua falta. Quando quiser cuidar do visual novamente, estamos à disposição.",
    ),
    [archived, setArchived] = useState<ArchivedItem[]>([]);

  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [updating, setUpdating] = useState(false);

  const income = useMemo(
    () => cash.filter((i) => i.kind === "entrada").reduce((s, i) => s + i.amountCents, 0),
    [cash],
  );
  const expense = useMemo(
    () => cash.filter((i) => i.kind === "despesa").reduce((s, i) => s + i.amountCents, 0),
    [cash],
  );
  const commissions = useMemo(
    () => cash.filter((i) => i.kind === "entrada").reduce((s, i) => s + i.commissionCents, 0),
    [cash],
  );
  const serviceEntries = useMemo(
    () => cash.filter((i) => i.kind === "entrada" && i.saleType === "service"),
    [cash],
  );
  const concluded = serviceEntries.length;
  const ticket = concluded
    ? Math.round(serviceEntries.reduce((s, i) => s + i.amountCents, 0) / concluded)
    : 0;
  const balance = income - expense - commissions;
  const nextAppointment = useMemo(
    () =>
      appointments
        .filter((a) => !["Finalizado", "Cancelado"].includes(a.status))
        .sort((a, b) => a.time.localeCompare(b.time))[0],
    [appointments],
  );

  async function refresh() {
    try {
      setError("");
      const [h, cs, sv, st, ap, ca, pr, bs, pf] = await Promise.all([
        desktopApi.health(),
        desktopApi.clients(),
        desktopApi.services(),
        desktopApi.staff(),
        desktopApi.appointments(agendaDate),
        desktopApi.cashTransactions(cashStart, cashEnd),
        desktopApi.products(),
        desktopApi.businessSettings(),
        desktopApi.staffPerformance(settlementStart, settlementEnd),
      ]);
      setHealth(h);
      setClients(cs);
      setServices(sv);
      setStaff(st);
      setAppointments(ap);
      setCash(ca);
      setProducts(pr);
      setSettings(bs);
      setPerformance(pf);
    } catch (e) {
      setError(String(e));
    }
  }
  async function loadReport() {
    try {
      setReport(await desktopApi.monthlyReport(reportYear));
    } catch (e) {
      setError(String(e));
    }
  }
  async function loadTools() {
    try {
      const [oh, b, m, w] = await Promise.all([
        desktopApi.openingHours(),
        desktopApi.backups(),
        desktopApi.maintenanceReport(),
        desktopApi.whatsAppSettings(),
      ]);
      setOpeningHours(oh);
      setBackups(b);
      setMaintenance(m);
      setWhatsApp(w);
    } catch (e) {
      setError(String(e));
    }
  }
  async function loadRemarketing() {
    try {
      setRemarketing(await desktopApi.remarketingClients(remarketingDays, localDate()));
    } catch (e) {
      setError(String(e));
    }
  }
  async function loadArchived(kind: "client" | "service" | "staff" | "product") {
    try {
      setArchived(await desktopApi.archivedItems(kind));
    } catch (e) {
      setError(String(e));
    }
  }
  async function loadSettlements(item: Staff) {
    try {
      setSettlementStaff(item);
      setSettlements(await desktopApi.staffSettlements(item.id));
    } catch (e) {
      setError(String(e));
    }
  }
  async function mutate(action: () => Promise<unknown>, message: string) {
    try {
      // Limpa as mensagens da ação anterior, para um erro novo não aparecer junto com um "sucesso" antigo.
      setError("");
      setNotice("");
      await action();
      setNotice(message);
      await refresh();
      if (tab === "relatorios") await loadReport();
      if (tab === "remarketing") await loadRemarketing();
      // Configurações mostra lista de backups, manutenção e WhatsApp: recarrega para refletir a ação
      // (ex.: o backup recém-criado aparecer na lista sem precisar trocar de aba).
      if (tab === "configuracoes" || tab === "status") await loadTools();
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }

  // Procura versão nova uma vez ao abrir. Sem internet ou sem configuração, não mostra nada.
  useEffect(() => {
    desktopApi
      .checkUpdate()
      .then(setUpdate)
      .catch(() => {});
  }, []);
  useEffect(() => {
    void refresh();
    void loadReport();
    void loadTools();
  }, []);
  useEffect(() => {
    void refresh();
  }, [agendaDate]);
  useEffect(() => {
    if (tab === "configuracoes") void loadTools();
    if (tab === "remarketing") void loadRemarketing();
  }, [tab, remarketingDays]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        setTab("caixa");
      }
      if (e.key === "F3") {
        e.preventDefault();
        setTab("agenda");
      }
      if (e.key === "Escape") {
        setEditTarget(null);
        setFinishTarget(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function addClient(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    try {
      setError("");
      const client = await desktopApi.createClient({
        name: String(f.get("name") || ""),
        phone: String(f.get("phone") || ""),
        birthDate: String(f.get("birthDate") || ""),
      });
      setNotice("Cliente adicionado.");
      form.reset();
      await refresh();
      if (whatsApp.enabled) {
        const text = `Olá, ${client.name}! Obrigado por se cadastrar na ${settings?.businessName || "barbearia"}.\n${whatsApp.socialLinksText}`;
        desktopApi.sendWhatsAppText(client.id, client.phone, "cadastro", text).catch(() => {});
      }
    } catch (err) {
      setError(String(err));
    }
  }
  async function addService(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    if (
      await mutate(
        () =>
          desktopApi.createService({
            name: String(f.get("name") || ""),
            priceCents: Math.round(Number(f.get("price")) * 100),
            durationMin: Number(f.get("durationMin") || 30),
          }),
        "Serviço adicionado.",
      )
    )
      form.reset();
  }
  async function addStaff(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    if (
      await mutate(
        () =>
          desktopApi.createStaff({
            name: String(f.get("name") || ""),
            phone: String(f.get("phone") || ""),
            commissionPercent: Number(f.get("commission") || 0),
            productCommissionPercent: Number(f.get("productCommission") || 0),
          }),
        "Colaborador adicionado.",
      )
    )
      form.reset();
  }
  async function addProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    if (
      await mutate(
        () =>
          desktopApi.createProduct({
            name: String(f.get("name") || ""),
            description: String(f.get("description") || ""),
            priceCents: Math.round(Number(f.get("price")) * 100),
            stock: Number(f.get("stock") || 0),
          }),
        "Produto adicionado.",
      )
    )
      form.reset();
  }

  function toggleService(id: number) {
    setSelectedServices((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
    setAvailableTimes([]);
    setSelectedTime("");
  }
  async function checkAvailability(form: HTMLFormElement) {
    const f = new FormData(form);
    if (!selectedServices.length) {
      setError("Escolha pelo menos um serviço.");
      return;
    }
    try {
      const result = await desktopApi.availability({
        date: String(f.get("date") || agendaDate),
        serviceIds: selectedServices,
        staffId: Number(f.get("staffId") || 0) || null,
      });
      setAvailableTimes(result.availableTimes);
      setAvailabilityDuration(result.durationMin);
      setAvailabilityTotal(result.totalCents);
      setError("");
    } catch (e) {
      setError(String(e));
    }
  }
  function overtimeWarning() {
    if (!selectedTime || !availabilityDuration) return "";
    const date = new Date(`${agendaDate}T00:00:00`),
      day = date.getDay(),
      row = openingHours.find((r) => r.dayOfWeek === day);
    if (!row?.enabled) return "";
    const [h, m] = selectedTime.split(":").map(Number),
      end = h * 60 + m + availabilityDuration,
      [eh, em] = row.endTime.split(":").map(Number),
      closing = eh * 60 + em;
    if (end <= closing) return "";
    return `Atenção: este atendimento termina às ${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}, após o expediente (${row.endTime}). Você pode agendar mesmo assim.`;
  }
  async function addAppointment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form),
      clientId = Number(f.get("clientId") || 0) || null,
      client = clients.find((c) => c.id === clientId);
    try {
      const created = await desktopApi.createAppointment({
        clientId,
        clientName: client?.name || String(f.get("clientName") || ""),
        phone: client?.phone || String(f.get("phone") || ""),
        staffId: Number(f.get("staffId") || 0) || null,
        serviceIds: selectedServices,
        date: String(f.get("date") || agendaDate),
        time: String(f.get("time") || ""),
        note: String(f.get("note") || ""),
      });
      setNotice("Agendamento criado.");
      setSelectedServices([]);
      setAvailableTimes([]);
      setSelectedTime("");
      form.reset();
      await refresh();
      if (whatsApp.enabled)
        desktopApi
          .sendWhatsAppText(created.clientId, created.phone, "agendamento", appointmentMessage(created))
          .catch(() => {});
    } catch (err) {
      setError(String(err));
    }
  }
  function appointmentMessage(a: Appointment) {
    return `Olá, ${a.clientName}! Seu agendamento na ${settings?.businessName || "barbearia"} foi registrado.\n\n${a.serviceNames}\n${a.date.split("-").reverse().join("/")} às ${a.time}\nProfissional: ${a.staffName}\nDuração: ${a.durationMin} min\nValor: ${money(a.totalCents)}\n\nResponda CONFIRMO para confirmar o horário.`;
  }
  /**
   * Botões de WhatsApp: com a API da Meta ativa, envia direto; sem ela (o padrão),
   * abre o WhatsApp do computador com a mensagem pronta para o barbeiro conferir e enviar.
   */
  async function whatsAppAction(
    clientId: number | null,
    phone: string,
    type: string,
    text: string,
    sentMessage: string,
  ) {
    if (whatsApp.enabled) {
      await mutate(() => desktopApi.sendWhatsAppText(clientId, phone, type, text), sentMessage);
      return;
    }
    try {
      setError("");
      setNotice("");
      await desktopApi.openWhatsAppLink(phone, text);
      setNotice("WhatsApp aberto com a mensagem pronta. Confira e envie.");
    } catch (e) {
      setError(String(e));
    }
  }
  async function sendAppointmentWhatsApp(a: Appointment) {
    await whatsAppAction(
      a.clientId,
      a.phone,
      "agendamento",
      appointmentMessage(a),
      "Mensagem enviada pelo WhatsApp.",
    );
  }
  async function finishAppointment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!finishTarget) return;
    const f = new FormData(e.currentTarget),
      payment = String(f.get("paymentMethod") || "");
    const item = finishTarget;
    setFinishTarget(null);
    const ok = await mutate(
      () => desktopApi.updateAppointment({ id: item.id, status: "Finalizado", paymentMethod: payment }),
      "Atendimento finalizado e lançado no Caixa.",
    );
    if (ok && whatsApp.enabled) {
      const text = `Obrigado, ${item.clientName}! Foi um prazer atender você na ${settings?.businessName || "barbearia"}. Esperamos ver você novamente em breve!`;
      desktopApi.sendWhatsAppText(item.clientId, item.phone, "finalizacao", text).catch(() => {});
    }
  }
  async function changeStatus(a: Appointment, status: string) {
    await mutate(() => desktopApi.updateAppointment({ id: a.id, status }), "Agendamento atualizado.");
  }

  function selectCashService(value: string) {
    setCashServiceId(value);
    const service = services.find((s) => s.id === Number(value));
    if (service) {
      setCashDescription(service.name);
      setCashAmount((service.priceCents / 100).toFixed(2));
    } else {
      setCashDescription("");
      setCashAmount("");
    }
  }
  function changeCashSaleType(value: "service" | "product" | "other") {
    setCashSaleType(value);
    setCashServiceId("");
    setCashDescription("");
    setCashAmount("");
  }
  async function addCash(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form),
      kind = cashKind;
    const ok = await mutate(
      () =>
        desktopApi.createCashTransaction({
          kind,
          description: String(f.get("description") || "Lançamento de caixa"),
          amountCents: Math.round(Number(f.get("amount") || 0) * 100),
          date: String(f.get("date") || cashEntryDate),
          paymentMethod: String(f.get("paymentMethod") || ""),
          clientId: Number(f.get("clientId") || 0) || null,
          staffId: Number(f.get("staffId") || 0) || null,
          saleType: kind === "entrada" ? cashSaleType : "other",
          serviceId: Number(f.get("serviceId") || 0) || null,
          productId: Number(f.get("productId") || 0) || null,
          quantity: Number(f.get("quantity") || 1),
        }),
      kind === "entrada" && cashSaleType === "service"
        ? "Serviço lançado e atendimento contabilizado."
        : "Lançamento salvo.",
    );
    if (ok) {
      form.reset();
      // form.reset() volta as caixas para "Entrada" / "Serviço" na tela; o estado do React
      // precisa acompanhar, senão a tela mostra "Serviço" com os campos de produto.
      setCashKind("entrada");
      setCashSaleType("service");
      setCashEntryDate(localDate());
      setCashDescription("");
      setCashAmount("");
      setCashServiceId("");
    }
  }
  async function deleteCash(i: CashTransaction) {
    const extra =
      i.saleType === "product"
        ? " O estoque da venda será devolvido."
        : i.source === "atendimento"
          ? " O agendamento voltará para Confirmado."
          : "";
    if (
      !window.confirm(
        `Excluir definitivamente o lançamento \"${i.description}\"? Ele sairá dos cálculos do Caixa.${extra}`,
      )
    )
      return;
    await mutate(() => desktopApi.deleteCashTransaction(i.id), "Lançamento excluído e cálculos atualizados.");
  }
  async function archive(kind: "client" | "service" | "staff" | "product", id: number) {
    if (!window.confirm("Arquivar este registro? O histórico será preservado.")) return;
    const fn =
      kind === "client"
        ? desktopApi.setClientActive
        : kind === "service"
          ? desktopApi.setServiceActive
          : kind === "staff"
            ? desktopApi.setStaffActive
            : desktopApi.setProductActive;
    await mutate(() => fn(id, false), "Registro arquivado.");
    await loadArchived(kind);
  }
  async function remove(kind: "client" | "service" | "staff" | "product", id: number) {
    if (
      !window.confirm(
        "Excluir para sempre? Se houver atendimentos ou lançamentos ligados a este registro, a exclusão é bloqueada; use Arquivar.",
      )
    )
      return;
    const fn =
      kind === "client"
        ? desktopApi.deleteClient
        : kind === "service"
          ? desktopApi.deleteService
          : kind === "staff"
            ? desktopApi.deleteStaff
            : desktopApi.deleteProduct;
    await mutate(() => fn(id), "Registro excluído.");
  }
  async function restore(item: ArchivedItem) {
    await mutate(() => desktopApi.restoreArchived(item.kind as any, item.id), "Registro reativado.");
    await loadArchived(item.kind as any);
  }

  async function closeSettlement(item: Staff) {
    const p = performance.find((x) => x.staffId === item.id);
    if (!p || p.commissionCents <= 0) {
      setError("Este colaborador não possui comissão em aberto neste período.");
      return;
    }
    if (
      !window.confirm(
        `Fechar ${item.name} de ${settlementStart.split("-").reverse().join("/")} a ${settlementEnd.split("-").reverse().join("/")}?\n\nProdução: ${money(p.grossCents)}\nComissão a pagar: ${money(p.commissionCents)}\nParte da barbearia: ${money(p.netCents)}`,
      )
    )
      return;
    const ok = await mutate(
      () => desktopApi.createStaffSettlement(item.id, settlementStart, settlementEnd),
      `Fechamento de ${item.name} registrado.`,
    );
    if (ok) await loadSettlements(item);
  }
  async function reopenSettlement(item: StaffSettlement) {
    if (
      !window.confirm(
        `Reabrir o fechamento de ${item.staffName} (${item.startDate.split("-").reverse().join("/")} a ${item.endDate.split("-").reverse().join("/")})? Os lançamentos voltarão para o saldo em aberto.`,
      )
    )
      return;
    const staffItem = staff.find((s) => s.id === item.staffId);
    const ok = await mutate(() => desktopApi.reopenStaffSettlement(item.id), "Fechamento reaberto.");
    if (ok && staffItem) await loadSettlements(staffItem);
  }

  function openMonth(month: number, launch = false) {
    const start = `${reportYear}-${String(month).padStart(2, "0")}-01`,
      endDate = new Date(reportYear, month, 0).getDate(),
      end = `${reportYear}-${String(month).padStart(2, "0")}-${endDate}`;
    setCashStart(start);
    setCashEnd(end);
    if (launch) setCashEntryDate(start);
    setTab("caixa");
    setTimeout(() => void refresh(), 0);
  }
  async function sendRemarketing(c: RemarketingClient) {
    // {nome} vira o primeiro nome, como a tela promete ("Diego Souza" → "Diego").
    const text = remarketingText.replaceAll("{nome}", c.name.trim().split(/\s+/)[0] || c.name);
    await whatsAppAction(c.id, c.phone, "remarketing", text, `Remarketing enviado para ${c.name}.`);
  }
  async function saveHours(rows: OpeningHour[]) {
    await mutate(() => desktopApi.saveOpeningHours(rows), "Horários de funcionamento atualizados.");
    setOpeningHours(rows);
  }

  async function installUpdate() {
    if (!update) return;
    setError("");
    setNotice("");
    try {
      if (update.portable) {
        await desktopApi.openDownloadPage();
        setNotice("Página de download aberta. Baixe a versão nova e substitua o programa nesta pasta.");
        return;
      }
      setUpdating(true);
      setNotice("Baixando a atualização. O app vai reiniciar sozinho quando terminar.");
      await desktopApi.installUpdate();
    } catch (e) {
      setUpdating(false);
      setError(String(e));
    }
  }

  return {
    update,
    updating,
    installUpdate,
    tab,
    setTab,
    health,
    setHealth,
    clients,
    setClients,
    services,
    setServices,
    staff,
    setStaff,
    appointments,
    setAppointments,
    cash,
    setCash,
    products,
    setProducts,
    settings,
    setSettings,
    report,
    setReport,
    performance,
    setPerformance,
    agendaDate,
    setAgendaDate,
    selectedServices,
    setSelectedServices,
    availableTimes,
    setAvailableTimes,
    availabilityDuration,
    setAvailabilityDuration,
    availabilityTotal,
    setAvailabilityTotal,
    selectedTime,
    setSelectedTime,
    cashStart,
    setCashStart,
    cashEnd,
    setCashEnd,
    cashEntryDate,
    setCashEntryDate,
    cashSaleType,
    cashKind,
    setCashKind,
    setCashSaleType,
    cashDescription,
    setCashDescription,
    cashAmount,
    setCashAmount,
    cashServiceId,
    setCashServiceId,
    settlementStart,
    setSettlementStart,
    settlementEnd,
    setSettlementEnd,
    settlements,
    setSettlements,
    settlementStaff,
    setSettlementStaff,
    reportYear,
    setReportYear,
    error,
    setError,
    notice,
    setNotice,
    editTarget,
    setEditTarget,
    finishTarget,
    setFinishTarget,
    openingHours,
    setOpeningHours,
    backups,
    setBackups,
    maintenance,
    setMaintenance,
    whatsApp,
    setWhatsApp,
    remarketingDays,
    setRemarketingDays,
    remarketing,
    setRemarketing,
    remarketingText,
    setRemarketingText,
    archived,
    setArchived,
    income,
    expense,
    commissions,
    serviceEntries,
    concluded,
    ticket,
    balance,
    nextAppointment,
    refresh,
    loadReport,
    loadTools,
    loadRemarketing,
    loadArchived,
    loadSettlements,
    mutate,
    addClient,
    addService,
    addStaff,
    addProduct,
    toggleService,
    checkAvailability,
    overtimeWarning,
    addAppointment,
    appointmentMessage,
    sendAppointmentWhatsApp,
    finishAppointment,
    changeStatus,
    selectCashService,
    changeCashSaleType,
    addCash,
    deleteCash,
    archive,
    remove,
    restore,
    closeSettlement,
    reopenSettlement,
    openMonth,
    sendRemarketing,
    saveHours,
  };
}

/** Tudo o que as páginas recebem: o estado do app e as ações (salvar, excluir, recarregar...). */
export type AppCtx = ReturnType<typeof useAppState>;
