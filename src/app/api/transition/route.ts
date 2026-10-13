import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classIdParam = searchParams.get('classId');

    // 1. Find 10th classes or classes specified
    let targetClasses = await prisma.classRoom.findMany({
      where: classIdParam && classIdParam !== 'ALL'
        ? { id: classIdParam }
        : {
            OR: [
              { name: { contains: '10', mode: 'insensitive' } },
              { name: { contains: 'tenth', mode: 'insensitive' } },
              { name: { contains: 'sslc', mode: 'insensitive' } },
              { name: { contains: 'secondary', mode: 'insensitive' } },
            ],
          },
      include: {
        students: {
          include: {
            marks: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    // If no specific class matched "10", fetch all classes so admin can pick any class
    const allClasses = await prisma.classRoom.findMany({
      select: { id: true, name: true, academicYear: true },
      orderBy: { name: 'asc' },
    });

    if (targetClasses.length === 0 && allClasses.length > 0) {
      targetClasses = await prisma.classRoom.findMany({
        where: { id: allClasses[0].id },
        include: {
          students: {
            include: { marks: true },
            orderBy: { name: 'asc' },
          },
        },
      });
    }

    // 2. Fetch existing alumni admission numbers to flag who is already transitioned
    const existingAlumni = await prisma.alumni.findMany({
      select: { admissionNumber: true, id: true },
    });
    const existingAlumniMap = new Map(existingAlumni.map((a) => [a.admissionNumber.toLowerCase(), a.id]));

    // 3. Format candidate students
    const candidates: any[] = [];
    for (const cls of targetClasses) {
      for (const s of cls.students) {
        const cleanAdm = String(s.admissionNumber || '').trim().replace(/\.0$/, '');
        const alreadyAlumniId = existingAlumniMap.get(cleanAdm.toLowerCase()) || s.alumniId || null;

        // Calculate simple marks summary if marks exist
        let totalScore = 0;
        let markCount = s.marks?.length || 0;
        if (markCount > 0) {
          totalScore = s.marks.reduce((sum: number, m: any) => sum + (Number(m.score) || 0), 0);
        }
        const avgScore = markCount > 0 ? (totalScore / markCount).toFixed(1) : undefined;

        candidates.push({
          id: s.id,
          admissionNumber: cleanAdm,
          name: s.name,
          classId: s.classId,
          className: cls.name,
          academicYear: cls.academicYear,
          phone: s.phone,
          email: s.email,
          photoUrl: s.photoUrl,
          dob: s.dob,
          gender: s.gender,
          bloodGroup: s.bloodGroup,
          address: s.address,
          status: s.status,
          isAlumni: !!alreadyAlumniId || s.isAlumni,
          alumniId: alreadyAlumniId,
          cceAverage: avgScore,
        });
      }
    }

    return NextResponse.json({
      success: true,
      classes: allClasses,
      candidates,
      totalCount: candidates.length,
    });
  } catch (err: any) {
    console.error('Transition GET error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch candidate students' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { studentIds, passoutBatchYear, completedClass = '10th Standard' } = await req.json();

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'Please select at least one student to graduate to Alumni.' }, { status: 400 });
    }
    if (!passoutBatchYear || !String(passoutBatchYear).trim()) {
      return NextResponse.json({ error: 'Batch is required (e.g. 2025 or 2026).' }, { status: 400 });
    }

    const cleanBatch = String(passoutBatchYear).trim().replace(/\.0$/, '');

    // Fetch the students
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: {
        marks: true,
        class: true,
      },
    });

    let transitionedCount = 0;
    const errors: string[] = [];

    for (const student of students) {
      try {
        const cleanAdm = String(student.admissionNumber || '').trim().replace(/\.0$/, '');
        if (!cleanAdm) continue;

        // Calculate final grade snapshot
        let finalGradeStr: string | null = null;
        if (student.marks && student.marks.length > 0) {
          const totalScore = student.marks.reduce((acc: number, m: any) => acc + (Number(m.score) || 0), 0);
          const avg = (totalScore / student.marks.length).toFixed(1);
          finalGradeStr = `CCE Avg: ${avg}`;
        }

        // Upsert Alumni record
        const alumni = await prisma.alumni.upsert({
          where: { admissionNumber: cleanAdm },
          update: {
            name: student.name,
            passoutBatchYear: cleanBatch,
            completedClass: completedClass || student.class?.name || '10th Standard',
            phone: student.phone || undefined,
            email: student.email || undefined,
            photoUrl: student.photoUrl || undefined,
            gender: student.gender || undefined,
            dob: student.dob || undefined,
            bloodGroup: student.bloodGroup || undefined,
            permanentAddress: student.address || undefined,
            studentId: student.id,
            finalGradeOrPercentage: finalGradeStr || undefined,
          },
          create: {
            admissionNumber: cleanAdm,
            name: student.name,
            passoutBatchYear: cleanBatch,
            completedClass: completedClass || student.class?.name || '10th Standard',
            phone: student.phone || null,
            email: student.email || null,
            photoUrl: student.photoUrl || null,
            gender: student.gender || null,
            dob: student.dob || null,
            bloodGroup: student.bloodGroup || null,
            permanentAddress: student.address || null,
            studentId: student.id,
            finalGradeOrPercentage: finalGradeStr || null,
            isProfileCompleted: false, // Will prompt onboarding wizard on next login!
            completedSteps: 0,
            currentStatus: 'Higher Studies',
          },
        });

        // Update Student status to 'graduated' and mark isAlumni = true
        await prisma.student.update({
          where: { id: student.id },
          data: {
            status: 'graduated',
            isAlumni: true,
            alumniId: alumni.id,
          },
        });

        // Elevate User account role to 'alumni'
        const defaultPass = `${cleanAdm}${cleanAdm}${cleanAdm}`;
        await prisma.user.upsert({
          where: { username: cleanAdm },
          update: {
            role: 'alumni',
            name: student.name,
            alumniId: alumni.id,
            admissionNumber: cleanAdm,
          },
          create: {
            id: `user-alumni-${alumni.id}`,
            username: cleanAdm,
            role: 'alumni',
            name: student.name,
            admissionNumber: cleanAdm,
            alumniId: alumni.id,
            password: defaultPass,
            status: 'active',
            email: student.email || null,
            phone: student.phone || null,
          },
        });

        transitionedCount++;
      } catch (err: any) {
        errors.push(`Failed for student ${student.name} (${student.admissionNumber}): ${err?.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully transitioned ${transitionedCount} students to Alumni!`,
      transitionedCount,
      errors,
    });
  } catch (err: any) {
    console.error('Transition POST error:', err);
    return NextResponse.json({ error: err?.message || 'Transition execution failed' }, { status: 500 });
  }
}
