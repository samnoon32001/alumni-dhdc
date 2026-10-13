import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { AlumniImportRow } from '@/utils/excel';

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided for import' }, { status: 400 });
    }

    let successCount = 0;
    const errors: string[] = [];

    // Cache existing zones for fast lookup
    const existingZones = await prisma.alumniZone.findMany();
    const zoneMap = new Map<string, string>();
    existingZones.forEach((z) => {
      zoneMap.set(z.name.toLowerCase().trim(), z.id);
    });

    for (const r of rows as AlumniImportRow[]) {
      try {
        const cleanAdm = String(r.admissionNumber || '').trim().replace(/\.0$/, '');
        const cleanName = String(r.name || '').trim();
        const cleanBatch = String(r.passoutBatchYear || '').trim().replace(/\.0$/, '');

        if (!cleanAdm || !cleanName || !cleanBatch) {
          continue;
        }

        // Zone resolution
        let zoneId: string | null = null;
        let zoneName: string | null = null;
        if (r.zoneName) {
          const zTrim = r.zoneName.trim();
          const existingId = zoneMap.get(zTrim.toLowerCase());
          if (existingId) {
            zoneId = existingId;
            zoneName = zTrim;
          } else {
            // Auto-create new zone
            const region = zTrim.includes('GCC') ? 'International' : zTrim.includes('Bangalore') ? 'India' : 'Kerala';
            const newZone = await prisma.alumniZone.create({
              data: { name: zTrim, region, isActive: true },
            }).catch(() => null);
            if (newZone) {
              zoneId = newZone.id;
              zoneName = newZone.name;
              zoneMap.set(zTrim.toLowerCase(), newZone.id);
            }
          }
        }

        // Upsert Alumni
        const savedAlumni = await prisma.alumni.upsert({
          where: { admissionNumber: cleanAdm },
          update: {
            name: cleanName,
            passoutBatchYear: cleanBatch,
            completedClass: r.completedClass || '10th Standard',
            phone: r.phone || undefined,
            whatsappNumber: r.whatsappNumber || undefined,
            email: r.email || undefined,
            gender: r.gender || undefined,
            bloodGroup: r.bloodGroup || undefined,
            zoneId: zoneId || undefined,
            zoneName: zoneName || undefined,
            currentStatus: r.currentStatus || 'Higher Studies',
            currentInstitution: r.currentInstitution || undefined,
            courseOrDegree: r.courseOrDegree || undefined,
            currentCity: r.currentCity || undefined,
            currentState: r.currentState || 'Kerala',
            permanentAddress: r.permanentAddress || undefined,
          },
          create: {
            admissionNumber: cleanAdm,
            name: cleanName,
            passoutBatchYear: cleanBatch,
            completedClass: r.completedClass || '10th Standard',
            phone: r.phone || null,
            whatsappNumber: r.whatsappNumber || null,
            email: r.email || null,
            gender: r.gender || null,
            bloodGroup: r.bloodGroup || null,
            zoneId: zoneId || null,
            zoneName: zoneName || null,
            currentStatus: r.currentStatus || 'Higher Studies',
            currentInstitution: r.currentInstitution || null,
            courseOrDegree: r.courseOrDegree || null,
            currentCity: r.currentCity || null,
            currentState: r.currentState || 'Kerala',
            permanentAddress: r.permanentAddress || null,
            isProfileCompleted: !!(zoneId && r.permanentAddress),
            completedSteps: zoneId ? 2 : 0,
          },
        });

        // Ensure User account exists for this alumnus
        const defaultPass = `${cleanAdm}${cleanAdm}${cleanAdm}`;
        await prisma.user.upsert({
          where: { username: cleanAdm },
          update: {
            role: 'alumni',
            name: cleanName,
            alumniId: savedAlumni.id,
            admissionNumber: cleanAdm,
            email: r.email || undefined,
            phone: r.phone || undefined,
          },
          create: {
            id: `user-alumni-${savedAlumni.id}`,
            username: cleanAdm,
            role: 'alumni',
            name: cleanName,
            admissionNumber: cleanAdm,
            alumniId: savedAlumni.id,
            password: defaultPass,
            status: 'active',
            email: r.email || null,
            phone: r.phone || null,
          },
        });

        successCount++;
      } catch (rowErr: any) {
        errors.push(`Error on row ${r.admissionNumber}: ${rowErr?.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${successCount} alumni records!`,
      successCount,
      errors: errors.slice(0, 10),
    });
  } catch (err: any) {
    console.error('Bulk Import Error:', err);
    return NextResponse.json({ error: err?.message || 'Bulk import failed' }, { status: 500 });
  }
}
