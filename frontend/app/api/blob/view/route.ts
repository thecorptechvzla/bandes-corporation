import { get } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const blobUrl = searchParams.get('url');

  if (!blobUrl) {
    return new NextResponse('URL no proporcionada', { status: 400 });
  }

  try {
    const blobResult = await get(blobUrl, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!blobResult) {
      return new NextResponse('Archivo no encontrado', { status: 404 });
    }

    if (blobResult.statusCode === 304) {
      return new NextResponse(null, { status: 304 });
    }

    return new NextResponse(blobResult.stream, {
      headers: {
        'Content-Type': blobResult.blob.contentType || 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[Blob Proxy Error]:', error);
    return new NextResponse('Error al recuperar la imagen privada', { status: 500 });
  }
}
