const prisma = require('../config/prisma');

const getLetterGrade = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

// GET /api/grades
const getGrades = async (req, res) => {
  try {
    const { studentId, courseId, semester, year } = req.query;
    const where = {};
    if (studentId) where.studentId = parseInt(studentId);
    if (courseId) where.courseId = parseInt(courseId);
    if (semester) where.semester = semester;
    if (year) where.year = parseInt(year);

    const grades = await prisma.grade.findMany({
      where,
      include: {
        student: { select: { firstName: true, lastName: true, studentCode: true } },
        course: { select: { name: true, courseCode: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: grades, total: grades.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/grades
const createGrade = async (req, res) => {
  try {
    const { studentId, courseId, score, semester, year } = req.body;

    const grade = await prisma.grade.upsert({
      where: {
        studentId_courseId_semester_year: {
          studentId: parseInt(studentId),
          courseId: parseInt(courseId),
          semester,
          year: parseInt(year)
        }
      },
      update: { score: parseFloat(score), grade: getLetterGrade(parseFloat(score)) },
      create: {
        studentId: parseInt(studentId),
        courseId: parseInt(courseId),
        score: parseFloat(score),
        grade: getLetterGrade(parseFloat(score)),
        semester,
        year: parseInt(year)
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
        course: { select: { name: true } }
      }
    });

    res.status(201).json({ message: 'Grade saved', grade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/grades/:id
const deleteGrade = async (req, res) => {
  try {
    await prisma.grade.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Grade deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getGrades, createGrade, deleteGrade };
