import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // 노션 검색 API를 통해 오늘 수정된 페이지들을 가져옵니다.
    // 참고: 노션 API는 검색 시 해당 토큰(유저)이 접근 가능한(공유된) 페이지만 검색합니다.
    const response = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          value: 'page',
          property: 'object'
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time'
        },
        page_size: 10
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to fetch Notion data');
    }

    const data = await response.json();
    
    // 오늘 날짜 필터링 (UTC 기준)
    const today = new Date().toISOString().split('T')[0];
    
    const pages = data.results
      .filter((page: any) => page.last_edited_time.startsWith(today))
      .map((page: any) => {
        // 타이틀 속성 찾기 (보통 'title' 또는 첫 번째 title 타입 속성)
        let title = '제목 없음';
        if (page.properties) {
          for (const key in page.properties) {
            if (page.properties[key].type === 'title') {
              const titleArr = page.properties[key].title;
              if (titleArr && titleArr.length > 0) {
                title = titleArr.map((t: any) => t.plain_text).join('');
              }
              break;
            }
          }
        }
        return {
          id: page.id,
          title: title,
          last_edited_time: page.last_edited_time,
          url: page.url
        };
      });

    return NextResponse.json({ pages });
  } catch (error: any) {
    console.error('Notion API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
