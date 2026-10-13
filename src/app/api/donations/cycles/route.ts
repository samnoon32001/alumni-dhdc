import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { IFLAHFundLevel } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      academicYear,
      label,
      startDate,
      endDate,
      levels, // Array of IFLAHFundLevel: [{ id: 'rabee', name: "Rabee'", target: 600 }, ...]
      isCurrent = false,
      descriptionInfo = 'FALAH DHDC IFLAH Fund Collection',
    } = data;

    if (!academicYear || !label) {
      return NextResponse.json({ error: 'Academic Year and Label are required' }, { status: 400 });
    }

    const effectiveLevels: IFLAHFundLevel[] =
      Array.isArray(levels) && levels.length > 0
        ? levels
        : [
            { id: 'rabee', name: "Rabee'", target: 600 },
            { id: 'ramadan', name: 'Ramadan', target: 600 },
          ];

    const computedTarget = effectiveLevels.reduce((sum, l) => sum + (Number(l.target) || 0), 0);

    // If marked current, deactivate other cycles
    if (isCurrent) {
      await prisma.alumniDonationCycle.updateMany({
        data: { isCurrent: false },
      });
    }

    const cycleKey = `IFLAH_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

    const cycle = await prisma.alumniDonationCycle.create({
      data: {
        academicYear,
        cycle: cycleKey,
        label,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(new Date().getFullYear(), 11, 31),
        defaultTarget: computedTarget,
        isCurrent: Boolean(isCurrent),
        description: JSON.stringify({
          info: descriptionInfo,
          levels: effectiveLevels,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'IFLAH Fund Cycle created successfully!',
      cycle: {
        ...cycle,
        levels: effectiveLevels,
      },
    });
  } catch (err: any) {
    console.error('Create Cycle Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create cycle' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      id,
      academicYear,
      label,
      startDate,
      endDate,
      levels,
      isCurrent,
      descriptionInfo,
    } = data;

    if (!id) {
      return NextResponse.json({ error: 'Cycle ID is required' }, { status: 400 });
    }

    const existing = await prisma.alumniDonationCycle.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    let existingDesc: any = {};
    try {
      existingDesc = JSON.parse(existing.description || '{}');
    } catch {}

    const effectiveLevels: IFLAHFundLevel[] =
      levels !== undefined
        ? levels
        : existingDesc.levels || [
            { id: 'rabee', name: "Rabee'", target: 600 },
            { id: 'ramadan', name: 'Ramadan', target: 600 },
          ];

    const computedTarget = effectiveLevels.reduce((sum, l) => sum + (Number(l.target) || 0), 0);

    if (isCurrent === true) {
      await prisma.alumniDonationCycle.updateMany({
        where: { id: { not: id } },
        data: { isCurrent: false },
      });
    }

    const updated = await prisma.alumniDonationCycle.update({
      where: { id },
      data: {
        academicYear: academicYear || existing.academicYear,
        label: label || existing.label,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate ? new Date(endDate) : existing.endDate,
        defaultTarget: computedTarget,
        isCurrent: isCurrent !== undefined ? isCurrent : existing.isCurrent,
        description: JSON.stringify({
          info: descriptionInfo || existingDesc.info || 'FALAH DHDC IFLAH Fund Collection',
          levels: effectiveLevels,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'IFLAH Fund Cycle & Levels updated successfully!',
      cycle: {
        ...updated,
        levels: effectiveLevels,
      },
    });
  } catch (err: any) {
    console.error('Update Cycle Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to update cycle' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Cycle ID is required' }, { status: 400 });
    }

    // Delete donations in cycle first if any, or cascade
    await prisma.alumniDonation.deleteMany({
      where: { cycleId: id },
    });

    await prisma.alumniDonationCycle.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Cycle and related donations deleted successfully.',
    });
  } catch (err: any) {
    console.error('Delete Cycle Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to delete cycle' }, { status: 500 });
  }
}
