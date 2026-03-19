const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, department } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || 'STUDENT',
      }
    });

    // Create profile based on role
    if (user.role === 'STUDENT') {
      const count = await prisma.student.count();
      await prisma.student.create({
        data: {
          studentCode: `STU${String(count + 1).padStart(4, '0')}`,
          firstName: firstName || '',
          lastName: lastName || '',
          userId: user.id
        }
      });
    } else if (user.role === 'TEACHER') {
      const count = await prisma.teacher.count();
      await prisma.teacher.create({
        data: {
          teacherCode: `TCH${String(count + 1).padStart(4, '0')}`,
          firstName: firstName || '',
          lastName: lastName || '',
          department: department || '',
          userId: user.id
        }
      });
    }

    const token = generateToken(user.id, user.role);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, teacherCode: true } }
      }
    });

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user.id, user.role);

    const profile = user.student || user.teacher || null;

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        student: true,
        teacher: true
      }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, getMe };
