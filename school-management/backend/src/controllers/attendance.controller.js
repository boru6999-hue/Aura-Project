const prisma = require('../config/prisma');

const getAttendance = async (req, res) => {
  try {
    const { studentId, courseId, date } = req.query;
    const where = {};
    if (studentId) where.studentId = parseInt(studentId);
    if (courseId) where.courseId = parseInt(courseId);
    if (date) where.date = { gte: new Date(date), lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)) };

    const records = await prisma.attendance.findMany({
      where,
      include: {
        student: { select: { firstName: true, lastName: true, studentCode: true } },
        course: { select: { name: true, courseCode: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json({ data: records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createAttendance = async (req, res) => {
  try {
    const { studentId, courseId, status, date } = req.body;
    const record = await prisma.attendance.create({
      data: {
        studentId: parseInt(studentId),
        courseId: parseInt(courseId),
        status: status || 'PRESENT',
        date: date ? new Date(date) : new Date()
      }
    });
    res.status(201).json({ message: 'Attendance recorded', record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAttendance, createAttendance };
