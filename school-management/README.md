BACKEND-IIG INGEJ GUILGENEE
cd backend
npm install
cp .env.example .env
# Edit .env and set your DATABASE_URL
npx prisma db push
npx prisma generate
node src/prisma/seed.js
npm run dev


FRONTEND OILGOMJTOISHTE
 npm install
 npm run dev