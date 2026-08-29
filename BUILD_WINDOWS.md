# Build do Windows

O aplicativo desktop é compilado somente a partir deste repositório: `Yuric9/barbershop-desktop`.

## GitHub Actions

Workflow: `.github/workflows/windows-build.yml`

A build usa `windows-latest`, Node 22, Rust stable, Vite e Tauri 2. O próprio workflow gera um ícone neutro de barbearia e cria os ícones de plataforma antes da compilação.

Artefatos esperados para a versão 0.2.0:

1. `GestaoBarbearia-v0.2.0-Portable`
   - `GestaoBarbearia.exe`
   - `portable.flag`
   - `LEIA-ME.txt`
   - na primeira execução, o aplicativo cria `barbershop-data/` ao lado do executável.

2. `GestaoBarbearia-v0.2.0-Instalador`
   - instalador NSIS do Windows (`.exe`).

## Modo portátil

A cópia portátil deve permanecer em uma pasta gravável. Quando `portable.flag` está ao lado do executável, banco, configuração e backups ficam sob `barbershop-data/` ao lado do programa.

Não remova um pendrive enquanto o programa estiver aberto. Faça backup antes de formatar, substituir ou mover o dispositivo.

## Modo instalado

Sem `portable.flag`, os dados graváveis ficam na pasta de dados do aplicativo do Windows resolvida pelo Tauri. Atualizar o instalador substitui os binários sem substituir automaticamente o banco `barbershop.db`.

## Validação antes de considerar estável

A build deve passar por: abertura sem internet; persistência após reiniciar; criação/edição/exclusão de cadastros; conflito de Agenda; finalização da Agenda criando apenas um lançamento; lançamento manual de Serviço contando atendimento; exclusão removendo o valor dos cálculos; exclusão de produto restaurando estoque; cálculo de comissão; fechamento e reabertura de colaboradores; relatórios líquidos de comissão; backup, verificação de integridade e restauração segura; modo portátil e instalado.

Até esses testes passarem em Windows real, a versão é considerada build de teste.
