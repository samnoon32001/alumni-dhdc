import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseLevels } from '@/utils/donationLevels';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { cycleId, rows } = data;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided for import' }, { status: 400 });
    }

    // 1. Determine cycle
    let targetCycle = null;
    if (cycleId) {
      targetCycle = await prisma.alumniDonationCycle.findUnique({ where: { id: cycleId } });
    }
    if (!targetCycle) {
      targetCycle = await prisma.alumniDonationCycle.findFirst({
        where: { isCurrent: true },
        orderBy: { startDate: 'desc' },
      });
    }
    if (!targetCycle) {
      targetCycle = await prisma.alumniDonationCycle.findFirst({
        orderBy: { startDate: 'desc' },
      });
    }

    if (!targetCycle) {
      return NextResponse.json({ error: 'No active collection cycle found' }, { status: 404 });
    }

    const cycleLevels = parseLevels(targetCycle.description);
    const computedTarget = cycleLevels.reduce((s, l) => s + (l.target || 0), 0) || targetCycle.defaultTarget || 1200;

    // 2. Fetch all alumni into a Map for fast lookup
    const allAlumni = await prisma.alumni.findMany({
      select: { id: true, admissionNumber: true, name: true },
    });
    const alumniMap = new Map<string, { id: string; admissionNumber: string; name: string }>();
    allAlumni.forEach((a) => {
      alumniMap.set(a.admissionNumber.trim().toLowerCase(), a);
    });

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const admNoKey = String(row.admissionNumber || '').trim().toLowerCase();
      const alumnus = alumniMap.get(admNoKey);

      if (!alumnus) {
        skippedCount++;
        errors.push(`Row ${i + 1}: Admission number "${row.admissionNumber}" not found in alumni records.`);
        continue;
      }

      const numAmount = Number(row.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        skippedCount++;
        errors.push(`Row ${i + 1}: Invalid amount "${row.amount}" for alumnus ${alumnus.name}.`);
        continue;
      }

      const levelName = row.levelName || "Rabee'";
      const paymentMethod = row.paymentMethod || 'UPI';
      const transactionRef = row.transactionRef || null;
      const paymentDate = row.paymentDate ? new Date(row.paymentDate) : new Date();
      const taggedNotes = `[Level: ${levelName}] ${row.notes || 'Imported via Excel'}`.trim();
      const cleanReceiptNumber = `DHDC-IFLAH-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      // Find or create AlumniDonation
      let donation = await prisma.alumniDonation.findFirst({
        where: {
          alumniId: alumnus.id,
          cycleId: targetCycle.id,
        },
      });

      const currentTarget = donation?.targetAmount || computedTarget;
      const currentPaid = donation?.paidAmount || 0;
      const newPaid = currentPaid + numAmount;
      const newBalance = Math.max(0, currentTarget - newPaid);
      const newStatus = newPaid >= currentTarget ? 'COMPLETED' : newPaid > 0 ? 'PARTIAL' : 'PENDING';

      if (!donation) {
        donation = await prisma.alumniDonation.create({
          data: {
            alumniId: alumnus.id,
            admissionNumber: alumnus.admissionNumber,
            alumniName: alumnus.name,
            cycleId: targetCycle.id,
            targetAmount: currentTarget,
            paidAmount: newPaid,
            balanceAmount: newBalance,
            status: newStatus,
            lastPaymentDate: paymentDate,
            paymentMethod,
            transactionRef,
            receiptNumber: cleanReceiptNumber,
            notes: taggedNotes,
            recordedByName: 'Excel Bulk Importer',
          },
        });
      } else {
        donation = await prisma.alumniDonation.update({
          where: { id: donation.id },
          data: {
            paidAmount: newPaid,
            balanceAmount: newBalance,
            status: newStatus,
            lastPaymentDate: paymentDate,
            paymentMethod,
            transactionRef: transactionRef || donation.transactionRef,
            receiptNumber: donation.receiptNumber || cleanReceiptNumber,
            notes: taggedNotes,
            recordedByName: 'Excel Bulk Importer',
          },
        });
      }

      // Create Payment Record
      await prisma.alumniPaymentRecord.create({
        data: {
          donationId: donation.id,
          amount: numAmount,
          paymentDate,
          paymentMethod,
          transactionRef,
          receiptNumber: cleanReceiptNumber,
          notes: taggedNotes,
          recordedByName: 'Excel Bulk Importer',
        },
      });

      importedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedCount} payment records into ${targetCycle.label}!`,
      importedCount,
      skippedCount,
      errors: errors.slice(0, 10), // return top 10 errors if any
    });
  } catch (err: any) {
    console.error('Bulk Import Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to import payments' }, { status: 500 });
  }
}
