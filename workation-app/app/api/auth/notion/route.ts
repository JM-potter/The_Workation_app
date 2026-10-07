import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';

export async function GET(request: Request) {
  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = process.env.NOTION_REDIRECT_URI || 'http://localhost:3000/api/auth/notion/callback';
  
  if (!clientId) {
    return new NextResponse('NOTION_CLIENT_ID is not configured in environment variables.', { status: 500 });
  }

  // Notion OAuth Authorization URL
  const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`;

  const state=randomBytes(32).toString('hex');
  const url=new URL(authUrl);url.searchParams.set('state',state);
  const response=NextResponse.redirect(url);
  response.cookies.set('legacy_notion_state',state,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/api/auth/notion',maxAge:600});
  return response;
}
