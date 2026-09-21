import { NextRequest, NextResponse } from 'next/server';

const MASTER_PASSWORD = process.env['SAAS_MASTER_PASSWORD'] || 'master2026';
const MASTER_SECRET = process.env['SAAS_MASTER_KEY'] || 'master_saas_antigravity_2026';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password || password.trim() !== MASTER_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Senha mestra incorreta.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        token: MASTER_SECRET,
      },
    });

    // Grava cookie para facilitar navegação no painel
    response.cookies.set('saas_token', MASTER_SECRET, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro no servidor: ' + String(error) },
      { status: 500 }
    );
  }
}
