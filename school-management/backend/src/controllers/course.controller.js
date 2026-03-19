const prisma = require('../config/prisma');
const { cache, CACHE_KEYS } = require('../config/cache');

// GET /api/courses - with cache
const getCourses = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const cacheKey = search ? `courses_search_${search}_${page}` : `${CACHE_KEYS.COURSE_LIST}_${page}_${limit}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { courseCode: { contains: search } },
            { description: { contains: search } }
          ]
        }
      : {};

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          teacher: { select: { firstName: true, lastName: true, teacherCode: true } },
          _count: { select: { enrollments: true, grades: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.course.count({ where })
    ]);

    const result = {
      data: courses,
      meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    };

    cache.set(cacheKey, result);
    res.json({ ...result, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/courses/:id
const getCourseById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const cacheKey = CACHE_KEYS.COURSE_DETAIL(id);
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: { select: { firstName: true, lastName: true, teacherCode: true } },
        enrollments: { include: { student: { select: { firstName: true, lastName: true, studentCode: true } } } },
        grades: { include: { student: { select: { firstName: true, lastName: true } } } }
      }
    });

    if (!course) return res.status(404).json({ error: 'Course not found' });
    cache.set(cacheKey, course);
    res.json({ ...course, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/courses
const createCourse = async (req, res) => {
  try {
    const { name, description, credits, teacherId } = req.body;
    const count = await prisma.course.count();

    const course = await prisma.course.create({
      data: {
        courseCode: `CRS${String(count + 1).padStart(4, '0')}`,
        name,
        description,
        credits: parseInt(credits) || 3,
        teacherId: teacherId ? parseInt(teacherId) : null
      }
    });

    // Invalidate cache
    cache.flushAll();
    res.status(201).json({ message: 'Course created', course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/courses/:id
const updateCourse = async (req, res) => {
  try {
    const { name, description, credits, teacherId } = req.body;
    const course = await prisma.course.update({
      where: { id: parseInt(req.params.id) },
      data: { name, description, credits: credits ? parseInt(credits) : undefined, teacherId: teacherId ? parseInt(teacherId) : null }
    });
    cache.flushAll();
    res.json({ message: 'Course updated', course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/courses/:id
const deleteCourse = async (req, res) => {
  try {
    await prisma.course.delete({ where: { id: parseInt(req.params.id) } });
    cache.flushAll();
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getCourses, getCourseById, createCourse, updateCourse, deleteCourse };
