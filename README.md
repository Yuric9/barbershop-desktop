# Gestão da Barbearia (Barbershop Desktop)

Sistema desktop para Windows que organiza a rotina de uma barbearia — agenda, caixa, estoque, comissões de colaboradores e backups — **funcionando 100% offline**, com os dados guardados no próprio computador (ou em um pendrive, no modo portátil).

Feito para barbearias pequenas que precisam de controle financeiro confiável sem depender de internet, mensalidade ou servidor.

> **Versão atual:** `0.2.1` (build de teste — veja [Validação](#validação-antes-de-considerar-estável))

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
- Envio de mensagens pela WhatsApp Cloud API (opcional — única função que usa internet).

**Dados e manutenção**
- Cadastros com histórico são **arquivados** em vez de excluídos, preservando relatórios antigos.
- Backup manual, restauração com verificação de integridade e backup de segurança automático antes de restaurar.
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
 AppModern.tsx  ── telas              lib.rs            ── inicialização e registro dos comandos
 desktop-api.ts ── invoke("cmd") ──▶  commands_*.rs     ── regras de agenda, caixa, estoque, backup
                                      operations.rs     ── edição, exclusão segura, fechamentos, WhatsApp
                                      maintenance.rs    ── diagnóstico e reparos
                                      opening_hours.rs  ── horário de funcionamento
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
4. Para gerar o instalador localmente:
   ```bash
   npm run tauri:build
   ```

> Observação: o ícone do app é gerado pelo workflow de CI. Para `tauri:build` local, coloque um `icon.ico` em `src-tauri/icons/`.

### Variáveis de ambiente

O projeto **não usa variáveis de ambiente**. As configurações (dados da barbearia, destino do backup, credenciais da WhatsApp Cloud API) são feitas pela tela **Configurações** do app e ficam no banco local.

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

O workflow `.github/workflows/windows-build.yml` roda em pushes na `main` (ou manualmente) e gera dois artefatos:

1. **Portátil** — `GestaoBarbearia.exe` + `portable.flag` + `LEIA-ME.txt`.
2. **Instalador** — instalador NSIS (`.exe`).

Detalhes em [BUILD_WINDOWS.md](BUILD_WINDOWS.md). Atualizar pelo instalador substitui os binários sem apagar o banco `barbershop.db`.

### Validação antes de considerar estável

A versão só é considerada estável após passar, em Windows real, por: abertura sem internet; persistência após reiniciar; CRUD de cadastros; conflito de Agenda; finalização criando um único lançamento; exclusão removendo valores e restaurando estoque; cálculo de comissão; fechamento e reabertura; backup, verificação de integridade e restauração; modos portátil e instalado.

---

## Próximos passos

- Guardar o token do WhatsApp no Cofre de Credenciais do Windows em vez do banco.
- Testes automatizados das regras de comissão, estoque e conflito de agenda.
- Dividir `AppModern.tsx` em uma página por módulo.
- Opção de backup criptografado.

---

## Autor

**Yuric9** — [github.com/Yuric9](https://github.com/Yuric9)

<!-- Adicione aqui seu LinkedIn, portfólio ou e-mail de contato, se quiser. -->
