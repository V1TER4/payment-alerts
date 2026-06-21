# Payment Alerts

Sistema de gestão de contas a pagar com notificações inteligentes por WhatsApp, SMS e e-mail.

## Sobre o projeto

Payment Alerts é uma aplicação desenvolvida para ajudar usuários a organizar pagamentos recorrentes e evitar atrasos em contas, boletos e compromissos financeiros.

A plataforma permite cadastrar contas, definir datas de vencimento, acompanhar pagamentos e receber lembretes automáticos antes do vencimento através de múltiplos canais de comunicação.

O sistema possui uma lógica inteligente de calendário que considera finais de semana e feriados, antecipando notificações para o último dia útil disponível quando necessário.

## Objetivo

O Payment Alerts foi criado para simplificar o gerenciamento de contas a pagar, ajudando usuários a manterem seus compromissos financeiros em dia através de notificações automatizadas e regras inteligentes de calendário.

## Funcionalidades

* Cadastro de contas a pagar
* Controle de vencimentos
* Registro de valores
* Categorias personalizadas
* Contas recorrentes (mensais, semanais, anuais)
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
* Exclusão em cascata de contas recorrentes
* Remoção automática de instâncias futuras ao desativar recorrência

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

## Como Executar

### Usando Docker (Recomendado)

```bash
# Copie as variáveis de ambiente
cp .env.example .env

# Suba os containers
docker compose up --build
```

O container da API executa as migrations e o seed automaticamente na inicialização.

### Usando NPM (Desenvolvimento local)

```bash
# 1. Instale as dependências
npm install

# 2. Configure o banco de dados
# Certifique-se de ter PostgreSQL rodando localmente
# Edite o arquivo .env com a URL do seu banco

# 3. Execute as migrações do Prisma
cd prisma && npx prisma migrate dev

# 4. (Opcional) Execute o seed
npx ts-node seed.ts

# 5. Inicie a API
cd api && npm run start:dev

# 6. Em outro terminal, inicie o frontend
cd web && npm run dev
```

## Acesso aos Serviços

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000 |
| Swagger (Documentação) | http://localhost:3000/api/docs |
| Prisma Studio | `cd prisma && npx prisma studio` |

## Credenciais de Demonstração

* E-mail: `admin@contas.local`
* Senha: `admin123`

## Estrutura do Projeto

```
payment-alerts/
├── api/               # Backend NestJS
│   └── src/
│       ├── modules/   # Módulos (bills, users, notifications, etc.)
│       ├── infra/    # Serviços de infraestrutura
│       └── shared/   # Utilitários
├── web/               # Frontend React
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       └── types/
├── prisma/            # Schema e migrações do BD
└── docker-compose.yml # Orquestração Docker
```

## Funcionalidades Entregues

* Login e cadastro
* Dashboard com período filtrável
* Cadastro, edição, listagem e remoção de contas
* Exclusão em cascata de contas recorrentes
* Remoção automática de instâncias futuras ao desativar recorrência
* Configurações de canais e dias antes do alerta
* Histórico de notificações
* Cron diário para geração e envio de notificações
* Regras de dias úteis e feriados nacionais
