import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NODE_ENV === 'development'
  ? 'http://127.0.0.1:3001'
  : (process.env.BACKEND_URL || 'http://127.0.0.1:3001');
const TIMEOUT_MS = 15_000;

async function proxy(request: NextRequest, params: { path: string[] }, method: string) {
  const path = params.path.join('/');
  const qs = request.nextUrl.search;
  const target = `${BACKEND_URL}/api/${path}${qs}`;

  try {
    const headers: Record<string, string> = {};
    request.headers.forEach((v, k) => {
      if (k !== 'host' && k !== 'connection') headers[k] = v;
    });

    const body = method === 'GET' || method === 'HEAD' ? undefined : await request.text();

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);

    const upstream = await fetch(target, { method, headers, body, signal: ac.signal });
    clearTimeout(timer);

    const text = await upstream.text();

    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' },
    });
  } catch (err: unknown) {
    console.error(`[API] Proxy error ${method} /api/${path}:`, err);
    return NextResponse.json(
      { error: 'Backend inalcanzable', detail: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params, 'GET');
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params, 'POST');
}
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params, 'PATCH');
}
export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params, 'PUT');
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params, 'DELETE');
}
