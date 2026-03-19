require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ── helpers ──────────────────────────────────────────────────
const toEmail = (name) => name.toLowerCase()
  .replace(/ү/g,'u').replace(/ө/g,'o').replace(/ё/g,'yo')
  .replace(/э/g,'e').replace(/ш/g,'sh').replace(/щ/g,'shch')
  .replace(/ч/g,'ch').replace(/ж/g,'j').replace(/з/g,'z')
  .replace(/х/g,'kh').replace(/ц/g,'ts').replace(/н/g,'n')
  .replace(/г/g,'g').replace(/б/g,'b').replace(/а/g,'a')
  .replace(/о/g,'o').replace(/и/g,'i').replace(/й/g,'i')
  .replace(/р/g,'r').replace(/л/g,'l').replace(/м/g,'m')
  .replace(/т/g,'t').replace(/д/g,'d').replace(/с/g,'s')
  .replace(/п/g,'p').replace(/к/g,'k').replace(/в/g,'v')
  .replace(/ф/g,'f').replace(/я/g,'ya').replace(/ю/g,'yu')
  .replace(/ъ/g,'').replace(/ь/g,'')
  .replace(/[^a-z0-9]/g,'');

const randScore = (min, max) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(1));

const getGrade = (s) => s >= 90 ? 'A' : s >= 80 ? 'B' : s >= 70 ? 'C' : s >= 60 ? 'D' : 'F';

// ── 20 students — each word is ONE student ────────────────────
// name = full display name, lastName = '' (single name students)
const STUDENTS = [
  { name: 'Азжаргал',     profile: 'good'    },
  { name: 'Батсайхан',    profile: 'great'   },
  { name: 'Булган-Эрдэм', profile: 'average' },
  { name: 'Аззаяа',       profile: 'good'    },
  { name: 'Мянганбаяр',   profile: 'great'   },
  { name: 'Хүсэлсүрэн',  profile: 'average' },
  { name: 'Ган-Эрдэнэ',  profile: 'good'    },
  { name: 'Түвшинтөр',   profile: 'great'   },
  { name: 'Амартайван',   profile: 'average' },
  { name: 'Гэгээнээ',    profile: 'good'    },
  { name: 'Билгүүн',      profile: 'great'   },
  { name: 'Даваажаргал',  profile: 'average' },
  { name: 'Мишээл',       profile: 'good'    },
  { name: 'Амгаланбаяр',  profile: 'great'   },
  { name: 'Пүрэвжав',    profile: 'weak'    },
  { name: 'Нанзад',       profile: 'average' },
  { name: 'Анхбаяр',      profile: 'good'    },
  { name: 'Батбаясгалан', profile: 'average' },
  { name: 'Буянбат',      profile: 'great'   },
  { name: 'Мөнхтөгөлдөр',profile: 'good'    },
  { name: 'Дөлгөөн',      profile: 'great'   },
];

const scoreRange = {
  great:   { min: 88, max: 100 },
  good:    { min: 75, max: 90  },
  average: { min: 62, max: 78  },
  weak:    { min: 45, max: 65  },
};

const TEACHERS_DATA = [
  { email: 'bat.erdene@school.mn',      firstName: 'Бат',      lastName: 'Эрдэнэ',  department: 'Компьютерийн ухаан',   code: 'TCH0001' },
  { email: 'oyun.munkh@school.mn',      firstName: 'Оюун',     lastName: 'Мөнх',    department: 'Математик',            code: 'TCH0002' },
  { email: 'gantulga.naran@school.mn',  firstName: 'Гантулга', lastName: 'Наран',   department: 'Мэдээллийн технологи', code: 'TCH0003' },
];

const COURSES_DATA = [
  { courseCode: 'CRS0001', name: 'Програмчлалын үндэс',        credits: 3, teacherIdx: 0, desc: 'C, Python хэлний суурь, алгоритм, өгөгдлийн бүтэц' },
  { courseCode: 'CRS0002', name: 'Мэдээллийн сангийн систем',  credits: 3, teacherIdx: 0, desc: 'SQL, ER diagram, MySQL, нормалчлал' },
  { courseCode: 'CRS0003', name: 'Математик анализ I',          credits: 4, teacherIdx: 1, desc: 'Лимит, уламжлал, интеграл, дифференциал тэгшитгэл' },
  { courseCode: 'CRS0004', name: 'Шугаман алгебр',             credits: 3, teacherIdx: 1, desc: 'Матриц, вектор зай, шугаман хувиргалт' },
  { courseCode: 'CRS0005', name: 'Веб хөгжүүлэлт',            credits: 3, teacherIdx: 0, desc: 'HTML, CSS, JavaScript, React, REST API' },
  { courseCode: 'CRS0006', name: 'Компьютерийн сүлжээ',        credits: 3, teacherIdx: 2, desc: 'TCP/IP, OSI загвар, маршрутлал, сүлжээний аюулгүй байдал' },
  { courseCode: 'CRS0007', name: 'Системийн дүн шинжилгээ',    credits: 3, teacherIdx: 2, desc: 'UML, бизнес шаардлага, дизайн хэв маяг' },
];

const SEMESTERS = [
  { semester: 'Fall',   year: 2024 },
  { semester: 'Spring', year: 2025 },
  { semester: 'Fall',   year: 2025 },
];

const SEMESTER_COURSES = {
  'Fall 2024':   ['CRS0001', 'CRS0003', 'CRS0004'],
  'Spring 2025': ['CRS0002', 'CRS0005', 'CRS0003'],
  'Fall 2025':   ['CRS0005', 'CRS0006', 'CRS0007'],
};

// ─────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 Seed эхэлж байна...\n');

  const studentPwd = await bcrypt.hash('student123', 12);
  const teacherPwd = await bcrypt.hash('teacher123', 12);
  const adminPwd   = await bcrypt.hash('admin123',   12);

  // ── 1. Admin ──────────────────────────────────────────────
  await prisma.user.upsert({
    where:  { email: 'admin@school.mn' },
    update: {},
    create: { email: 'admin@school.mn', password: adminPwd, role: 'ADMIN' },
  });
  console.log('✔ Admin үүсгэлээ');

  // ── 2. Teachers ───────────────────────────────────────────
  const createdTeachers = [];
  for (const t of TEACHERS_DATA) {
    const user = await prisma.user.upsert({
      where:  { email: t.email },
      update: { password: teacherPwd },
      create: { email: t.email, password: teacherPwd, role: 'TEACHER' },
    });
    const teacher = await prisma.teacher.upsert({
      where:  { teacherCode: t.code },
      update: { firstName: t.firstName, lastName: t.lastName, department: t.department, userId: user.id },
      create: { teacherCode: t.code, firstName: t.firstName, lastName: t.lastName, department: t.department, userId: user.id },
    });
    createdTeachers.push(teacher);
    console.log(`✔ Багш: ${t.firstName} ${t.lastName}  →  ${t.email}`);
  }

  // ── 3. Courses ────────────────────────────────────────────
  const createdCourses = {};
  for (const c of COURSES_DATA) {
    const teacher = createdTeachers[c.teacherIdx];
    const course = await prisma.course.upsert({
      where:  { courseCode: c.courseCode },
      update: { name: c.name, description: c.desc, credits: c.credits, teacherId: teacher.id },
      create: { courseCode: c.courseCode, name: c.name, description: c.desc, credits: c.credits, teacherId: teacher.id },
    });
    createdCourses[c.courseCode] = course;
    console.log(`✔ Хичээл: ${c.name}  (${c.courseCode})`);
  }

  // ── 4. Students ───────────────────────────────────────────
  console.log('\n👨‍🎓 Сурагчид үүсгэж байна...\n');
  const createdStudents = [];

  for (let i = 0; i < STUDENTS.length; i++) {
    const s    = STUDENTS[i];
    const code = `STU${String(i + 1).padStart(4, '0')}`;

    // email from the single name, e.g. "Азжаргал" → "azjargal@school.mn"
    const emailSlug = toEmail(s.name);
    const email     = `${emailSlug}@school.mn`;

    // firstName = full name, lastName = '' (single-name student)
    const user = await prisma.user.upsert({
      where:  { email },
      update: { password: studentPwd },
      create: { email, password: studentPwd, role: 'STUDENT' },
    });

    const student = await prisma.student.upsert({
      where:  { studentCode: code },
      update: { firstName: s.name, lastName: '', userId: user.id },
      create: { studentCode: code, firstName: s.name, lastName: '', userId: user.id },
    });

    createdStudents.push({ ...student, profile: s.profile, email, displayName: s.name });
    console.log(`  ${code}  ${s.name.padEnd(18)}  ${email}`);
  }

  // ── 5. Enrollments + Grades ───────────────────────────────
  console.log('\n📋 Бүртгэл болон дүн нэмж байна...');
  let enrollCount = 0;
  let gradeCount  = 0;

  for (const student of createdStudents) {
    const range = scoreRange[student.profile];

    for (const sem of SEMESTERS) {
      const key         = `${sem.semester} ${sem.year}`;
      const courseCodes = SEMESTER_COURSES[key] || [];

      for (const courseCode of courseCodes) {
        const course = createdCourses[courseCode];
        if (!course) continue;

        await prisma.enrollment.upsert({
          where:  { studentId_courseId_semester_year: { studentId: student.id, courseId: course.id, semester: sem.semester, year: sem.year } },
          update: {},
          create: { studentId: student.id, courseId: course.id, semester: sem.semester, year: sem.year },
        });
        enrollCount++;

        const raw   = randScore(range.min, range.max) + randScore(-3, 3);
        const score = parseFloat(Math.min(100, Math.max(0, raw)).toFixed(1));

        await prisma.grade.upsert({
          where:  { studentId_courseId_semester_year: { studentId: student.id, courseId: course.id, semester: sem.semester, year: sem.year } },
          update: { score, grade: getGrade(score) },
          create: { studentId: student.id, courseId: course.id, score, grade: getGrade(score), semester: sem.semester, year: sem.year },
        });
        gradeCount++;
      }
    }
  }


  // ── 6. Schedules ──────────────────────────────────────────────────────
  // dayOfWeek: 0=Mon 1=Tue 2=Wed 3=Thu 4=Fri 5=Sat 6=Sun
  console.log('\u2705 Schedules...');
  const SCHEDULE_SLOTS = {
    'Fall 2024': [
      // CRS0001 Програмчлалын үндэс — Mon/Wed/Fri + Sat lab
      { courseCode: 'CRS0001', dayOfWeek: 0, startTime: '08:00', endTime: '09:40', room: 'А-101' },
      { courseCode: 'CRS0001', dayOfWeek: 2, startTime: '08:00', endTime: '09:40', room: 'А-101' },
      { courseCode: 'CRS0001', dayOfWeek: 4, startTime: '08:00', endTime: '09:40', room: 'А-101' },
      { courseCode: 'CRS0001', dayOfWeek: 5, startTime: '09:40', endTime: '11:20', room: 'Лаб-1' },
      // CRS0003 Математик анализ I — Tue/Thu + Sun review
      { courseCode: 'CRS0003', dayOfWeek: 1, startTime: '09:40', endTime: '11:20', room: 'А-203' },
      { courseCode: 'CRS0003', dayOfWeek: 3, startTime: '09:40', endTime: '11:20', room: 'А-203' },
      { courseCode: 'CRS0003', dayOfWeek: 6, startTime: '08:00', endTime: '09:40', room: 'А-203' },
      // CRS0004 Шугаман алгебр — Mon/Wed + Sat
      { courseCode: 'CRS0004', dayOfWeek: 0, startTime: '13:00', endTime: '14:40', room: 'А-301' },
      { courseCode: 'CRS0004', dayOfWeek: 2, startTime: '13:00', endTime: '14:40', room: 'А-301' },
      { courseCode: 'CRS0004', dayOfWeek: 5, startTime: '11:20', endTime: '13:00', room: 'А-301' },
    ],
    'Spring 2025': [
      // CRS0002 Мэдээллийн санг — Tue/Thu/Sat lab
      { courseCode: 'CRS0002', dayOfWeek: 1, startTime: '08:00', endTime: '09:40', room: 'Лаб-1' },
      { courseCode: 'CRS0002', dayOfWeek: 3, startTime: '08:00', endTime: '09:40', room: 'Лаб-1' },
      { courseCode: 'CRS0002', dayOfWeek: 5, startTime: '08:00', endTime: '09:40', room: 'Лаб-1' },
      // CRS0005 Вэб хөгжүүлэлт — Mon/Wed/Fri + Sun
      { courseCode: 'CRS0005', dayOfWeek: 0, startTime: '11:20', endTime: '13:00', room: 'Лаб-2' },
      { courseCode: 'CRS0005', dayOfWeek: 2, startTime: '11:20', endTime: '13:00', room: 'Лаб-2' },
      { courseCode: 'CRS0005', dayOfWeek: 4, startTime: '11:20', endTime: '13:00', room: 'Лаб-2' },
      { courseCode: 'CRS0005', dayOfWeek: 6, startTime: '09:40', endTime: '11:20', room: 'Лаб-2' },
      // CRS0003 Математик — Tue/Thu
      { courseCode: 'CRS0003', dayOfWeek: 1, startTime: '14:40', endTime: '16:20', room: 'А-203' },
      { courseCode: 'CRS0003', dayOfWeek: 3, startTime: '14:40', endTime: '16:20', room: 'А-203' },
    ],
    'Fall 2025': [
      // CRS0005 Вэб — Mon/Wed/Fri
      { courseCode: 'CRS0005', dayOfWeek: 0, startTime: '08:00', endTime: '09:40', room: 'Лаб-2' },
      { courseCode: 'CRS0005', dayOfWeek: 2, startTime: '08:00', endTime: '09:40', room: 'Лаб-2' },
      { courseCode: 'CRS0005', dayOfWeek: 4, startTime: '08:00', endTime: '09:40', room: 'Лаб-2' },
      // CRS0006 Компьютерийн сүлжээ — Tue/Thu + Sat lab
      { courseCode: 'CRS0006', dayOfWeek: 1, startTime: '09:40', endTime: '11:20', room: 'Б-101' },
      { courseCode: 'CRS0006', dayOfWeek: 3, startTime: '09:40', endTime: '11:20', room: 'Б-101' },
      { courseCode: 'CRS0006', dayOfWeek: 5, startTime: '13:00', endTime: '14:40', room: 'Лаб-3' },
      // CRS0007 Системийн дүн шинжилгээ — Mon/Wed + Sun
      { courseCode: 'CRS0007', dayOfWeek: 0, startTime: '13:00', endTime: '14:40', room: 'В-301' },
      { courseCode: 'CRS0007', dayOfWeek: 2, startTime: '13:00', endTime: '14:40', room: 'В-301' },
      { courseCode: 'CRS0007', dayOfWeek: 4, startTime: '14:40', endTime: '16:20', room: 'В-301' },
      { courseCode: 'CRS0007', dayOfWeek: 6, startTime: '11:20', endTime: '13:00', room: 'В-302' },
    ],
  };

  let scheduleCount = 0;
  for (const [semKey, slots] of Object.entries(SCHEDULE_SLOTS)) {
    const [semName, semYear] = semKey.split(' ');
    for (const slot of slots) {
      const course = createdCourses[slot.courseCode];
      if (!course) continue;
      try {
        await prisma.schedule.upsert({
          where: {
            courseId_dayOfWeek_startTime_semester_year: {
              courseId:  course.id,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              semester:  semName,
              year:      parseInt(semYear),
            },
          },
          update: { endTime: slot.endTime, room: slot.room, teacherId: course.teacherId ?? null },
          create: {
            courseId:  course.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime:   slot.endTime,
            room:      slot.room,
            semester:  semName,
            year:      parseInt(semYear),
            teacherId: course.teacherId ?? null,
          },
        });
        scheduleCount++;
      } catch { /* skip duplicate */ }
    }
  }
  console.log(`\u2714 ${scheduleCount} schedule slots added`);

  // ── 6. Attendance ─────────────────────────────────────────
  console.log('✅ Ирц нэмж байна...');
  const statuses    = ['PRESENT','PRESENT','PRESENT','PRESENT','PRESENT','LATE','LATE','ABSENT','PRESENT','PRESENT'];
  const recentCodes = SEMESTER_COURSES['Fall 2025'];
  let attendCount   = 0;

  for (const student of createdStudents) {
    for (const courseCode of recentCodes) {
      const course = createdCourses[courseCode];
      if (!course) continue;
      for (let day = 9; day >= 0; day--) {
        const date   = new Date();
        date.setDate(date.getDate() - day * 2);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        try {
          await prisma.attendance.create({
            data: { studentId: student.id, courseId: course.id, status, date },
          });
          attendCount++;
        } catch { /* skip duplicate */ }
      }
    }
  }

  // ── Summary ───────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('✅  Seed амжилттай дууслаа!\n');
  console.log(`  Сурагч    : ${createdStudents.length}`);
  console.log(`  Багш      : ${createdTeachers.length}`);
  console.log(`  Хичээл    : ${Object.keys(createdCourses).length}`);
  console.log(`  Бүртгэл   : ${enrollCount}`);
  console.log(`  Дүн       : ${gradeCount}`);
  console.log(`  Хуваарь   : ${scheduleCount}`);
  console.log(`  Ирц       : ${attendCount}`);
  console.log('═'.repeat(60));
  console.log('\n🔑 Нэвтрэх мэдээлэл:\n');
  console.log('  Admin   : admin@school.mn          / admin123');
  console.log('  Багш 1  : bat.erdene@school.mn     / teacher123');
  console.log('  Багш 2  : oyun.munkh@school.mn     / teacher123');
  console.log('  Багш 3  : gantulga.naran@school.mn / teacher123');
  console.log('\n  Сурагчид (нууц үг: student123):\n');
  createdStudents.forEach(s =>
    console.log(`  ${s.studentCode}  ${s.displayName.padEnd(18)}  ${s.email}`)
  );
  console.log('');
}

main()
  .catch(e => { console.error('\n❌ Seed алдаа:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
