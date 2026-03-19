const prisma = require('../config/prisma');

const getTeachers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = search
      ? { OR: [{ firstName: { contains: search } }, { lastName: { contains: search } }, { teacherCode: { contains: search } }] }
      : {};

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where, skip, take: parseInt(limit),
        include: {
          user: { select: { email: true } },
          _count: { select: { courses: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.teacher.count({ where })
    ]);

    res.json({ data: teachers, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTeacherById = async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { user: { select: { email: true } }, courses: true }
    });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createTeacher = async (req, res) => {
  try {
    const { email, password, firstName, lastName, department, phone } = req.body;
    const bcrypt = require('bcryptjs');
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const count = await prisma.teacher.count();
    const hashedPwd = await bcrypt.hash(password || 'teacher123', 12);

    const user = await prisma.user.create({
      data: {
        email, password: hashedPwd, role: 'TEACHER',
        teacher: { create: { teacherCode: `TCH${String(count + 1).padStart(4, '0')}`, firstName, lastName, department, phone } }
      },
      include: { teacher: true }
    });

    res.status(201).json({ message: 'Teacher created', teacher: user.teacher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTeacher = async (req, res) => {
  try {
    const teacher = await prisma.teacher.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json({ message: 'Teacher updated', teacher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteTeacher = async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    await prisma.user.delete({ where: { id: teacher.userId } });
    res.json({ message: 'Teacher deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher };
