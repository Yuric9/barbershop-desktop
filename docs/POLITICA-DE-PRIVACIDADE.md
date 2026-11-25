# Política de Privacidade — Gestão da Barbearia

> **Modelo para revisão.** Este texto foi preparado a partir do funcionamento real do
> aplicativo, mas não substitui orientação jurídica. Revise com um advogado antes de
> distribuir e preencha os campos entre colchetes.

Última atualização: [DATA]

## 1. Quem somos

O **Gestão da Barbearia** é um programa para Windows desenvolvido por **[NOME OU RAZÃO
SOCIAL DO DESENVOLVEDOR]** ([CPF/CNPJ]), contato: **[E-MAIL DE CONTATO]**.

Esta política explica quais dados o programa usa, onde eles ficam e quem é responsável
por eles, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).

## 2. Os dados ficam no seu computador

O programa funciona **sem servidor do desenvolvedor**. Tudo o que a barbearia cadastra —
clientes, agenda, caixa, colaboradores, produtos e configurações — é gravado **apenas no
computador onde o programa está instalado** (ou no pendrive, no modo portátil) e nos
backups que a própria barbearia escolher.

**O desenvolvedor não recebe, não acessa e não armazena** esses dados. O programa não
envia estatísticas de uso nem relatórios de erro automaticamente.

## 3. Quais dados o programa guarda

| Tipo | Exemplos | Para quê |
|---|---|---|
| Clientes da barbearia | nome, telefone, data de nascimento, histórico de atendimentos e gastos | agenda, histórico, lembretes e remarketing |
| Colaboradores | nome, telefone, percentuais de comissão, produção | cálculo de comissões e fechamentos |
| Financeiro | entradas, despesas, formas de pagamento | caixa e relatórios |
| Configurações | dados da barbearia, horários, pasta de backup | funcionamento do programa |
| Credencial da API do WhatsApp (opcional) | token de acesso da Meta | envio automático de mensagens |

O token da API do WhatsApp é guardado no **Cofre de Credenciais do Windows** da conta do
usuário, e não no banco de dados nem nos backups.

## 4. Quando o programa usa a internet

O programa funciona offline. Ele só se conecta à internet nestas situações:

1. **Verificação de atualizações.** Ao abrir, consulta a página de versões do projeto no
   GitHub (`github.com`). Essa consulta não leva dados da barbearia; como em qualquer
   acesso à internet, o GitHub recebe o endereço IP e informações técnicas da conexão,
   conforme a política de privacidade do GitHub.
2. **Botão de WhatsApp (sem API).** O programa abre o WhatsApp ou o navegador com uma
   mensagem pronta para o telefone do cliente. A mensagem só é enviada se o usuário
   confirmar, pela conta de WhatsApp da própria barbearia, e segue as políticas da Meta.
3. **API oficial do WhatsApp (opcional).** Se a barbearia ativar a integração, o telefone do
   cliente e o texto da mensagem são enviados à Meta (`graph.facebook.com`) para entrega.

## 5. Quem é responsável pelos dados dos clientes

A **barbearia** que usa o programa decide quais dados coletar e para quê. Por isso, pela
LGPD, ela é a **controladora** dos dados dos seus clientes e colaboradores, e cabe a ela:

- informar os clientes sobre o uso dos dados (por exemplo, com um aviso no balcão);
- ter uma base legal para cada uso — em especial, **mensagens de remarketing e
  promoções** devem ser enviadas apenas a quem autorizou recebê-las;
- atender pedidos dos titulares (ver item 6);
- proteger o computador (senha de acesso ao Windows, antivírus) e os backups.

Como não recebe nem trata esses dados, o desenvolvedor não atua como controlador nem
como operador dos dados cadastrados pela barbearia.

## 6. Direitos dos titulares

Clientes e colaboradores podem pedir à barbearia acesso, correção ou exclusão dos seus
dados. No programa:

- **corrigir:** botão *Editar* no cadastro;
- **parar de usar:** botão *Arquivar* (o cadastro sai das listas, e o histórico financeiro
  é preservado);
- **excluir:** botão *Excluir*, disponível quando o cadastro não tem atendimentos ou
  lançamentos ligados. Registros financeiros podem precisar ser mantidos por obrigação
  legal ou fiscal.

## 7. Segurança e retenção

- Os dados ficam no computador e nos backups da barbearia. Quem tiver acesso ao computador
  ou a um backup consegue ler os dados — proteja ambos.
- O programa faz uma cópia de segurança automática por dia e guarda as 14 mais recentes;
  cópias manuais ficam até a barbearia apagá-las.
- Ao desinstalar o programa, o banco de dados não é apagado automaticamente. Para apagar
  tudo, exclua a pasta de dados e os backups.

## 8. Alterações

Esta política pode mudar junto com o programa. A versão vigente acompanha cada versão
publicada em https://github.com/Yuric9/barbershop-desktop/releases.

## 9. Contato

Dúvidas sobre esta política: **[E-MAIL DE CONTATO]**.
