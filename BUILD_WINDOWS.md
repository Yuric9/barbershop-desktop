# Build do Windows

O aplicativo desktop é compilado somente a partir deste repositório: `Yuric9/barbershop-desktop`.

## GitHub Actions

Workflow: `.github/workflows/windows-build.yml` (Windows, Node 22, Rust stable, Vite e Tauri 2).
O próprio workflow gera um ícone neutro de barbearia antes de compilar.

| Gatilho | Resultado |
|---|---|
| push na `main` ou execução manual | build de teste: artefatos *Portable* e *Instalador* na aba Actions |
| tag `v*` (ex.: `v0.3.0`) | build oficial assinado + Release público com atualização automática |

Como publicar uma versão e configurar as chaves: [docs/DISTRIBUICAO.md](docs/DISTRIBUICAO.md).

## Modo portátil

Com `portable.flag` ao lado do executável, banco, configuração e backups ficam em
`barbershop-data/` ao lado do programa. A cópia deve ficar numa pasta gravável.
Não remova um pendrive com o programa aberto.

## Modo instalado

Sem `portable.flag`, os dados ficam na pasta de dados do aplicativo do Windows. Atualizar
pelo instalador (ou pela atualização automática) substitui só o programa, não o banco
`barbershop.db`.

## Validação antes de considerar estável

Em Windows real: abertura sem internet; persistência após reiniciar; cadastros; conflito de
Agenda; finalização criando um único lançamento; exclusão removendo valores e devolvendo
estoque; comissão; fechamento e reabertura; backup manual e automático, restauração válida e
inválida; WhatsApp por link e pela API (token no Cofre de Credenciais); atualização automática
de uma versão para a seguinte; modos portátil e instalado.
