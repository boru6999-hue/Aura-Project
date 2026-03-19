const prisma = require('../config/prisma');

const include = {
  teacher:  { select: { id: true, firstName: true, lastName: true, teacherCode: true } },
  course:   { select: { id: true, name: true, courseCode: true, credits: true } },
  schedule: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true, room: true, semester: true, year: true } },
};

// Helper — get teacher row from logged-in user
const getTeacher = async (userId) =>
  prisma.teacher.findUnique({ where: { userId } });

// GET /api/schedule-requests
const getRequests = async (req, res) => {
  try {
    const { status, teacherId } = req.query;
    const where = {};
    if (status)    where.status    = status;
    if (teacherId) where.teacherId = parseInt(teacherId);

    if (req.user.role === 'TEACHER') {
      const teacher = await getTeacher(req.user.id);
      if (!teacher) return res.status(403).json({ error: 'Багшийн мэдээлэл олдсонгүй' });
      where.teacherId = teacher.id;
    }

    const requests = await prisma.scheduleRequest.findMany({
      where, include, orderBy: { createdAt: 'desc' },
    });
    res.json({ data: requests });
  } catch (err) {
    if (err.message?.includes('does not exist')) {
      return res.status(503).json({ error: 'ScheduleRequest хүснэгт байхгүй. npx prisma db push ажиллуулна уу.' });
    }
    res.status(500).json({ error: err.message });
  }
};

// POST /api/schedule-requests
const createRequest = async (req, res) => {
  try {
    const {
      scheduleId, courseId, dayOfWeek, startTime, endTime,
      room, semester, year, note,
      oldDayOfWeek, oldStartTime, oldEndTime, oldRoom,
    } = req.body;

    if (!courseId || dayOfWeek === undefined || !startTime || !endTime || !semester || !year) {
      return res.status(400).json({ error: 'courseId, dayOfWeek, startTime, endTime, semester, year шаардлагатай' });
    }

    const teacher = await getTeacher(req.user.id);
    if (!teacher) return res.status(403).json({ error: 'Зөвхөн багш хүсэлт илгээх боломжтой' });

    // Duplicate pending check
    const existing = await prisma.scheduleRequest.findFirst({
      where: {
        teacherId: teacher.id,
        courseId:  parseInt(courseId),
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        semester,
        year:   parseInt(year),
        status: 'PENDING',
      },
    });
    if (existing) return res.status(400).json({ error: 'Ижил хүсэлт аль хэдийн байна' });

    const request = await prisma.scheduleRequest.create({
      data: {
        scheduleId:   scheduleId   ? parseInt(scheduleId)   : null,
        teacherId:    teacher.id,
        courseId:     parseInt(courseId),
        dayOfWeek:    parseInt(dayOfWeek),
        startTime,
        endTime,
        room:         room         || null,
        semester,
        year:         parseInt(year),
        note:         note         || null,
        oldDayOfWeek: oldDayOfWeek != null ? parseInt(oldDayOfWeek) : null,
        oldStartTime: oldStartTime || null,
        oldEndTime:   oldEndTime   || null,
        oldRoom:      oldRoom      || null,
      },
      include,
    });

    res.status(201).json({ message: 'Хүсэлт илгээгдлээ', request });
  } catch (err) {
    if (err.message?.includes('does not exist')) {
      return res.status(503).json({ error: 'ScheduleRequest хүснэгт байхгүй. npx prisma db push ажиллуулна уу.' });
    }
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/schedule-requests/:id/approve
const approveRequest = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const id = parseInt(req.params.id);

    const reqRecord = await prisma.scheduleRequest.findUnique({ where: { id }, include });
    if (!reqRecord) return res.status(404).json({ error: 'Хүсэлт олдсонгүй' });
    if (reqRecord.status !== 'PENDING') return res.status(400).json({ error: 'Хүсэлт аль хэдийн шийдвэрлэгдсэн' });

    const scheduleData = {
      courseId:  reqRecord.courseId,
      dayOfWeek: reqRecord.dayOfWeek,
      startTime: reqRecord.startTime,
      endTime:   reqRecord.endTime,
      room:      reqRecord.room,
      semester:  reqRecord.semester,
      year:      reqRecord.year,
      teacherId: reqRecord.teacherId,
    };

    if (reqRecord.scheduleId) {
      await prisma.schedule.update({ where: { id: reqRecord.scheduleId }, data: scheduleData });
    } else {
      await prisma.schedule.upsert({
        where: {
          courseId_dayOfWeek_startTime_semester_year: {
            courseId:  scheduleData.courseId,
            dayOfWeek: scheduleData.dayOfWeek,
            startTime: scheduleData.startTime,
            semester:  scheduleData.semester,
            year:      scheduleData.year,
          },
        },
        update: scheduleData,
        create: scheduleData,
      });
    }

    const updated = await prisma.scheduleRequest.update({
      where: { id },
      data:  { status: 'APPROVED', adminNote: adminNote || null, reviewedAt: new Date() },
      include,
    });

    res.json({ message: 'Хүсэлт батлагдлаа, хуваарь шинэчлэгдлээ', request: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/schedule-requests/:id/reject
const rejectRequest = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const id = parseInt(req.params.id);

    const reqRecord = await prisma.scheduleRequest.findUnique({ where: { id } });
    if (!reqRecord) return res.status(404).json({ error: 'Хүсэлт олдсонгүй' });
    if (reqRecord.status !== 'PENDING') return res.status(400).json({ error: 'Хүсэлт аль хэдийн шийдвэрлэгдсэн' });

    const updated = await prisma.scheduleRequest.update({
      where: { id },
      data:  { status: 'REJECTED', adminNote: adminNote || null, reviewedAt: new Date() },
      include,
    });

    res.json({ message: 'Хүсэлт татгалзагдлаа', request: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/schedule-requests/:id
const cancelRequest = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const teacher = req.user.role === 'TEACHER' ? await getTeacher(req.user.id) : null;

    const reqRecord = await prisma.scheduleRequest.findUnique({ where: { id } });
    if (!reqRecord) return res.status(404).json({ error: 'Хүсэлт олдсонгүй' });
    if (req.user.role !== 'ADMIN' && reqRecord.teacherId !== teacher?.id) {
      return res.status(403).json({ error: 'Зөвшөөрөл байхгүй' });
    }
    if (reqRecord.status !== 'PENDING') {
      return res.status(400).json({ error: 'Шийдвэрлэгдсэн хүсэлтийг цуцлах боломжгүй' });
    }

    await prisma.scheduleRequest.delete({ where: { id } });
    res.json({ message: 'Хүсэлт цуцлагдлаа' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/schedule-requests/pending-count
const getPendingCount = async (req, res) => {
  try {
    const count = await prisma.scheduleRequest.count({ where: { status: 'PENDING' } });
    res.json({ count });
  } catch (err) {
    // Silently return 0 if table not ready yet
    res.json({ count: 0 });
  }
};

module.exports = { getRequests, createRequest, approveRequest, rejectRequest, cancelRequest, getPendingCount };
