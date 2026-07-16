import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// POST /api/generate-report
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { okrGoal, okrProgress, condition, githubUsername, githubEvents } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY가 환경변수에 설정되지 않았습니다. .env.local 파일에 설정해주세요.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
당신은 직원의 하루 업무를 요약하고 칭찬해주는 전문적이고 긍정적인 HR 어시스턴트입니다.
아래 제공된 데이터를 바탕으로, 직원이 하루를 성공적으로 마무리했다는 느낌이 들도록 깔끔하게 요약된 성과 리포트를 작성해주세요.

[입력 데이터]
- 워케이션 목표: ${okrGoal} (현재 달성률: ${okrProgress}%)
- 오늘의 컨디션: ${condition} (😊: 최상, 😐: 보통, 😫: 지침)
- 연동된 GitHub 아이디: ${githubUsername}
- 오늘 수행한 깃허브 주요 활동 (최대 10개 이벤트):
${githubEvents.map((e: any, i: number) => `${i + 1}. [${e.type}] 레포지토리: ${e.repo.name}`).join('\n')}

[작성 가이드라인]
1. 단순한 나열이 아닌 부드러운 구어체(해요체/하십시오체)로 작성할 것.
2. 깃허브 활동 내역이 있다면 '실제로 어떤 레포지토리에서 푸시(또는 PR) 활동이 있었는지' 언급하며 딥워크 성과를 인정해줄 것.
3. 만약 깃허브 활동 내역이 비어있다면, "오늘은 깃허브 활동 대신 다른 핵심 업무(목표 달성)에 집중하신 것 같네요!"라고 긍정적으로 커버해줄 것.
4. 컨디션과 목표 달성률을 종합하여 내일의 워케이션도 응원하는 멘트로 마무리할 것.
5. 마크다운 양식을 사용하여 가독성을 높일 것 (예: 볼드체, 이모지 사용 등).
6. 글은 300자 내외로 간결하게 작성할 것.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ report: text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: '보고서 생성 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
