# Payment Alerts

Sistema de gestão de contas a pagar com notificações inteligentes por WhatsApp, SMS e e-mail.

## Sobre o projeto

Payment Alerts é uma aplicação desenvolvida para ajudar usuários a organizar pagamentos recorrentes e evitar atrasos em contas, boletos e compromissos financeiros.

A plataforma permite cadastrar contas, definir datas de vencimento, acompanhar pagamentos e receber lembretes automáticos antes do vencimento através de múltiplos canais de comunicação.

O sistema possui uma lógica inteligente de calendário que considera finais de semana e feriados, antecipando notificações para o último dia útil disponível quando necessário.

## Funcionalidades

* Cadastro de contas a pagar
* Controle de vencimentos
* Registro de valores
* Categorias personalizadas
* Contas recorrentes
* Dashboard financeiro
* Histórico de pagamentos
* Notificações por WhatsApp
* Notificações por SMS
* Notificações por e-mail
* Configuração de lembretes personalizados
* Identificação automática de dias úteis
* Integração com calendário de feriados
* Histórico de notificações enviadas
* Controle de contas pagas e pendentes

## Como funciona

Ao cadastrar uma conta, o usuário informa:

* Nome da conta
* Valor
* Data de vencimento
* Categoria
* Recorrência
* Canal de notificação

O sistema executa verificações diárias para identificar pagamentos próximos do vencimento e envia alertas conforme as configurações definidas pelo usuário.

Quando uma data de vencimento coincide com um final de semana ou feriado, os lembretes são antecipados automaticamente para o último dia útil anterior.

## Tecnologias

### Backend

* NestJS
* TypeScript
* Prisma ORM
* PostgreSQL
* Swagger
* Cron Jobs

### Frontend

* React
* Vite
* TypeScript
* React Query
* React Hook Form
* Tailwind CSS

### Infraestrutura

* Docker
* Docker Compose

## Objetivo

O Payment Alerts foi criado para simplificar o gerenciamento de contas a pagar, ajudando usuários a manterem seus compromissos financeiros em dia através de notificações automatizadas e regras inteligentes de calendário.
