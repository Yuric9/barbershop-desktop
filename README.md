# Barbershop Desktop

Sistema desktop Windows independente para gestão de barbearias.

Este repositório é a fonte oficial e exclusiva do aplicativo desktop. Ele não compartilha código, branches de desenvolvimento ou processo de build com o site público.

## Versão de teste atual

`0.2.0`

Principais regras desta versão:

- lançamentos de Serviço no Caixa contam como atendimentos concluídos;
- exclusão de lançamento remove o valor dos cálculos após confirmação;
- exclusão de venda de produto devolve o estoque correspondente;
- exclusão de lançamento vindo da Agenda reabre o agendamento para correção;
- comissões são descontadas do resultado da barbearia;
- colaboradores possuem saldo em aberto e histórico de fechamentos por período;
- fechamento registra o acerto sem lançar uma segunda despesa no Caixa;
- dados são locais, com modo instalado ou portátil e backups independentes.
