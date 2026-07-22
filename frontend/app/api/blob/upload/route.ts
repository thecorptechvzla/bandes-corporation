import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    const blob = await put(`packing-photos/${Date.now()}-${file.name}`, file, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error: any) {
    console.error('[Vercel Blob Upload Error]:', error.message || error);
    return NextResponse.json(
      { error: 'Error al subir a Vercel Blob', details: error.message },
      { status: 500 },
    );
  }
}
