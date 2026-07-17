import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // 슬랙 search.messages API 호출 (from:me)
    const response = await fetch('https://slack.com/api/search.messages?query=from:me&sort=timestamp&sort_dir=desc&count=20', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error || 'Failed to fetch Slack data');
    }

    // 최근 24시간 이내의 메시지만 필터링
    const oneDayAgo = (Date.now() / 1000) - (24 * 60 * 60);
    const messages = data.messages?.matches || [];
    
    const logs = messages
      .filter((m: any) => parseFloat(m.ts) >= oneDayAgo)
      .map((m: any) => {
        // 한국 시간(KST)으로 변환하여 시간 문자열 포맷팅
        const date = new Date(parseFloat(m.ts) * 1000);
        date.setHours(date.getHours() + 9); // UTC to KST
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const timeStr = `[${hours}:${minutes}]`;
        
        // 프라이버시 보호를 위해 메시지 본문은 제거하고 채널명만 추출
        const channelName = m.channel?.name ? `#${m.channel.name}` : '슬랙';
        return `${timeStr} ${channelName} 채널에서 업무 소통 진행`;
      });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Slack API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
