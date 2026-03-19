-- ============================================================
--  School Management System — Full seed data (MySQL)
--  Run AFTER prisma migrate: mysql -u root -p school_management < seed_data.sql
--  OR use: npm run prisma:seed  (recommended)
-- ============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ── Users (passwords are bcrypt hash of 'admin123'/'teacher123'/'student123') ──
-- NOTE: These hashes are pre-generated. Use `npm run prisma:seed` for live hashing.

-- ──────────────────────────────────────────────
-- STUDENT EMAIL LIST (for reference)
-- ──────────────────────────────────────────────
-- STU0001 | azjargal.batsaikhan@school.mn      | Азжаргал Батсайхан
-- STU0002 | bulgan-erdem.azzaia@school.mn       | Булган-Эрдэм Аззаяа
-- STU0003 | mianganbaiar.khuselsuren@school.mn  | Мянганбаяр Хүсэлсүрэн
-- STU0004 | gan-erdene.tuvshintour@school.mn    | Ган-Эрдэнэ Түвшинтөр
-- STU0005 | amartaivan.gegeenee@school.mn       | Амартайван Гэгээнээ
-- STU0006 | bilguun.davaajargal@school.mn       | Билгүүн Даваажаргал
-- STU0007 | misheel.amgalanbaiar@school.mn      | Мишээл Амгаланбаяр
-- STU0008 | purevjav.nanzad@school.mn           | Пүрэвжав Нанзад
-- STU0009 | ankhbaiar.batbaisgalan@school.mn    | Анхбаяр Батбаясгалан
-- STU0010 | buianбат.munkhtugulder@school.mn    | Буянбат Мөнхтөгөлдөр
-- STU0011 | dulgoon.enkh@school.mn              | Дөлгөөн Энхбаяр
-- STU0012 | narantuia.gantulga@school.mn        | Нарантуяа Гантулга
-- STU0013 | tenger.boldbaatar@school.mn         | Тэнгэр Болдбаатар
-- STU0014 | enkhtaivan.munkhbaiar@school.mn     | Энхтайван Мөнхбаяр
-- STU0015 | sukhbaatar.dorj@school.mn           | Сүхбаатар Дорж
-- STU0016 | oiuuntsetseg.batmunkh@school.mn     | Оюунцэцэг Батмөнх
-- STU0017 | gerel.tserendorj@school.mn          | Гэрэл Цэрэндорж
-- STU0018 | baatarsuren.ganbaatar@school.mn     | Баатарсүрэн Ганбаатар
-- STU0019 | narantsetseg.sukhbaatar@school.mn   | Наранцэцэг Сүхбаатар
-- STU0020 | munkhzul.purevdorj@school.mn        | Мөнхзул Пүрэвдорж

-- ── COURSES ──────────────────────────────────────────────────
-- CRS0001 | Програмчлалын үндэс        | 3 кредит | Бат Эрдэнэ
-- CRS0002 | Мэдээллийн сангийн систем  | 3 кредит | Бат Эрдэнэ
-- CRS0003 | Математик анализ I          | 4 кредит | Оюун Мөнх
-- CRS0004 | Шугаман алгебр             | 3 кредит | Оюун Мөнх
-- CRS0005 | Веб хөгжүүлэлт             | 3 кредит | Бат Эрдэнэ
-- CRS0006 | Компьютерийн сүлжээ        | 3 кредит | Гантулга Наран
-- CRS0007 | Системийн дүн шинжилгээ    | 3 кредит | Гантулга Наран

-- ── SEMESTERS ────────────────────────────────────────────────
-- Fall 2024   → CRS0001, CRS0003, CRS0004
-- Spring 2025 → CRS0002, CRS0005, CRS0003
-- Fall 2025   → CRS0005, CRS0006, CRS0007

-- ── SCORE PROFILES ───────────────────────────────────────────
-- great   (88–100) : Мянганбаяр, Билгүүн, Дөлгөөн, Оюунцэцэг, Мөнхзул
-- good    (75–90)  : Азжаргал, Ган-Эрдэнэ, Мишээл, Буянбат, Гэрэл, Тэнгэр, Наранцэцэг
-- average (62–78)  : Булган-Эрдэм, Амартайван, Анхбаяр, Нарантуяа, Сүхбаатар, Баатарсүрэн
-- weak    (45–65)  : Пүрэвжав, Энхтайван

-- ── HOW TO RUN ───────────────────────────────────────────────
-- 1. cd backend
-- 2. npm install
-- 3. cp .env.example .env  → set DATABASE_URL
-- 4. npx prisma migrate dev --name init
-- 5. npm run prisma:seed
-- ────────────────────────────────────────────────────────────
