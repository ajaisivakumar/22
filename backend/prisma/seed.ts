import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Grade Scale (Anna University Reg 2025 provisional)
  const gradeScales = [
    { letterGrade: 'O', gradePoint: 10.0, description: 'Outstanding' },
    { letterGrade: 'A+', gradePoint: 9.0, description: 'Excellent' },
    { letterGrade: 'A', gradePoint: 8.0, description: 'Very Good' },
    { letterGrade: 'B+', gradePoint: 7.0, description: 'Good' },
    { letterGrade: 'B', gradePoint: 6.0, description: 'Average' },
    { letterGrade: 'C', gradePoint: 5.0, description: 'Satisfactory' },
    { letterGrade: 'U', gradePoint: 0.0, description: 'Re-appearance' },
  ];

  for (const scale of gradeScales) {
    await prisma.gradeScale.upsert({
      where: {
        regulation_programme_letterGrade: {
          regulation: '2025',
          programme: 'B.E. CSE',
          letterGrade: scale.letterGrade,
        },
      },
      update: {
        gradePoint: scale.gradePoint,
        description: scale.description,
      },
      create: {
        regulation: '2025',
        programme: 'B.E. CSE',
        letterGrade: scale.letterGrade,
        gradePoint: scale.gradePoint,
        description: scale.description,
        isActive: true,
      },
    });
  }
  console.log('✅ Seeded GradeScale entries');

  // 2. Courses (Anna University Reg 2025, B.E. CSE)
  const courses = [
    // Semester 1 (23 credits)
    { courseCode: 'MA25C01', courseName: 'Applied Calculus', credits: 4, semester: 1, isElective: false },
    { courseCode: 'EN25C01', courseName: 'English Essentials – I', credits: 2, semester: 1, isElective: false },
    { courseCode: 'UC25H01', courseName: 'Heritage of Tamils', credits: 1, semester: 1, isElective: false },
    { courseCode: 'PH25C01', courseName: 'Applied Physics – I', credits: 3, semester: 1, isElective: false },
    { courseCode: 'CY25C01', courseName: 'Applied Chemistry – I', credits: 3, semester: 1, isElective: false },
    { courseCode: 'CS25C01', courseName: 'Computer Programming: C', credits: 3, semester: 1, isElective: false },
    { courseCode: 'CS25C03', courseName: 'Essentials of Computing', credits: 3, semester: 1, isElective: false },
    { courseCode: 'ME25C04', courseName: 'Makerspace', credits: 2, semester: 1, isElective: false },
    { courseCode: 'UC25A01', courseName: 'Life Skills for Engineers – I', credits: 1, semester: 1, isElective: false },
    { courseCode: 'UC25A02', courseName: 'Physical Education – I', credits: 1, semester: 1, isElective: false },

    // Semester 2 (27 credits)
    { courseCode: 'MA25C02', courseName: 'Linear Algebra', credits: 4, semester: 2, isElective: false },
    { courseCode: 'EE25C01', courseName: 'Basic Electrical and Electronics Engineering', credits: 3, semester: 2, isElective: false },
    { courseCode: 'CS25C06', courseName: 'Digital Principles and Computer Organization', credits: 4, semester: 2, isElective: false },
    { courseCode: 'UC25H02', courseName: 'Tamils and Technology', credits: 1, semester: 2, isElective: false },
    { courseCode: 'PH25C03', courseName: 'Applied Physics (CSIE) – II', credits: 3, semester: 2, isElective: false },
    { courseCode: 'CS25C07', courseName: 'Object Oriented Programming', credits: 5, semester: 2, isElective: false },
    { courseCode: 'EN25C02', courseName: 'English Essentials – II', credits: 2, semester: 2, isElective: false },
    { courseCode: 'ME25C05', courseName: 'Re-Engineering for Innovation', credits: 2, semester: 2, isElective: false },
    { courseCode: 'UC25A03', courseName: 'Life Skills for Engineers – II', credits: 1, semester: 2, isElective: false },
    { courseCode: 'UC25A04', courseName: 'Physical Education – II', credits: 1, semester: 2, isElective: false },
    { courseCode: null, courseName: 'Foreign Language (Deutsch / Japanese / Korean)', credits: 1, semester: 2, isElective: true },

    // Semester 3 (24 credits)
    { courseCode: 'MA25C14', courseName: 'Discrete Mathematics', credits: 4, semester: 3, isElective: false },
    { courseCode: 'CS25C11', courseName: 'Operating Systems', credits: 4, semester: 3, isElective: false },
    { courseCode: 'CS25C10', courseName: 'Object Oriented Software Engineering', credits: 3, semester: 3, isElective: false },
    { courseCode: 'CS25C08', courseName: 'Data Structures', credits: 5, semester: 3, isElective: false },
    { courseCode: 'CS25C09', courseName: 'Java Programming', credits: 5, semester: 3, isElective: false },
    { courseCode: 'EN25C03', courseName: 'English Communication Skills Laboratory – I', credits: 1, semester: 3, isElective: false },
    { courseCode: null, courseName: 'Skill Development Course – I', credits: 2, semester: 3, isElective: false },

    // Semester 4 (24 credits)
    { courseCode: 'MA25C13', courseName: 'Probability and Statistics', credits: 4, semester: 4, isElective: false },
    { courseCode: 'CS25C12', courseName: 'Algorithms', credits: 3, semester: 4, isElective: false },
    { courseCode: 'CS25C14', courseName: 'Theory of Computation', credits: 4, semester: 4, isElective: false },
    { courseCode: 'CS25C15', courseName: 'Standards in Computer Science', credits: 1, semester: 4, isElective: false },
    { courseCode: 'AD25201', courseName: 'Python for Data Science', credits: 4, semester: 4, isElective: false },
    { courseCode: 'CS25C13', courseName: 'Database Management Systems', credits: 5, semester: 4, isElective: false },
    { courseCode: null, courseName: 'Skill Development Course – II', credits: 2, semester: 4, isElective: false },
    { courseCode: 'EN25C04', courseName: 'English Communication Skills Laboratory – II', credits: 1, semester: 4, isElective: false },

    // Semester 5 (25 credits)
    { courseCode: null, courseName: 'Computer Networks', credits: 4, semester: 5, isElective: false },
    { courseCode: null, courseName: 'Compiler Design', credits: 3, semester: 5, isElective: false },
    { courseCode: null, courseName: 'Programme Elective – I', credits: 3, semester: 5, isElective: true, electiveGroup: 'PE1' },
    { courseCode: null, courseName: 'Cryptography and Cyber Security', credits: 4, semester: 5, isElective: false },
    { courseCode: null, courseName: 'Artificial Intelligence and Machine Learning', credits: 4, semester: 5, isElective: false },
    { courseCode: null, courseName: 'Full Stack Development', credits: 4, semester: 5, isElective: false },
    { courseCode: null, courseName: 'Skill Development Course – III', credits: 2, semester: 5, isElective: false },
    { courseCode: null, courseName: 'Industry Oriented Course – I', credits: 1, semester: 5, isElective: false },

    // Semester 6 (20 credits)
    { courseCode: null, courseName: 'Large Language Models', credits: 3, semester: 6, isElective: false },
    { courseCode: null, courseName: 'Programme Elective – II', credits: 3, semester: 6, isElective: true, electiveGroup: 'PE2' },
    { courseCode: null, courseName: 'Programme Elective – III', credits: 3, semester: 6, isElective: true, electiveGroup: 'PE3' },
    { courseCode: null, courseName: 'Open Elective', credits: 3, semester: 6, isElective: true, electiveGroup: 'OE' },
    { courseCode: null, courseName: 'Industry Oriented Course – II', credits: 1, semester: 6, isElective: false },
    { courseCode: null, courseName: 'Deep Learning', credits: 4, semester: 6, isElective: false },
    { courseCode: null, courseName: 'Mobile App Development Laboratory', credits: 2, semester: 6, isElective: false },
    { courseCode: null, courseName: 'Self-Learning Course', credits: 1, semester: 6, isElective: false },

    // Semester 7 (15 credits)
    { courseCode: null, courseName: 'Climate Change and Sustainability', credits: 2, semester: 7, isElective: false },
    { courseCode: null, courseName: 'Programme Elective – IV', credits: 3, semester: 7, isElective: true, electiveGroup: 'PE4' },
    { courseCode: null, courseName: 'Programme Elective – V', credits: 3, semester: 7, isElective: true, electiveGroup: 'PE5' },
    { courseCode: null, courseName: 'Engineering Entrepreneurship Development', credits: 3, semester: 7, isElective: false },
    { courseCode: null, courseName: 'Ethical Hacking and Penetration Testing', credits: 3, semester: 7, isElective: false },
    { courseCode: null, courseName: 'Summer Internship', credits: 1, semester: 7, isElective: false },

    // Semester 8 (8 credits)
    { courseCode: null, courseName: 'Project Work / Internship cum Project Work', credits: 8, semester: 8, isElective: false },
  ];

  for (const c of courses) {
    const existing = await prisma.curriculumCourse.findFirst({
      where: {
        regulation: '2025',
        programme: 'B.E. CSE',
        semester: c.semester,
        courseName: c.courseName,
      },
    });

    if (!existing) {
      await prisma.curriculumCourse.create({
        data: {
          regulation: '2025',
          programme: 'B.E. CSE',
          semester: c.semester,
          courseCode: c.courseCode,
          courseName: c.courseName,
          credits: c.credits,
          isElective: c.isElective,
          electiveGroup: c.electiveGroup ?? null,
          isActive: true,
        },
      });
    }
  }

  console.log(`✅ Seeded ${courses.length} Curriculum courses`);
  console.log('🌟 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
