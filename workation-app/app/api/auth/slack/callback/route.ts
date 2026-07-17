import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return new NextResponse(`Error from Slack: ${error}`, { status: 400 });
  }

  if (!code) {
    return new NextResponse('No code provided', { status: 400 });
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = process.env.SLACK_REDIRECT_URI || 'http://localhost:3000/api/auth/slack/callback';

  if (!clientId || !clientSecret) {
    return new NextResponse('Slack credentials are not configured.', { status: 500 });
  }

  try {
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || 'Failed to fetch token');
    }

    // Since we requested user_scope, the token we want is in data.authed_user.access_token
    const accessToken = data.authed_user?.access_token;

    if (!accessToken) {
      throw new Error('Access token not found in response');
    }

    // MVP 방식: 팝업 창에서 부모 창(마이 워케이션 화면)으로 토큰을 전달하고 창을 닫음
    const html = `
      <html>
        <body>
          <script>
            // 부모 창으로 토큰 전달
            window.opener.postMessage({ type: 'SLACK_AUTH_SUCCESS', token: '${accessToken}' }, '*');
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
    console.error('Slack OAuth error:', error);
    return new NextResponse(`Authentication failed: ${error.message}`, { status: 500 });
  }
}
