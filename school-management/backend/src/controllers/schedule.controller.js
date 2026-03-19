const prisma = require('../config/prisma');
const { cache } = require('../config/cache');

const CACHE_KEY = (sem, year) => `schedule_${sem}_${year}`;

// GET /api/schedules?semester=Fall&year=2025
const getSchedules = async (req, res) => {
  try {
    const { semester, year, courseId } = req.query;
    const where = {};
    if (semester) where.semester = semester;
    if (year)     where.year     = parseInt(year);
    if (courseId) where.courseId = parseInt(courseId);

    const cacheKey = CACHE_KEY(semester, year);
    const cached   = cache.get(cacheKey);
    if (cached && !courseId) return res.json({ data: cached, cached: true });

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        course:  { select: { id: true, courseCode: true, name: true, credits: true, teacherId: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    if (!courseId) cache.set(cacheKey, schedules, 120);
    res.json({ data: schedules, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/schedules
const createSchedule = async (req, res) => {
  try {
    const { courseId, teacherId, dayOfWeek, startTime, endTime, room, semester, year } = req.body;

    if (!courseId || dayOfWeek === undefined || !startTime || !endTime || !semester || !year) {
      return res.status(400).json({ error: 'courseId, dayOfWeek, startTime, endTime, semester, year are required' });
    }

    const schedule = await prisma.schedule.upsert({
      where: {
        courseId_dayOfWeek_startTime_semester_year: {
          courseId:  parseInt(courseId),
          dayOfWeek: parseInt(dayOfWeek),
          startTime,
          semester,
          year: parseInt(year),
        },
      },
      update: {
        endTime,
        room:      room || null,
        teacherId: teacherId ? parseInt(teacherId) : null,
      },
      create: {
        courseId:  parseInt(courseId),
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        room:      room || null,
        semester,
        year:      parseInt(year),
        teacherId: teacherId ? parseInt(teacherId) : null,
      },
      include: {
        course:  { select: { courseCode: true, name: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    });

    cache.del(CACHE_KEY(semester, parseInt(year)));
    res.status(201).json({ message: 'Хуваарь хадгалагдлаа', schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/schedules/:id
const updateSchedule = async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime, room, teacherId, courseId, semester, year } = req.body;
    const schedule = await prisma.schedule.update({
      where: { id: parseInt(req.params.id) },
      data: {
        dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : undefined,
        startTime,
        endTime,
        room:      room !== undefined ? room : undefined,
        teacherId: teacherId ? parseInt(teacherId) : null,
        courseId:  courseId ? parseInt(courseId) : undefined,
        semester,
        year:      year ? parseInt(year) : undefined,
      },
      include: {
        course:  { select: { courseCode: true, name: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    });

    cache.flushAll();
    res.json({ message: 'Хуваарь шинэчлэгдлээ', schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/schedules/:id
const deleteSchedule = async (req, res) => {
  try {
    await prisma.schedule.delete({ where: { id: parseInt(req.params.id) } });
    cache.flushAll();
    res.json({ message: 'Хуваарь устгагдлаа' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/schedules/course/:courseId — clear all slots for a course+semester
const clearCourseSchedule = async (req, res) => {
  try {
    const { semester, year } = req.query;
    const where = { courseId: parseInt(req.params.courseId) };
    if (semester) where.semester = semester;
    if (year)     where.year     = parseInt(year);
    await prisma.schedule.deleteMany({ where });
    cache.flushAll();
    res.json({ message: 'Хуваарь цэвэрлэгдлээ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getSchedules, createSchedule, updateSchedule, deleteSchedule, clearCourseSchedule };
