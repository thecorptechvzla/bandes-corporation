import { head } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL requerida' }, { status: 400 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ error: 'Token no configurado' }, { status: 500 });

  try {
    const blob = await head(url, { token });
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Error al obtener el archivo');

    const data = await response.arrayBuffer();
    return new NextResponse(data, {
      headers: {
        'Content-Type': blob.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[Blob View Error]:', error);
    return NextResponse.json({ error: 'Archivo no encontrado o acceso denegado' }, { status: 404 });
  }
}
