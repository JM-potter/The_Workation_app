import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = process.env.NOTION_REDIRECT_URI || 'http://localhost:3000/api/auth/notion/callback';
  
  if (!clientId) {
    return new NextResponse('NOTION_CLIENT_ID is not configured in environment variables.', { status: 500 });
  }

  // Notion OAuth Authorization URL
  const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(authUrl);
}
