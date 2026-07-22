import { get } from '@vercel/blob';
import { NextResponse } from 'next/server';

const TIMEOUT_MS = 8_000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL requerida' }, { status: 400 });

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);

  try {
    const result = await get(url, { access: 'private', abortSignal: ac.signal });
    clearTimeout(timer);

    if (!result) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
    }

    if (result.statusCode === 304) {
      return new NextResponse(null, { status: 304 });
    }

    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    clearTimeout(timer);

    const isTimeout = error instanceof Error && error.name === 'AbortError';

    if (isTimeout) {
      console.error(`[Blob View Error] TIMEOUT tras ${TIMEOUT_MS}ms al conectar con Vercel Blob:`, url);
    } else {
      console.error('[Blob View Error] FETCH_FAILED:', error);
    }

    return NextResponse.json(
      {
        error: isTimeout
          ? 'El servidor de archivos no respondió a tiempo'
          : 'Archivo no encontrado o acceso denegado',
      },
      { status: isTimeout ? 504 : 404 },
    );
  }
}
