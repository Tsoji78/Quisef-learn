// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary'; // Adjust path to your Cloudinary config

export async function POST(request: Request) {
  try {
    // Optional: Verify authentication token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type and size
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/mov'];
    const maxSize = file.type.startsWith('image/') ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for images, 10MB for videos
    if (![...validImageTypes, ...validVideoTypes].includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` }, { status: 400 });
    }

    // Upload to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: file.type.startsWith('image/') ? 'image' : 'video' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({ url: (uploadResult as any).secure_url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}