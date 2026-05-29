# Drop CP Frontend

Frontend React para o sistema de controle de drops de CP de Lineage 2.

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- shadcn/ui (estilização)
- TanStack Query (React Query)
- Axios
- React Hook Form + Zod
- React Router DOM
- Lucide React (ícones)

## Como rodar

### Pré-requisito
O backend deve estar rodando em `http://localhost:3000`.

### Instalar e iniciar

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`

Credenciais padrão:
- Email: `admin@dropcp.com`
- Senha: `admin123`

## Estrutura de Pastas

```
src/
  components/
    ui/           # Componentes base estilo shadcn (Button, Input, Card, etc.)
    layout/       # Layout com Sidebar responsiva
  hooks/
    useAuth.tsx   # Contexto de autenticação
  lib/
    axios.ts      # Instância do Axios com interceptors
    queryClient.ts # Config do TanStack Query
    utils.ts      # cn() helper
  pages/
    LoginPage.tsx
    DashboardPage.tsx
    UsersPage.tsx
    ItemsPage.tsx
    DropsPage.tsx
  types/
    index.ts      # Interfaces TypeScript
  App.tsx
  main.tsx
```

## Funcionalidades

### Autenticação
- Login com validação via Zod
- Logout
- Rotas protegidas
- Redirecionamento automático para login

### Dashboard
- Cards com estatísticas (total dropado, total de drops, dia com maior valor, item mais dropado)
- Ranking de itens mais dropados
- Drops por dia

### Usuários (somente ADMIN)
- Listagem em tabela
- Criar/Editar/Excluir
- Validação de formulário

### Itens
- Listagem com badges coloridas por grade
- Criar/Editar/Excluir (ADMIN)
- Visualização para MEMBER

### Drops
- Listagem com valor total e split por player
- Criar drop com formulário dinâmico de itens e participantes
- Visualizar detalhes (itens, participantes, notas)
- Formatação de adena: 500k, 10kk, etc.
- Excluir (ADMIN)

## Comandos

```bash
npm run dev      # Desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview do build
```
