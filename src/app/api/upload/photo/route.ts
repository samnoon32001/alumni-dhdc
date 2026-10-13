import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let base64Data = '';
    let fileName = '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      base64Data = body.dataUrl || body.image || '';
      fileName = body.fileName || `avatar_${Date.now()}`;
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;
        fileName = file.name || `avatar_${Date.now()}`;
      }
    }

    if (!base64Data) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    // Try saving locally to public/uploads/avatars/
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Extract raw base64 string
      const matches = base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      let ext = 'jpg';
      let buffer: Buffer;

      if (matches && matches.length === 3) {
        const mimeSub = matches[1].toLowerCase();
        if (mimeSub.includes('png')) ext = 'png';
        else if (mimeSub.includes('webp')) ext = 'webp';
        else ext = 'jpg';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(base64Data, 'base64');
      }

      const safeName = `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/avatars/${safeName}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        fileName: safeName,
      });
    } catch (fsErr) {
      console.warn('Could not write avatar to disk, using dataUrl fallback:', fsErr);
      // Seamless fallback to base64 if filesystem write is restricted
      return NextResponse.json({
        success: true,
        url: base64Data,
        fallback: true,
      });
    }
  } catch (err: any) {
    console.error('Avatar upload error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to upload photo' }, { status: 500 });
  }
}
