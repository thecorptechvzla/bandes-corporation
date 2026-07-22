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
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error('[BLOB] Upload error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'Error al subir la imagen' },
      { status: 500 },
    );
  }
}
