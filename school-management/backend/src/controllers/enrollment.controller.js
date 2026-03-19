const prisma = require('../config/prisma');
const { cache } = require('../config/cache');

// GET /api/enrollments - list all enrollments (filterable)
const getEnrollments = async (req, res) => {
  try {
    const { courseId, studentId, semester, year } = req.query;
    const where = {};
    if (courseId) where.courseId = parseInt(courseId);
    if (studentId) where.studentId = parseInt(studentId);
    if (semester) where.semester = semester;
    if (year) where.year = parseInt(year);

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        student: { select: { id: true, studentCode: true, firstName: true, lastName: true } },
        course: { select: { id: true, courseCode: true, name: true, credits: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: enrollments, total: enrollments.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/enrollments/course/:courseId - get all students enrolled in a course
const getStudentsByCourse = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: { select: { id: true, studentCode: true, firstName: true, lastName: true, phone: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ data: enrollments.map(e => e.student), total: enrollments.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/enrollments/student/:studentId - get all courses a student is in
const getCoursesByStudent = async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: { select: { id: true, courseCode: true, name: true, credits: true, teacher: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: enrollments, total: enrollments.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/enrollments - enroll a student into a course
const enrollStudent = async (req, res) => {
  try {
    const { studentId, courseId, semester, year } = req.body;
    if (!studentId || !courseId || !semester || !year) {
      return res.status(400).json({ error: 'studentId, courseId, semester, year are required' });
    }

    // Check student and course exist
    const [student, course] = await Promise.all([
      prisma.student.findUnique({ where: { id: parseInt(studentId) } }),
      prisma.course.findUnique({ where: { id: parseInt(courseId) } }),
    ]);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Upsert - prevent duplicates
    const enrollment = await prisma.enrollment.upsert({
      where: {
        studentId_courseId_semester_year: {
          studentId: parseInt(studentId),
          courseId: parseInt(courseId),
          semester,
          year: parseInt(year),
        },
      },
      update: {},
      create: {
        studentId: parseInt(studentId),
        courseId: parseInt(courseId),
        semester,
        year: parseInt(year),
      },
      include: {
        student: { select: { studentCode: true, firstName: true, lastName: true } },
        course: { select: { courseCode: true, name: true } },
      },
    });

    cache.flushAll();
    res.status(201).json({ message: 'Student enrolled successfully', enrollment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/enrollments/bulk - enroll multiple students into a course at once
const bulkEnroll = async (req, res) => {
  try {
    const { studentIds, courseId, semester, year } = req.body;
    if (!Array.isArray(studentIds) || !courseId || !semester || !year) {
      return res.status(400).json({ error: 'studentIds (array), courseId, semester, year are required' });
    }

    const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const results = await Promise.allSettled(
      studentIds.map(sid =>
        prisma.enrollment.upsert({
          where: {
            studentId_courseId_semester_year: {
              studentId: parseInt(sid),
              courseId: parseInt(courseId),
              semester,
              year: parseInt(year),
            },
          },
          update: {},
          create: {
            studentId: parseInt(sid),
            courseId: parseInt(courseId),
            semester,
            year: parseInt(year),
          },
        })
      )
    );

    const enrolled = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    cache.flushAll();
    res.status(201).json({
      message: `Enrolled ${enrolled} student(s) successfully${failed > 0 ? `, ${failed} failed` : ''}`,
      enrolled,
      failed,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/enrollments/:id - unenroll a student
const unenrollStudent = async (req, res) => {
  try {
    await prisma.enrollment.delete({ where: { id: parseInt(req.params.id) } });
    cache.flushAll();
    res.json({ message: 'Student unenrolled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/enrollments/student/:studentId/course/:courseId - unenroll by student+course
const unenrollByStudentCourse = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const { semester, year } = req.query;

    const where = {
      studentId: parseInt(studentId),
      courseId: parseInt(courseId),
    };
    if (semester) where.semester = semester;
    if (year) where.year = parseInt(year);

    await prisma.enrollment.deleteMany({ where });
    cache.flushAll();
    res.json({ message: 'Unenrolled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getEnrollments,
  getStudentsByCourse,
  getCoursesByStudent,
  enrollStudent,
  bulkEnroll,
  unenrollStudent,
  unenrollByStudentCourse,
};
