import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI || 'http://localhost:3000/api/auth/slack/callback';
  
  if (!clientId) {
    return new NextResponse('SLACK_CLIENT_ID is not configured in environment variables.', { status: 500 });
  }

  // Slack OAuth Authorization URL (user_scope for search:read)
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&user_scope=search:read&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(authUrl);
}
