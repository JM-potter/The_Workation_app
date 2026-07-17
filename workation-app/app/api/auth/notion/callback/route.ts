import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return new NextResponse(`Error from Notion: ${error}`, { status: 400 });
  }

  if (!code) {
    return new NextResponse('No code provided', { status: 400 });
  }

  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  const redirectUri = process.env.NOTION_REDIRECT_URI || 'http://localhost:3000/api/auth/notion/callback';

  if (!clientId || !clientSecret) {
    return new NextResponse('Notion credentials are not configured.', { status: 500 });
  }

  try {
    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${encoded}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || data.error || 'Failed to fetch token');
    }

    const accessToken = data.access_token;

    // MVP 방식: 팝업 창에서 부모 창(마이 워케이션 화면)으로 토큰을 전달하고 창을 닫음
    // 실무에서는 이 토큰을 DB에 저장해야 하지만, 보안과 자율성을 위해 localStorage 방식을 씁니다.
    const html = `
      <html>
        <body>
          <script>
            // 부모 창으로 토큰 전달
            window.opener.postMessage({ type: 'NOTION_AUTH_SUCCESS', token: '${accessToken}' }, '*');
            // 팝업 닫기
            window.close();
          </script>
          <p>인증이 완료되었습니다. 이 창이 닫히지 않으면 수동으로 닫아주세요.</p>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error: any) {
    console.error('Notion OAuth error:', error);
    return new NextResponse(`Authentication failed: ${error.message}`, { status: 500 });
  }
}
