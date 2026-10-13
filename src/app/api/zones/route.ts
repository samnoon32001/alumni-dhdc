import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PREDEFINED_ZONES } from '@/utils/excel';

export async function GET() {
  try {
    let zones = await prisma.alumniZone.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { alumni: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Auto-seed institutional zones if none exist
    if (zones.length === 0) {
      for (const zoneName of PREDEFINED_ZONES) {
        const region = zoneName.includes('GCC')
          ? 'International'
          : zoneName.includes('Bangalore')
          ? 'India'
          : 'Kerala';

        await prisma.alumniZone.upsert({
          where: { name: zoneName },
          update: {},
          create: {
            name: zoneName,
            region,
            isActive: true,
          },
        }).catch(() => {});
      }

      zones = await prisma.alumniZone.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { alumni: true },
          },
        },
        orderBy: { name: 'asc' },
      });
    }

    return NextResponse.json({ success: true, zones });
  } catch (err: any) {
    console.error('Fetch Zones Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch zones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, region = 'Kerala', description } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Zone name is required' }, { status: 400 });
    }

    const zone = await prisma.alumniZone.upsert({
      where: { name: name.trim() },
      update: { region, description, isActive: true },
      create: { name: name.trim(), region, description, isActive: true },
    });

    return NextResponse.json({ success: true, zone });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save zone' }, { status: 500 });
  }
}
