// 창업 트렌드를 주제로 매 실행마다 소재를 바꿔가며 글감을 만든다.
const TOPICS = [
  "2026년 주목해야 할 창업 트렌드",
  "1인 창업자가 주목할 만한 최신 비즈니스 모델",
  "AI를 활용한 스타트업 창업 아이템",
  "소자본 창업 트렌드와 성공 전략",
  "MZ세대가 이끄는 신규 창업 트렌드",
  "정부 지원사업으로 보는 유망 창업 분야",
  "구독경제와 창업 트렌드의 변화",
  "친환경·ESG 기반 창업 아이템 트렌드",
  "온라인 플랫폼 창업의 최신 흐름",
  "프랜차이즈 창업 시장의 최신 동향",
];

// 날짜를 시드로 사용해 매일 다른(하지만 재현 가능한) 주제를 순환 선택한다.
export function pickTopic(date = new Date()) {
  const dayIndex = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  return TOPICS[dayIndex % TOPICS.length];
}

function fallbackTemplate(topic) {
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const paragraphs = [
    `안녕하세요, 오늘은 <b>${topic}</b>에 대해 이야기해보려 합니다.`,
    `창업 시장은 빠르게 변화하고 있으며, 트렌드를 미리 파악하는 것이 성공적인 창업의 첫걸음입니다.`,
    `최근에는 기술 발전과 소비자 행동 변화에 따라 새로운 형태의 비즈니스 모델이 계속해서 등장하고 있습니다.`,
    `예비 창업자라면 시장 조사, 자금 계획, 그리고 지속 가능한 운영 전략을 함께 고민해야 합니다.`,
    `오늘 소개해드린 ${topic} 관련 내용이 창업을 준비하는 분들께 작은 도움이 되었으면 합니다.`,
  ];

  return {
    title: `${topic} (${today})`,
    contents: paragraphs.join("<br><br>"),
  };
}

async function generateWithAnthropic(topic, apiKey) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            `네이버 블로그에 올릴 한국어 글을 작성해줘. 주제는 "${topic}".`,
            "조건:",
            "- 제목 한 줄과 본문을 구분해서 작성",
            "- 본문은 5~7개 문단, 각 문단은 3~5문장",
            "- 친근하고 신뢰감 있는 정보성 블로그 말투",
            "- 과장 광고성 표현, 특정 업체 홍보, 허위 정보 금지",
            "- 출력 형식은 반드시 아래 형태를 지킬 것:",
            "제목: <제목 텍스트>",
            "본문:",
            "<문단1>",
            "",
            "<문단2>",
            "...",
          ].join("\n"),
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API 오류 (status ${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data.content?.map((block) => block.text ?? "").join("\n") ?? "";

  const titleMatch = text.match(/제목\s*:\s*(.+)/);
  const bodyMatch = text.split(/본문\s*:/);

  const title = titleMatch ? titleMatch[1].trim() : topic;
  const bodyRaw = bodyMatch.length > 1 ? bodyMatch[1].trim() : text.trim();
  const contents = bodyRaw
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .join("<br><br>");

  return { title, contents: contents || bodyRaw };
}

export async function generatePost(topic = pickTopic()) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return fallbackTemplate(topic);
  }

  try {
    return await generateWithAnthropic(topic, apiKey);
  } catch (err) {
    console.error("[contentGenerator] Anthropic 생성 실패, 템플릿으로 대체합니다:", err.message);
    return fallbackTemplate(topic);
  }
}
