const prisma = require('../config/prisma');

// GET /api/students
const getStudents = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search
      ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { studentCode: { contains: search } },
            { user: { email: { contains: search } } }
          ]
        }
      : {};

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          user: { select: { email: true, role: true } },
          _count: { select: { grades: true, enrollments: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.student.count({ where })
    ]);

    res.json({
      data: students,
      meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/students/:id
const getStudentById = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: { select: { email: true, role: true } },
        grades: { include: { course: { select: { name: true, courseCode: true } } } },
        enrollments: { include: { course: { select: { name: true, courseCode: true } } } },
        attendances: { include: { course: { select: { name: true } } }, orderBy: { date: 'desc' }, take: 20 }
      }
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/students
const createStudent = async (req, res) => {
  try {
    const { email, password, firstName, lastName, dateOfBirth, phone, address } = req.body;
    const bcrypt = require('bcryptjs');

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hashedPwd = await bcrypt.hash(password || 'student123', 12);
    const count = await prisma.student.count();

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPwd,
        role: 'STUDENT',
        student: {
          create: {
            studentCode: `STU${String(count + 1).padStart(4, '0')}`,
            firstName,
            lastName,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            phone,
            address
          }
        }
      },
      include: { student: true }
    });

    res.status(201).json({ message: 'Student created', student: user.student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/students/:id
const updateStudent = async (req, res) => {
  try {
    const { firstName, lastName, phone, address, dateOfBirth } = req.body;
    const student = await prisma.student.update({
      where: { id: parseInt(req.params.id) },
      data: { firstName, lastName, phone, address, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined }
    });
    res.json({ message: 'Student updated', student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/students/:id
const deleteStudent = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    await prisma.user.delete({ where: { id: student.userId } });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getStudents, getStudentById, createStudent, updateStudent, deleteStudent };
