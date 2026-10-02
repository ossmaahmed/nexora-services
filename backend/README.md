# NEXORA Backend

```bash
cp .env.example .env        # edit DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run seed                # admin@nexora.io / Admin@123
npm run dev                 # http://localhost:5001
```

Test: `curl localhost:5001/api/health`
