import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const search = searchParams.get('search')?.trim();
    const zoneId = searchParams.get('zoneId');
    const batch = searchParams.get('batch');
    const status = searchParams.get('status');

    // Single lookup
    if (id) {
      const alumni = await prisma.alumni.findFirst({
        where: {
          OR: [
            { id },
            { admissionNumber: id },
            { userId: id },
          ],
        },
        include: {
          zone: true,
          donations: {
            include: {
              cycle: true,
              payments: { orderBy: { paymentDate: 'desc' } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!alumni) {
        return NextResponse.json({ error: 'Alumni not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, alumni });
    }

    // List with filters
    const where: any = {};

    if (zoneId && zoneId !== 'ALL') {
      where.zoneId = zoneId;
    }

    if (batch && batch !== 'ALL') {
      where.passoutBatchYear = batch;
    }

    if (status && status !== 'ALL') {
      where.currentStatus = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { admissionNumber: { contains: search, mode: 'insensitive' } },
        { currentCity: { contains: search, mode: 'insensitive' } },
        { currentInstitution: { contains: search, mode: 'insensitive' } },
        { organizationOrCompany: { contains: search, mode: 'insensitive' } },
        { courseOrDegree: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
      ];
    }

    const alumniList = await prisma.alumni.findMany({
      where,
      include: {
        zone: true,
        donations: {
          include: { cycle: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ passoutBatchYear: 'desc' }, { name: 'asc' }],
    });

    // Also get distinct batches for filter dropdown
    const distinctBatches = await prisma.alumni.findMany({
      select: { passoutBatchYear: true },
      distinct: ['passoutBatchYear'],
      orderBy: { passoutBatchYear: 'desc' },
    });
    const availableBatches = distinctBatches.map((b) => b.passoutBatchYear).filter(Boolean);

    return NextResponse.json({
      success: true,
      alumni: alumniList,
      totalCount: alumniList.length,
      availableBatches,
    });
  } catch (err: any) {
    console.error('Fetch Alumni Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch alumni' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, admissionNumber, name, passoutBatchYear } = data;

    if (!admissionNumber || !name || !passoutBatchYear) {
      return NextResponse.json(
        { error: 'Admission Number, Name, and Batch are required' },
        { status: 400 }
      );
    }

    const cleanAdm = String(admissionNumber).trim().replace(/\.0$/, '');

    // Zone resolution
    let zoneId = data.zoneId;
    let zoneName = data.zoneName;
    if (zoneId) {
      const z = await prisma.alumniZone.findUnique({ where: { id: zoneId } });
      if (z) zoneName = z.name;
    } else if (zoneName) {
      const z = await prisma.alumniZone.findUnique({ where: { name: zoneName } });
      if (z) zoneId = z.id;
    }

    const payload: any = {
      admissionNumber: cleanAdm,
      name: String(name).trim(),
      passoutBatchYear: String(passoutBatchYear).trim(),
      completedClass: data.completedClass || '10th Standard',
      gender: data.gender || null,
      dob: data.dob || null,
      bloodGroup: data.bloodGroup || null,
      photoUrl: data.photoUrl || null,
      email: data.email || null,
      phone: data.phone || null,
      whatsappNumber: data.whatsappNumber || null,
      zoneId: zoneId || null,
      zoneName: zoneName || null,
      permanentAddress: data.permanentAddress || null,
      currentCity: data.currentCity || null,
      currentState: data.currentState || 'Kerala',
      currentCountry: data.currentCountry || 'India',
      postalCode: data.postalCode || null,
      currentStatus: data.currentStatus || 'Higher Studies',
      currentInstitution: data.currentInstitution || null,
      courseOrDegree: data.courseOrDegree || null,
      designation: data.designation || null,
      organizationOrCompany: data.organizationOrCompany || null,
      isPublicProfile: data.isPublicProfile !== false,
      showContactNumber: data.showContactNumber === true,
      showEmail: data.showEmail !== false,
      willingToMentor: data.willingToMentor === true,
      bio: data.bio || null,
      verificationStatus: data.verificationStatus || 'VERIFIED',
    };

    if (data.isProfileCompleted !== undefined) {
      payload.isProfileCompleted = Boolean(data.isProfileCompleted);
    }

    let savedAlumni;
    if (id) {
      savedAlumni = await prisma.alumni.update({
        where: { id },
        data: payload,
        include: { zone: true },
      });
    } else {
      savedAlumni = await prisma.alumni.upsert({
        where: { admissionNumber: cleanAdm },
        update: payload,
        create: payload,
        include: { zone: true },
      });
    }

    return NextResponse.json({ success: true, alumni: savedAlumni });
  } catch (err: any) {
    console.error('Save Alumni Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to save alumni' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Alumni ID is required' }, { status: 400 });
    }

    await prisma.alumni.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Alumnus deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete alumnus' }, { status: 500 });
  }
}
