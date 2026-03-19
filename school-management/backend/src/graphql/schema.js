const { buildSchema } = require('graphql');
const prisma = require('../config/prisma');

const graphqlSchema = buildSchema(`
  type User {
    id: Int
    email: String
    role: String
  }

  type Teacher {
    id: Int
    teacherCode: String
    firstName: String
    lastName: String
    department: String
  }

  type Course {
    id: Int
    courseCode: String
    name: String
    description: String
    credits: Int
    teacher: Teacher
  }

  type Grade {
    id: Int
    score: Float
    grade: String
    semester: String
    year: Int
    course: Course
  }

  type Student {
    id: Int
    studentCode: String
    firstName: String
    lastName: String
    phone: String
    grades: [Grade]
  }

  type Query {
    courses: [Course]
    course(id: Int!): Course
    student(id: Int!): Student
    students: [Student]
  }
`);

const graphqlRoot = {
  courses: async () => {
    return prisma.course.findMany({ include: { teacher: true } });
  },
  course: async ({ id }) => {
    return prisma.course.findUnique({ where: { id }, include: { teacher: true } });
  },
  student: async ({ id }) => {
    return prisma.student.findUnique({
      where: { id },
      include: { grades: { include: { course: true } } }
    });
  },
  students: async () => {
    return prisma.student.findMany({ include: { grades: { include: { course: true } } } });
  }
};

module.exports = { graphqlSchema, graphqlRoot };
