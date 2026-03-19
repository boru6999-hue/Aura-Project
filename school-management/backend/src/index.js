require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { graphqlHTTP } = require('express-graphql');
const { graphqlSchema, graphqlRoot } = require('./graphql/schema');

const authRoutes       = require('./routes/auth.routes');
const studentRoutes    = require('./routes/student.routes');
const teacherRoutes    = require('./routes/teacher.routes');
const courseRoutes     = require('./routes/course.routes');
const gradeRoutes      = require('./routes/grade.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const enrollmentRoutes = require('./routes/enrollment.routes');
const scheduleRoutes   = require('./routes/schedule.routes');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',       authRoutes);
app.use('/api/students',   studentRoutes);
app.use('/api/teachers',   teacherRoutes);
app.use('/api/courses',    courseRoutes);
app.use('/api/grades',     gradeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/enrollments',enrollmentRoutes);
app.use('/api/schedule-requests', require('./routes/scheduleRequest.routes'));
app.use('/api/schedules',  scheduleRoutes);

app.use('/graphql', graphqlHTTP({ schema: graphqlSchema, rootValue: graphqlRoot, graphiql: true }));
app.get('/health', (_req, res) => res.json({ status: 'OK' }));

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 GraphQL at http://localhost:${PORT}/graphql`);
});

module.exports = app;
