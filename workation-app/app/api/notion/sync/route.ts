import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { quest, insight, location } = body

    // TODO: 실제 Notion API 연동 로직
    // 대표님의 노션 데이터베이스 ID와 Secret 토큰을 환경 변수에서 가져와 
    // @notionhq/client 패키지로 페이지를 생성합니다.
    
    // 현재는 도쿄 워케이션 테스트를 위한 Mock(가짜) 응답을 반환합니다.
    const mockResponse = {
      success: true,
      message: '노션 워크스페이스에 성공적으로 동기화되었습니다.',
      syncedData: {
        title: `[Tokyo 워케이션] ${location || '거점'} 인사이트 기록`,
        content: quest,
        timestamp: new Date().toISOString()
      }
    }

    // 통신 시뮬레이션을 위한 1초 대기
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json(mockResponse)
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '노션 연동 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    )
  }
}
