# Drop CP

Sistema completo para controle de drops de uma CP (Clan Party) de Lineage 2.

## Estrutura

```
drop-cp/
├── backend/     # API NestJS + PostgreSQL
└── frontend/    # React + Vite + Tailwind
```

## Backend

Veja `backend/README.md` para instruções detalhadas.

Resumo:
```bash
cd backend
docker-compose up -d
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

## Frontend

Veja `frontend/README.md` para instruções detalhadas.

Resumo:
```bash
cd frontend
npm install
npm run dev
```

## Acesso

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/api/docs

## Credenciais Padrão

- Email: `admin@dropcp.com`
- Senha: `admin123`
