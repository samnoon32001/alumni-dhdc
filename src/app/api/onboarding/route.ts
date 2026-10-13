import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { alumniId, photoUrl, zoneId, permanentAddress, currentCity, currentState, currentCountry, postalCode, whatsappNumber, currentStatus, currentInstitution, courseOrDegree, designation, organizationOrCompany } = body;

    if (!alumniId) {
      return NextResponse.json({ error: 'Alumni ID is required' }, { status: 400 });
    }

    // Step 2 is MANDATORY: Zone is required!
    if (!zoneId) {
      return NextResponse.json({ error: 'Selecting a Regional Zone / Chapter is mandatory to complete onboarding.' }, { status: 400 });
    }

    // Verify Zone
    const zone = await prisma.alumniZone.findUnique({
      where: { id: zoneId },
    });
    if (!zone) {
      return NextResponse.json({ error: 'Selected zone is not valid' }, { status: 400 });
    }

    const updatedAlumni = await prisma.alumni.update({
      where: { id: alumniId },
      data: {
        photoUrl: photoUrl || undefined,
        zoneId: zone.id,
        zoneName: zone.name,
        permanentAddress: permanentAddress || undefined,
        currentCity: currentCity || undefined,
        currentState: currentState || 'Kerala',
        currentCountry: currentCountry || 'India',
        postalCode: postalCode || undefined,
        whatsappNumber: whatsappNumber || undefined,
        currentStatus: currentStatus || 'Higher Studies',
        currentInstitution: currentInstitution || undefined,
        courseOrDegree: courseOrDegree || undefined,
        designation: designation || undefined,
        organizationOrCompany: organizationOrCompany || undefined,
        isProfileCompleted: true,
        completedSteps: 3,
      },
      include: {
        zone: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully! Welcome to the DHDC Alumni Network.',
      alumni: updatedAlumni,
    });
  } catch (err: any) {
    console.error('Onboarding Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to complete onboarding' }, { status: 500 });
  }
}
