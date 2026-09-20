import { NextRequest, NextResponse } from 'next/server';
import { BackendEngine } from '@/backend/engine';

// Singleton in-memory para desenvolvimento local e ambiente sem URL remota
const globalEngine = new BackendEngine();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'store';
  const categoryId = searchParams.get('categoryId') || undefined;

  const remoteUrl = process.env['APPS_SCRIPT_URL'];
  if (remoteUrl) {
    try {
      const url = new URL(remoteUrl);
      url.searchParams.set('action', action);
      if (categoryId) url.searchParams.set('categoryId', categoryId);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        redirect: 'follow',
      });
      const data = await response.json();
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'GATEWAY_ERROR', message: String(err) },
        },
        { status: 502 }
      );
    }
  }

  // Fallback para engine local integrado
  const localResult = globalEngine.doGet({ action, categoryId });
  return NextResponse.json(localResult);
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const remoteUrl = process.env['APPS_SCRIPT_URL'];
    if (remoteUrl) {
      const response = await fetch(remoteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });
      const data = await response.json();
      return NextResponse.json(data);
    }

    // Fallback para engine local integrado
    const localResult = globalEngine.doPost(payload);
    return NextResponse.json(localResult);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: 'INVALID_PAYLOAD', message: 'Erro ao processar corpo da requisição: ' + String(err) },
      },
      { status: 400 }
    );
  }
}
