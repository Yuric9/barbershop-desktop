# Distribuição

Como publicar versões do Gestão da Barbearia para os clientes, com atualização automática
e sem certificado pago da Microsoft.

## 1. Configuração única: chave de atualização

A atualização automática só instala arquivos **assinados por você**. A assinatura usa um
par de chaves gratuito (não é o certificado da Microsoft):

- **chave privada**: fica só com você e no GitHub como segredo. Assina cada versão.
- **chave pública**: vai dentro do app. Confere se a atualização veio de você.

> ⚠️ Guarde a chave privada e a senha num lugar seguro (ex.: gerenciador de senhas).
> Se perder, quem já instalou o app **não recebe mais atualizações automáticas** e precisa
> reinstalar manualmente. Se vazar, gere outra e publique uma versão nova.

### Gerar as chaves (no seu computador, uma vez)

Precisa do Node.js instalado. Na pasta do projeto:

```bash
npx tauri signer generate -w ./barbershop-updater.key
```

O comando pede uma senha e cria dois arquivos:

- `barbershop-updater.key` → chave **privada**
- `barbershop-updater.key.pub` → chave **pública**

Não coloque esses arquivos no Git (o `.gitignore` já ignora `*.key` e `*.key.pub`).

### Cadastrar no GitHub

No repositório: **Settings → Secrets and variables → Actions**.

| Onde | Nome | Valor |
|---|---|---|
| aba *Secrets* | `TAURI_SIGNING_PRIVATE_KEY` | conteúdo inteiro do arquivo `barbershop-updater.key` |
| aba *Secrets* | `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | a senha que você escolheu |
| aba *Variables* | `BARBERSHOP_UPDATER_PUBKEY` | conteúdo inteiro do arquivo `barbershop-updater.key.pub` |

## 2. Publicar uma versão

1. Troque a versão nos três arquivos (precisam ser iguais):
   `package.json`, `src-tauri/Cargo.toml` e `src-tauri/tauri.conf.json`.
2. Escreva as novidades em `docs/NOTAS-DA-VERSAO.md`.
3. Faça o merge na `main`.
4. Crie a tag com a mesma versão. Pelo site: **Releases → Draft a new release → Choose a
   tag**, digite `v0.3.0` (por exemplo), escolha a `main` e publique. Ou no terminal:

   ```bash
   git tag v0.3.0
   ```

   ```bash
   git push origin v0.3.0
   ```

5. O GitHub Actions compila, assina e cria o Release com:
   - `GestaoBarbearia_<versão>_x64-setup.exe` (instalador)
   - `GestaoBarbearia_<versão>_portatil.zip`
   - `latest.json` (o app consulta este arquivo para saber se há versão nova)
   - `SHA256SUMS.txt`

Se a tag não bater com a versão dos arquivos, ou se as chaves não estiverem cadastradas,
o build para com uma mensagem explicando.

O link fixo para divulgar é sempre:
**https://github.com/Yuric9/barbershop-desktop/releases/latest**

## 3. Sem certificado da Microsoft

Sem certificado de assinatura de código, o Windows mostra **"O Windows protegeu o
computador"** na primeira vez que alguém abre um programa novo. Não há como remover isso
de graça, mas dá para reduzir o atrito:

1. **Ensine o caminho.** O `LEIA-ME.txt` e a página do Release explicam: *Mais informações →
   Executar assim mesmo*. Vale gravar um vídeo curto mostrando isso.
2. **Um só lugar de download.** Divulgue sempre o link do GitHub Releases. Arquivos
   repassados por WhatsApp ou pendrive geram mais desconfiança (e risco de versão adulterada).
3. **Códigos SHA-256.** Cada Release traz o `SHA256SUMS.txt` para quem quiser conferir.
4. **Falso positivo de antivírus.** Se o Windows Defender bloquear o arquivo, envie-o
   para análise da Microsoft como desenvolvedor (gratuito):
   https://www.microsoft.com/wdsi/filesubmission
5. **Atualizações automáticas ajudam.** Depois da primeira instalação, as versões novas
   chegam pelo próprio app, sem o aviso de download do navegador a cada versão.
6. **Opção gratuita para projetos de código aberto: SignPath Foundation.** Assina
   gratuitamente programas open source compilados pelo GitHub Actions. Exige que o
   repositório tenha uma licença open source — decisão de negócio: o código fica aberto
   para qualquer pessoa (o que não impede vender suporte, instalação ou uma versão paga).
   https://signpath.org

Quando houver orçamento, um certificado (ex.: Azure Trusted Signing) elimina o aviso.

## 4. Antes de distribuir em escala

- [ ] Teste fechado com 3 a 5 barbearias por algumas semanas.
- [ ] Testar no Windows: instalação, atualização automática (publique uma 0.3.1 de teste),
      backup automático, WhatsApp por link e pela API.
- [ ] Revisar `docs/TERMOS-DE-USO.md` e `docs/POLITICA-DE-PRIVACIDADE.md` com um advogado.
- [ ] Decidir o modelo de negócio (gratuito, venda única, assinatura) antes de exigir licença.
