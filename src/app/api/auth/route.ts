import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const cleanIdentifier = String(username || '').trim();
    const cleanPassword = String(password || '').trim();

    if (!cleanIdentifier) {
      return NextResponse.json({ error: 'Username or Admission Number is required' }, { status: 400 });
    }

    const cleanIdNoDot = cleanIdentifier.replace(/\.0$/, '');

    // 1. Search in User table
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanIdentifier, mode: 'insensitive' } },
          { username: { equals: cleanIdNoDot, mode: 'insensitive' } },
          { admissionNumber: { equals: cleanIdentifier, mode: 'insensitive' } },
          { admissionNumber: { equals: cleanIdNoDot, mode: 'insensitive' } },
          { email: { equals: cleanIdentifier, mode: 'insensitive' } },
        ],
      },
    });

    // Reject student logins immediately - portal is strictly for Alumni & Admin
    if (user && user.role === 'student') {
      return NextResponse.json(
        { error: 'Student login is disabled. This portal is exclusively for Alumni and Administrators.' },
        { status: 403 }
      );
    }

    if (user && user.role !== 'alumni' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Access restricted. This portal is exclusively for Alumni and Administrators.' },
        { status: 403 }
      );
    }

    // 2. If user not in User table, check if exists in Alumni table
    let alumni = null;
    if (user?.alumniId) {
      alumni = await prisma.alumni.findUnique({
        where: { id: user.alumniId },
        include: { zone: true },
      });
    }

    if (!alumni) {
      alumni = await prisma.alumni.findFirst({
        where: {
          OR: [
            { admissionNumber: { equals: cleanIdentifier, mode: 'insensitive' } },
            { admissionNumber: { equals: cleanIdNoDot, mode: 'insensitive' } },
            { email: { equals: cleanIdentifier, mode: 'insensitive' } },
          ],
        },
        include: { zone: true },
      });
    }

    // Auto-create User account if alumnus exists without a User entry
    if (alumni && !user) {
      const cleanAdm = String(alumni.admissionNumber || '').replace(/\.0$/, '').trim();
      const defaultPass = `${cleanAdm}${cleanAdm}${cleanAdm}`;
      try {
        user = await prisma.user.create({
          data: {
            id: `user-alumni-${alumni.id}`,
            username: cleanAdm || `alumni-${alumni.id}`,
            admissionNumber: cleanAdm,
            role: 'alumni',
            name: alumni.name,
            email: alumni.email,
            phone: alumni.phone,
            alumniId: alumni.id,
            status: 'active',
            password: defaultPass,
          },
        });
        // Link back to alumni
        await prisma.alumni.update({
          where: { id: alumni.id },
          data: { userId: user.id },
        });
      } catch (createErr) {
        console.warn('Auto-create User for alumni warn:', createErr);
      }
    }

    // If still no user found, return error
    if (!user) {
      return NextResponse.json({ error: 'User or Alumni record not found with this ID' }, { status: 404 });
    }

    // If password is provided, verify it (unless empty / first-time bypass)
    if (cleanPassword && user.password) {
      const isPlainMatch = user.password === cleanPassword;
      let isBcryptMatch = false;
      try {
        if (!isPlainMatch && user.password.startsWith('$2')) {
          isBcryptMatch = await bcrypt.compare(cleanPassword, user.password);
        }
      } catch {
        isBcryptMatch = false;
      }

      // Also allow admission number repeat default for alumni/students
      const admRep3 = user.admissionNumber ? `${user.admissionNumber}${user.admissionNumber}${user.admissionNumber}` : '';
      const isDefaultAdmPass = admRep3 && cleanPassword === admRep3;

      if (!isPlainMatch && !isBcryptMatch && !isDefaultAdmPass) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
    }

    // Strip password before returning
    const safeUser = { ...user };
    delete safeUser.password;

    return NextResponse.json({
      success: true,
      user: safeUser,
      alumni,
    });
  } catch (err: any) {
    console.error('Auth API Error:', err);
    return NextResponse.json({ error: err?.message || 'Server authentication error' }, { status: 500 });
  }
}
