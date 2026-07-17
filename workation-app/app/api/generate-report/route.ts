import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// POST /api/generate-report
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workationGoals, notionLogs, tasks, condition, githubUsername, githubEvents } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY가 환경변수에 설정되지 않았습니다. .env.local 파일에 설정해주세요.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `
당신은 기업의 인사(HR) 및 성과 평가를 담당하는 전문적이고 분석적인 AI 어시스턴트입니다.
사용자가 제출한 데이터(초기 목표, 당일 태스크, 노션/깃허브 활동 로그)를 바탕으로 데이터 기반의 객관적이고 가독성이 뛰어난 성과 리포트를 작성해주세요.

[입력 데이터]
- 이번 워케이션 핵심 목표: ${workationGoals && workationGoals.length > 0 ? workationGoals.join(', ') : '없음'}
- 오늘의 세부 태스크 현황:
${tasks.map((t: any, i: number) => `  ${i + 1}. ${t.title} (완료율: ${t.progress}%)${t.comment ? ` - 코멘트: ${t.comment}` : ''}`).join('\n')}
- 오늘의 컨디션: ${condition}
- 실시간 노션(Notion) 문서 작업 기록 (수정 내역):
${notionLogs && notionLogs.length > 0 ? notionLogs.join('\n') : '  노션 연동 기록 없음'}
- 실시간 깃허브(GitHub) 활동 기록 (최대 10건):
${githubEvents && githubEvents.length > 0 ? githubEvents.map((e: any, i: number) => `  ${i + 1}. [${e.type}] ${e.repo.name}`).join('\n') : '  깃허브 연동 기록 없음'}

[출력 양식 및 필수 지시사항]
1. 반드시 마크다운(Markdown) 형식을 사용하여 보고서를 작성하십시오. 줄글 형태의 긴 서술형은 피하고, 표(Table)와 요약 글머리 기호(Bullet points)를 적극 활용하세요.
2. [핵심 지표] 섹션에서 "목표 달성률 (%)"을 반드시 계산해서 눈에 띄게(볼드체 등) 출력하십시오. (입력된 목표와 실제 활동 내역, 태스크 달성률을 종합적으로 평가하여 AI가 0~100% 사이로 객관적 판단)
3. [활동 분석] 섹션에서 노션과 깃허브 기록이 초기 목표 달성에 어떻게 기여했는지 분석해주세요. (예: 마케팅 목표였는데 노션에 마케팅 기획안이 수정된 기록이 있으면 성과 인정)
4. 어조는 전문적이고 객관적이되, 마무리 [총평 및 코멘트]에서는 긍정적이고 동기부여가 되는 피드백을 제공하세요.
5. 분량은 가독성을 위해 간결하게 작성하되 데이터 시각화(표)에 집중해주세요.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ report: text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    
    let availableModels = '조회 실패';
    try {
      const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        if (modelsData.models) {
          availableModels = modelsData.models.map((m: any) => m.name.replace('models/', '')).join(', ');
        }
      }
    } catch (e) {
      console.error('Failed to fetch models list', e);
    }

    return NextResponse.json(
      { 
        error: '보고서 생성 중 오류가 발생했습니다.', 
        details: `${error.message}\n\n[현재 API 키로 사용 가능한 모델 목록]\n${availableModels}` 
      },
      { status: 500 }
    );
  }
}
