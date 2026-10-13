import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const alumniId = searchParams.get('alumniId');
    const zoneId = searchParams.get('zoneId');
    const batch = searchParams.get('batch');

    const where: any = {};

    // Targeting filter: show if target is ALL (null) or matches the alumnus's zone/batch
    if (zoneId) {
      where.OR = [
        { targetZoneId: null },
        { targetZoneId: '' },
        { targetZoneId: zoneId },
      ];
    }

    if (batch) {
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          {
            OR: [
              { targetBatch: null },
              { targetBatch: '' },
              { targetBatch: batch },
            ],
          },
        ];
        delete where.OR;
      } else {
        where.OR = [
          { targetBatch: null },
          { targetBatch: '' },
          { targetBatch: batch },
        ];
      }
    }

    const announcements = await prisma.alumniAnnouncement.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { publishedAt: 'desc' },
      ],
    });

    let readIds: string[] = [];
    if (alumniId) {
      const alumni = await prisma.alumni.findUnique({
        where: { id: alumniId },
        select: { readNotificationIds: true },
      });
      readIds = alumni?.readNotificationIds || [];
    }

    const unreadCount = announcements.filter((a) => !readIds.includes(a.id)).length;

    return NextResponse.json({
      success: true,
      announcements,
      readIds,
      unreadCount,
    });
  } catch (err: any) {
    console.error('Fetch Announcements Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { title, content, category = 'General', targetZoneId, targetBatch, priority = 'normal', isPinned = false, bannerUrl, createdBy, createdByName } = data;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const announcement = await prisma.alumniAnnouncement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category,
        targetZoneId: targetZoneId || null,
        targetBatch: targetBatch || null,
        priority,
        isPinned: Boolean(isPinned),
        bannerUrl: bannerUrl || null,
        createdBy: createdBy || null,
        createdByName: createdByName || 'Institute Administration',
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, announcement });
  } catch (err: any) {
    console.error('Create Announcement Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create announcement' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { alumniId, announcementId, markAll = false } = await req.json();

    if (!alumniId) {
      return NextResponse.json({ error: 'Alumni ID is required' }, { status: 400 });
    }

    const alumni = await prisma.alumni.findUnique({
      where: { id: alumniId },
      select: { readNotificationIds: true },
    });

    if (!alumni) {
      return NextResponse.json({ error: 'Alumni not found' }, { status: 404 });
    }

    let updatedReads = [...(alumni.readNotificationIds || [])];

    if (markAll) {
      const allAnnouncements = await prisma.alumniAnnouncement.findMany({ select: { id: true } });
      updatedReads = Array.from(new Set([...updatedReads, ...allAnnouncements.map((a) => a.id)]));
    } else if (announcementId && !updatedReads.includes(announcementId)) {
      updatedReads.push(announcementId);
    }

    await prisma.alumni.update({
      where: { id: alumniId },
      data: { readNotificationIds: updatedReads },
    });

    return NextResponse.json({ success: true, readIds: updatedReads });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update read state' }, { status: 500 });
  }
}
