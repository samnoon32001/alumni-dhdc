import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { IFLAHFundLevel, LevelBreakdownItem } from '@/types';
import { parseLevels, computeLevelBreakdown } from '@/utils/donationLevels';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const alumniId = searchParams.get('alumniId');
    const cycleId = searchParams.get('cycleId');

    // 1. Ensure active IFLAH Fund cycle exists
    let rawCycles = await prisma.alumniDonationCycle.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: { donations: true },
        },
      },
    });

    const now = new Date();
    const currentYear = now.getFullYear();

    // Check if we need to seed or rename to IFLAH Fund Collection
    if (rawCycles.length === 0) {
      const defaultLevels = [
        { id: 'rabee', name: "Rabee'", target: 600 },
        { id: 'ramadan', name: 'Ramadan', target: 600 },
      ];
      await prisma.alumniDonationCycle.create({
        data: {
          academicYear: `${currentYear}-${currentYear + 1}`,
          cycle: `IFLAH_${currentYear}_${currentYear + 1}`,
          label: `${currentYear}-${currentYear + 1} IFLAH Fund Collection`,
          startDate: new Date(currentYear, 0, 1),
          endDate: new Date(currentYear, 11, 31),
          defaultTarget: 1200.0,
          isCurrent: true,
          description: JSON.stringify({
            info: 'FALAH DHDC IFLAH Fund Institutional Development Collection',
            levels: defaultLevels,
          }),
        },
      });

      rawCycles = await prisma.alumniDonationCycle.findMany({
        orderBy: { startDate: 'desc' },
        include: {
          _count: { select: { donations: true } },
        },
      });
    }

    // Map cycles with parsed levels
    const cycles = rawCycles.map((c) => {
      const levels = parseLevels(c.description);
      const computedTarget = levels.reduce((sum, l) => sum + (l.target || 0), 0) || c.defaultTarget || 1200;
      return {
        ...c,
        defaultTarget: computedTarget,
        levels,
      };
    });

    const currentCycle = cycles.find((c) => c.isCurrent) || cycles[0];
    const targetCycleId = cycleId && cycleId !== 'ALL' ? cycleId : currentCycle?.id;
    const selectedCycleObj = cycles.find((c) => c.id === targetCycleId) || currentCycle;

    // 2. If specific alumnus requested:
    if (alumniId) {
      const alumnus = await prisma.alumni.findUnique({
        where: { id: alumniId },
        select: {
          id: true,
          name: true,
          admissionNumber: true,
          zoneName: true,
          photoUrl: true,
          phone: true,
          passoutBatchYear: true,
        },
      });

      // Fetch all donations for this alumnus
      const alumniDonations = await prisma.alumniDonation.findMany({
        where: { alumniId },
        include: {
          cycle: true,
          payments: { orderBy: { paymentDate: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      });

      let activeDonation = alumniDonations.find((d) => d.cycleId === currentCycle?.id);

      // If alumnus does not have an active donation record yet, auto-create one with default target
      if (!activeDonation && alumnus && currentCycle) {
        const cycleLevels = currentCycle.levels || parseLevels(currentCycle.description);
        const targetAmount = currentCycle.defaultTarget || 1200;

        activeDonation = await prisma.alumniDonation.create({
          data: {
            alumniId: alumnus.id,
            admissionNumber: alumnus.admissionNumber,
            alumniName: alumnus.name,
            cycleId: currentCycle.id,
            targetAmount,
            paidAmount: 0,
            balanceAmount: targetAmount,
            status: 'PENDING',
          },
          include: {
            cycle: true,
            payments: true,
          },
        });
      }

      // Map donations with level breakdowns
      const mappedDonations = alumniDonations.map((d) => {
        const c = cycles.find((cy) => cy.id === d.cycleId) || d.cycle;
        const levels = parseLevels(c?.description || null);
        const targetAmount = d.targetAmount || c?.defaultTarget || 1200;
        const paidAmount = d.paidAmount || 0;
        const balanceAmount = Math.max(0, targetAmount - paidAmount);
        const isCompleted = paidAmount >= targetAmount;
        const isPartial = paidAmount > 0 && !isCompleted;
        const status = isCompleted ? 'COMPLETED' : isPartial ? 'PARTIAL' : 'PENDING';
        const levelsBreakdown = computeLevelBreakdown(levels, d.payments || [], paidAmount);

        return {
          ...d,
          targetAmount,
          paidAmount,
          balanceAmount,
          status,
          levelsBreakdown,
          alumni: alumnus,
        };
      });

      let alumnusCurrentMetrics = null;
      if (activeDonation && currentCycle) {
        const cycleLevels = currentCycle.levels || parseLevels(currentCycle.description);
        const target = activeDonation.targetAmount || currentCycle.defaultTarget || 1200;
        const paid = activeDonation.paidAmount || 0;
        const balance = Math.max(0, target - paid);
        const progressPercent = Math.min(100, Math.round((paid / (target || 1)) * 100));
        const levelsBreakdown = computeLevelBreakdown(cycleLevels, activeDonation.payments || [], paid);
        const isCompleted = paid >= target;
        const isPartial = paid > 0 && !isCompleted;
        const status = isCompleted ? 'COMPLETED' : isPartial ? 'PARTIAL' : 'PENDING';

        alumnusCurrentMetrics = {
          donationId: activeDonation.id,
          cycleId: currentCycle.id,
          cycleLabel: currentCycle.label,
          targetAmount: target,
          paidAmount: paid,
          balanceAmount: balance,
          progressPercent,
          status,
          lastPaymentDate: activeDonation.lastPaymentDate,
          receiptNumber: activeDonation.receiptNumber,
          levelsBreakdown,
        };
      }

      return NextResponse.json({
        success: true,
        cycles,
        currentCycle,
        donations: mappedDonations,
        alumnusCurrentMetrics,
        totalCount: mappedDonations.length,
      });
    }

    // 3. For Admin View (returns ALL alumni with their payment status & breakdown):
    const allAlumni = await prisma.alumni.findMany({
      select: {
        id: true,
        name: true,
        admissionNumber: true,
        zoneName: true,
        photoUrl: true,
        phone: true,
        passoutBatchYear: true,
      },
      orderBy: { admissionNumber: 'asc' },
    });

    // Fetch existing donations for this cycle (or all cycles)
    const existingDonations = await prisma.alumniDonation.findMany({
      where: targetCycleId ? { cycleId: targetCycleId } : {},
      include: {
        cycle: true,
        payments: { orderBy: { paymentDate: 'desc' } },
        alumni: {
          select: {
            name: true,
            admissionNumber: true,
            zoneName: true,
            photoUrl: true,
            phone: true,
            passoutBatchYear: true,
          },
        },
      },
    });

    const donationByAlumniId = new Map<string, any>();
    existingDonations.forEach((d) => {
      donationByAlumniId.set(d.alumniId, d);
    });

    const activeCycleLevels = selectedCycleObj?.levels || parseLevels(selectedCycleObj?.description || null);
    const cycleDefaultTarget = selectedCycleObj?.defaultTarget || 1200;

    // Combine all alumni so that EVERY alumnus is represented
    const combinedDonations = allAlumni.map((alm) => {
      const existing = donationByAlumniId.get(alm.id);

      if (existing) {
        const c = existing.cycle || selectedCycleObj;
        const levels = parseLevels(c?.description || null);
        const targetAmount = existing.targetAmount || c?.defaultTarget || cycleDefaultTarget;
        const paidAmount = existing.paidAmount || 0;
        const balanceAmount = Math.max(0, targetAmount - paidAmount);
        const isCompleted = paidAmount >= targetAmount;
        const isPartial = paidAmount > 0 && !isCompleted;
        const status = isCompleted ? 'COMPLETED' : isPartial ? 'PARTIAL' : 'PENDING';
        const levelsBreakdown = computeLevelBreakdown(levels, existing.payments || [], paidAmount);

        return {
          ...existing,
          targetAmount,
          paidAmount,
          balanceAmount,
          status,
          levelsBreakdown,
          alumni: alm,
        };
      }

      // Virtual pending donation record for alumni without logged donation yet
      const levelsBreakdown = computeLevelBreakdown(activeCycleLevels, [], 0);
      return {
        id: `pending-${alm.id}-${targetCycleId || 'default'}`,
        alumniId: alm.id,
        admissionNumber: alm.admissionNumber,
        alumniName: alm.name,
        cycleId: targetCycleId || currentCycle.id,
        cycle: selectedCycleObj,
        targetAmount: cycleDefaultTarget,
        paidAmount: 0,
        balanceAmount: cycleDefaultTarget,
        status: 'PENDING',
        lastPaymentDate: null,
        paymentMethod: null,
        transactionRef: null,
        receiptNumber: null,
        notes: null,
        payments: [],
        levelsBreakdown,
        alumni: alm,
        isVirtual: true,
      };
    });

    // Calculate overall statistics
    const totalAlumniCount = allAlumni.length;
    const paidCount = combinedDonations.filter((d) => d.status === 'COMPLETED').length;
    const partialCount = combinedDonations.filter((d) => d.status === 'PARTIAL').length;
    const unpaidCount = combinedDonations.filter((d) => d.status === 'PENDING').length;
    const totalCollected = combinedDonations.reduce((sum, d) => sum + (d.paidAmount || 0), 0);
    const totalTarget = combinedDonations.reduce((sum, d) => sum + (d.targetAmount || 0), 0);

    return NextResponse.json({
      success: true,
      cycles,
      currentCycle,
      selectedCycle: selectedCycleObj,
      donations: combinedDonations,
      stats: {
        totalAlumni: totalAlumniCount,
        paidCount,
        partialCount,
        unpaidCount,
        totalCollected,
        totalTarget,
      },
      totalCount: combinedDonations.length,
    });
  } catch (err: any) {
    console.error('Fetch Donations Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch donations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      alumniId,
      cycleId,
      amount,
      levelName = "Rabee'",
      paymentMethod = 'UPI',
      transactionRef,
      notes,
      paymentDate,
      recordedByName = 'Finance Controller',
    } = data;

    const numAmount = Number(amount);
    if (!alumniId || !cycleId || !numAmount || numAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid alumni, cycle, and payment amount (> 0) are required' },
        { status: 400 }
      );
    }

    const [alumni, cycle] = await Promise.all([
      prisma.alumni.findUnique({ where: { id: alumniId } }),
      prisma.alumniDonationCycle.findUnique({ where: { id: cycleId } }),
    ]);

    if (!alumni || !cycle) {
      return NextResponse.json({ error: 'Alumnus or Collection cycle not found' }, { status: 404 });
    }

    // 1. Fetch or create master AlumniDonation record
    let donation = await prisma.alumniDonation.findFirst({
      where: {
        alumniId: alumni.id,
        cycleId: cycle.id,
      },
      include: { payments: true },
    });

    const cycleLevels = parseLevels(cycle.description);
    const computedTarget = cycleLevels.reduce((s, l) => s + (l.target || 0), 0) || cycle.defaultTarget || 1200;
    const targetAmount = (donation?.targetAmount && donation.targetAmount !== 3000) ? donation.targetAmount : computedTarget;

    const currentPaid = donation?.paidAmount || 0;
    const newPaid = currentPaid + numAmount;
    const newBalance = Math.max(0, targetAmount - newPaid);
    const newStatus = newPaid >= targetAmount ? 'COMPLETED' : newPaid > 0 ? 'PARTIAL' : 'PENDING';

    const cleanReceiptNumber = `DHDC-IFLAH-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const effectiveDate = paymentDate ? new Date(paymentDate) : new Date();

    // Format notes to include level attribution: [Level: Rabee']
    const taggedNotes = levelName ? `[Level: ${levelName}] ${notes || ''}`.trim() : notes || null;

    if (!donation) {
      donation = await prisma.alumniDonation.create({
        data: {
          alumniId: alumni.id,
          admissionNumber: alumni.admissionNumber,
          alumniName: alumni.name,
          cycleId: cycle.id,
          targetAmount,
          paidAmount: newPaid,
          balanceAmount: newBalance,
          status: newStatus,
          lastPaymentDate: effectiveDate,
          paymentMethod,
          transactionRef: transactionRef || null,
          receiptNumber: cleanReceiptNumber,
          notes: taggedNotes,
          recordedByName,
        },
        include: { payments: true },
      });
    } else {
      donation = await prisma.alumniDonation.update({
        where: { id: donation.id },
        data: {
          targetAmount,
          paidAmount: newPaid,
          balanceAmount: newBalance,
          status: newStatus,
          lastPaymentDate: effectiveDate,
          paymentMethod,
          transactionRef: transactionRef || donation.transactionRef,
          receiptNumber: donation.receiptNumber || cleanReceiptNumber,
          notes: taggedNotes,
          recordedByName,
        },
        include: { payments: true },
      });
    }

    // 2. Create payment record
    const payment = await prisma.alumniPaymentRecord.create({
      data: {
        donationId: donation.id,
        amount: numAmount,
        paymentDate: effectiveDate,
        paymentMethod,
        transactionRef: transactionRef || null,
        receiptNumber: cleanReceiptNumber,
        notes: taggedNotes,
        recordedByName,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Payment of ₹${numAmount} for ${levelName} successfully recorded!`,
      donation,
      payment,
      receiptNumber: cleanReceiptNumber,
    });
  } catch (err: any) {
    console.error('Record Payment Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to record payment' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      paymentId,
      donationId,
      amount,
      levelName,
      paymentMethod,
      transactionRef,
      notes,
      paymentDate,
      targetAmount,
    } = data;

    // A) Edit individual payment record
    if (paymentId) {
      const existingPayment = await prisma.alumniPaymentRecord.findUnique({
        where: { id: paymentId },
        include: { donation: { include: { payments: true, cycle: true } } },
      });

      if (!existingPayment) {
        return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
      }

      const numAmount = amount !== undefined ? Number(amount) : existingPayment.amount;
      if (numAmount <= 0) {
        return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
      }

      // Update notes with level if provided
      let updatedNotes = existingPayment.notes || '';
      if (levelName !== undefined) {
        // Replace or add [Level: ...]
        const cleanOld = updatedNotes.replace(/\[Level:\s*[^\]]+\]/i, '').trim();
        updatedNotes = levelName ? `[Level: ${levelName}] ${notes !== undefined ? notes : cleanOld}`.trim() : notes || '';
      } else if (notes !== undefined) {
        updatedNotes = notes;
      }

      const updatedPayment = await prisma.alumniPaymentRecord.update({
        where: { id: paymentId },
        data: {
          amount: numAmount,
          paymentMethod: paymentMethod || existingPayment.paymentMethod,
          transactionRef: transactionRef !== undefined ? transactionRef : existingPayment.transactionRef,
          notes: updatedNotes,
          paymentDate: paymentDate ? new Date(paymentDate) : existingPayment.paymentDate,
        },
      });

      // Recalculate parent donation
      const allPayments = await prisma.alumniPaymentRecord.findMany({
        where: { donationId: existingPayment.donationId },
      });

      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
      const donationTarget = existingPayment.donation.targetAmount || 1200;
      const newBalance = Math.max(0, donationTarget - totalPaid);
      const newStatus = totalPaid >= donationTarget ? 'COMPLETED' : totalPaid > 0 ? 'PARTIAL' : 'PENDING';

      const updatedDonation = await prisma.alumniDonation.update({
        where: { id: existingPayment.donationId },
        data: {
          paidAmount: totalPaid,
          balanceAmount: newBalance,
          status: newStatus,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Payment updated successfully!',
        payment: updatedPayment,
        donation: updatedDonation,
      });
    }

    // B) Edit master donation (e.g. adjust target amount or notes)
    if (donationId) {
      const existing = await prisma.alumniDonation.findUnique({
        where: { id: donationId },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Donation record not found' }, { status: 404 });
      }

      const newTarget = targetAmount !== undefined ? Number(targetAmount) : existing.targetAmount;
      const newBalance = Math.max(0, newTarget - existing.paidAmount);
      const newStatus = existing.paidAmount >= newTarget ? 'COMPLETED' : existing.paidAmount > 0 ? 'PARTIAL' : 'PENDING';

      const updated = await prisma.alumniDonation.update({
        where: { id: donationId },
        data: {
          targetAmount: newTarget,
          balanceAmount: newBalance,
          status: newStatus,
          notes: notes !== undefined ? notes : existing.notes,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Donation record updated successfully!',
        donation: updated,
      });
    }

    return NextResponse.json({ error: 'Either paymentId or donationId is required' }, { status: 400 });
  } catch (err: any) {
    console.error('Update Payment Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to update payment' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('paymentId');
    const donationId = searchParams.get('donationId');

    // 1. Delete specific payment
    if (paymentId) {
      const payment = await prisma.alumniPaymentRecord.findUnique({
        where: { id: paymentId },
        include: { donation: true },
      });

      if (!payment) {
        return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
      }

      const pDonationId = payment.donationId;
      await prisma.alumniPaymentRecord.delete({ where: { id: paymentId } });

      // Recalculate parent donation
      const remainingPayments = await prisma.alumniPaymentRecord.findMany({
        where: { donationId: pDonationId },
        orderBy: { paymentDate: 'desc' },
      });

      const totalPaid = remainingPayments.reduce((s, p) => s + p.amount, 0);
      const targetAmount = payment.donation.targetAmount || 1200;
      const balanceAmount = Math.max(0, targetAmount - totalPaid);
      const status = totalPaid >= targetAmount ? 'COMPLETED' : totalPaid > 0 ? 'PARTIAL' : 'PENDING';
      const lastPayment = remainingPayments[0];

      const updatedDonation = await prisma.alumniDonation.update({
        where: { id: pDonationId },
        data: {
          paidAmount: totalPaid,
          balanceAmount,
          status,
          lastPaymentDate: lastPayment ? lastPayment.paymentDate : null,
          receiptNumber: lastPayment ? lastPayment.receiptNumber : null,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Payment of ₹${payment.amount} deleted successfully!`,
        donation: updatedDonation,
      });
    }

    // 2. Delete entire donation record and reset
    if (donationId) {
      await prisma.alumniPaymentRecord.deleteMany({ where: { donationId } });
      await prisma.alumniDonation.delete({ where: { id: donationId } });

      return NextResponse.json({
        success: true,
        message: 'Donation record and all associated payments deleted.',
      });
    }

    return NextResponse.json({ error: 'paymentId or donationId required for delete' }, { status: 400 });
  } catch (err: any) {
    console.error('Delete Payment Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to delete payment' }, { status: 500 });
  }
}
