# Drop CP API

Backend MVP para controle de drops de uma CP (Clan Party) de Lineage 2.

## Stack

- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Auth
- Bcrypt
- Class Validator
- Docker Compose
- Swagger

## Estrutura de Pastas

```
src/
  auth/              # Login, JWT strategy
  users/             # CRUD de usuários
  items/             # CRUD de itens
  drops/             # Registro de drops com regras de negócio
  dashboard/         # Estatísticas e overview
  common/
    decorators/      # @Roles(), @CurrentUser()
    enums/           # UserRole, ItemGrade, DropType
    guards/          # JwtAuthGuard, RolesGuard
    utils/           # parseAdena()
  shared/prisma/     # PrismaService global
prisma/
  schema.prisma      # Schema do banco
  seed.ts            # Seed inicial
```

## Como rodar

### 1. Subir o PostgreSQL

```bash
npm run db:up
```

Ou:

```bash
docker-compose up -d
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Rodar migrations e seed

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Iniciar o servidor

```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3000/api`

Documentação Swagger: `http://localhost:3000/api/docs`

## Autenticação

Todas as rotas (exceto login) exigem Bearer Token JWT.

Usuário admin padrão do seed:
- Email: `admin@dropcp.com`
- Senha: `admin123`

## Regras de Negócio

- ADMIN pode criar, editar e excluir usuários, itens e drops.
- MEMBER pode apenas listar e visualizar.
- Drops não podem ser criados sem itens ou sem participantes.
- Valores de adena aceitos: `10k`, `100k`, `1kk`, `10kk`, etc.
- O total do drop é calculado automaticamente pela soma dos itens.
- A divisão por player é calculada automaticamente: `splitValue = totalValue / participantes`.
- O frontend não deve enviar `totalValue`; o backend sempre recalcula.
- O `itemName` é salvo no `DropItem` para manter histórico mesmo se o item for alterado depois.

## Rotas da API

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Users (Admin)
- `GET /api/users`
- `POST /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`

### Items
- `GET /api/items`
- `POST /api/items` (Admin)
- `GET /api/items/:id`
- `PATCH /api/items/:id` (Admin)
- `DELETE /api/items/:id` (Admin)

### Drops
- `GET /api/drops`
- `POST /api/drops` (Admin)
- `GET /api/drops/:id`
- `PATCH /api/drops/:id` (Admin)
- `DELETE /api/drops/:id` (Admin)

### Dashboard
- `GET /api/dashboard/overview`

## Comandos úteis

```bash
# Gerar cliente Prisma
npm run prisma:generate

# Criar nova migration
npm run prisma:migrate

# Abrir Prisma Studio
npm run prisma:studio

# Rodar seed
npm run prisma:seed

# Subir/Descer banco
npm run db:up
npm run db:down
```

## Exemplos de Payloads

Veja o arquivo `scripts/insomnia-examples.json` para exemplos de requisições.
