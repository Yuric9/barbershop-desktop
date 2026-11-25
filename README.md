# Gestão da Barbearia (Barbershop Desktop)

Sistema desktop para Windows que organiza a rotina de uma barbearia — agenda, caixa, estoque, comissões de colaboradores e backups — **funcionando 100% offline**, com os dados guardados no próprio computador (ou em um pendrive, no modo portátil).

Feito para barbearias pequenas que precisam de controle financeiro confiável sem depender de internet, mensalidade ou servidor.

> **Versão atual:** `0.3.0` (em teste — veja [Validação](#validação-antes-de-considerar-estável))
>
> **Download:** [página de versões](https://github.com/Yuric9/barbershop-desktop/releases/latest)

<!-- Sugestão: adicione aqui uma captura da tela da Agenda e do Caixa.
     Ex.: ![Agenda](docs/screenshots/agenda.png) -->

---

## Funcionalidades

**Agenda**
- Horários livres calculados automaticamente a partir do horário de funcionamento, da duração dos serviços e dos agendamentos já existentes.
- Bloqueio de horários ou do dia inteiro, por colaborador ou geral.
- Detecção de conflito de horário (validada no backend).
- Ao **finalizar** um atendimento, o lançamento no Caixa é criado automaticamente, com a comissão calculada — e nunca em duplicidade.

**Caixa**
- Entradas (serviço, produto, outros) e despesas.
- Lançamentos de Serviço contam como atendimentos concluídos nos relatórios.
- Excluir um lançamento remove o valor dos cálculos; se veio da Agenda, o agendamento é reaberto para correção.
- Relatório mensal e anual: faturamento, despesas, comissões e resultado líquido.

**Estoque**
- Venda de produto no Caixa baixa o estoque; excluir a venda devolve o estoque.
- Ajustes manuais com histórico de movimentações.

**Colaboradores e comissões**
- Percentual de comissão padrão para serviços e para produtos, e percentual específico por serviço.
- Saldo em aberto por colaborador e **fechamento por período**, que trava os lançamentos incluídos; o fechamento pode ser reaberto para correções.
- O fechamento registra o acerto sem lançar uma segunda despesa no Caixa.

**Clientes**
- Cadastro com telefone e data de nascimento.
- Remarketing: lista de clientes sem visita há X dias, com total gasto.
- WhatsApp com a mensagem pronta: os botões abrem o WhatsApp do computador, sem cadastro na Meta. Opcionalmente, envio automático pela WhatsApp Cloud API (token guardado no Cofre de Credenciais do Windows).

**Dados e manutenção**
- Cadastros com histórico são **arquivados** em vez de excluídos, preservando relatórios antigos.
- Backup automático diário (guarda as 14 cópias mais recentes) e manual; aviso quando o último backup estiver antigo; restauração com verificação de integridade e cópia de segurança antes de restaurar.
- Atualização automática pelo GitHub Releases (instalador) e aviso de versão nova (portátil).
- Diagnóstico do banco (integridade, estoque negativo, comissões inválidas, vínculos quebrados) e reparos seguros.
- Tema claro e escuro.

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Interface | React 19 + TypeScript, Vite 7 |
| Desktop | Tauri 2 |
| Backend / regras de negócio | Rust (edição 2021) |
| Banco de dados | SQLite local (`rusqlite`, modo WAL) |
| Integração opcional | WhatsApp Cloud API (`reqwest` com rustls) |
| Build / distribuição | GitHub Actions (`windows-latest`) → instalador NSIS e versão portátil |

---

## Arquitetura

```
src/ (React)                         src-tauri/src/ (Rust)
 AppModern.tsx  ── menu e navegação   lib.rs            ── inicialização, registro dos comandos e testes
 pages/         ── uma tela por aba   commands_*.rs     ── regras de agenda, caixa, estoque, backup
 components/    ── peças reutilizáveis operations.rs    ── edição, exclusão segura, fechamentos, WhatsApp
 state/         ── estado e ações     maintenance.rs    ── diagnóstico e reparos
 desktop-api.ts ── invoke("cmd") ──▶  opening_hours.rs  ── horário de funcionamento
                                      secrets.rs        ── Cofre de Credenciais do Windows
                                      backups.rs        ── backup manual e automático
                                      updates.rs        ── atualização automática
                                               │
                                               ▼
                                       SQLite: barbershop.db
```

- A interface **nunca acessa o banco diretamente**: ela chama comandos Rust via `invoke`. Toda regra de negócio é validada no backend.
- Valores em dinheiro são armazenados em **centavos (inteiros)** para evitar erros de arredondamento.
- Operações que alteram mais de uma tabela (venda com baixa de estoque, finalização de atendimento, fechamento) rodam em **transações**.

### Onde ficam os dados

| Modo | Como ativar | Local dos dados |
|---|---|---|
| **Instalado** | padrão | Pasta de dados de aplicativo do Windows (resolvida pelo Tauri) |
| **Portátil** | arquivo `portable.flag` ao lado do `.exe` | `barbershop-data/` ao lado do executável |

Dentro da pasta: `data/barbershop.db`, `backups/`, `logs/`, `assets/` e `config/`.

---

## Como rodar localmente

**Pré-requisitos:** Node.js 22+, Rust (stable) e as [dependências do Tauri 2](https://v2.tauri.app/start/prerequisites/) para o seu sistema.

1. Clone o repositório:
   ```bash
   git clone https://github.com/Yuric9/barbershop-desktop.git
   cd barbershop-desktop
   ```
2. Instale as dependências JavaScript:
   ```bash
   npm install
   ```
3. Inicie em modo de desenvolvimento (abre a janela do app com recarga automática):
   ```bash
   npm run tauri:dev
   ```
4. Testes do backend e formatação do código:
   ```bash
   cd src-tauri && cargo test
   ```
   ```bash
   npm run format
   ```
5. Para gerar o instalador localmente:
   ```bash
   npm run tauri:build
   ```

> Observação: o ícone do app é gerado pelo workflow de CI. Para `tauri:build` local, coloque um `icon.ico` em `src-tauri/icons/`.

### Variáveis de ambiente

O projeto **não usa variáveis de ambiente**. As configurações (dados da barbearia, destino do backup, WhatsApp Cloud API) são feitas pela tela **Configurações** do app e ficam no banco local — exceto o **Access Token do WhatsApp**, que fica no **Cofre de Credenciais do Windows** e nunca vai para o banco nem para os backups.

---

## Banco de dados

O schema é criado e migrado automaticamente na abertura do app (`initialize_database` em `model_core.rs`). Principais tabelas:

| Tabela | Conteúdo |
|---|---|
| `clients`, `services`, `staff`, `products` | Cadastros (com flag `active` para arquivamento) |
| `appointments`, `appointment_services` | Agenda e serviços de cada atendimento |
| `schedule_blocks`, `opening_hours` | Bloqueios e horário de funcionamento |
| `cash_transactions` | Todas as entradas e despesas, com comissão e valor líquido |
| `stock_movements` | Histórico de estoque |
| `staff_service_commissions` | Comissão específica por colaborador e serviço |
| `staff_settlements` | Fechamentos de comissão por período |
| `business_settings`, `whatsapp_settings`, `whatsapp_messages` | Configurações e log de mensagens |

---

## Build e distribuição (Windows)

O workflow `.github/workflows/windows-build.yml` gera o **instalador** (NSIS) e a versão **portátil** (`GestaoBarbearia.exe` + `portable.flag` + `LEIA-ME.txt`):

- push na `main` ou execução manual → build de teste, com os arquivos na aba Actions;
- tag `v*` (ex.: `v0.3.0`) → build oficial assinado para atualização automática e Release público.

Como publicar uma versão, configurar a chave de atualização e distribuir sem certificado da Microsoft: [docs/DISTRIBUICAO.md](docs/DISTRIBUICAO.md). Detalhes do build: [BUILD_WINDOWS.md](BUILD_WINDOWS.md). Atualizar substitui só o programa, sem apagar o banco `barbershop.db`.

### Validação antes de considerar estável

A versão só é considerada estável após passar pelo roteiro de [BUILD_WINDOWS.md](BUILD_WINDOWS.md#validação-antes-de-considerar-estável) em Windows real.

---

## Próximos passos

- Teste fechado com barbearias reais.
- Ampliar os testes automatizados (comissão, estoque e conflito de agenda).
- Opção de backup criptografado.
- Definir modelo de negócio e, se for pago, licença de uso.

---

## Autor

**Yuric9** — [github.com/Yuric9](https://github.com/Yuric9)

<!-- Adicione aqui seu LinkedIn, portfólio ou e-mail de contato, se quiser. -->
