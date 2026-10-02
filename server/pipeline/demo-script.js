// DEMO_MODE=1 일 때 API 없이 화면 흐름을 체험할 수 있는 예시 대본
export const DEMO_SCRIPT = {
  title: "새벽 4시의 비누 공방",
  concept: "피부가 예민한 동생을 위해 시작한 비누가 브랜드가 되기까지",
  hook_options: [
    { type: "confession", narration: "첫 비누는 전부 버렸어요.", on_screen_text: "47개 전부 실패", why: "실패를 먼저 꺼내면 광고가 아니라 이야기로 들려 끝까지 보게 됩니다." },
    { type: "question", narration: "비누 하나에 왜 석 달이나 걸렸을까요?", on_screen_text: "비누 하나에 석 달?", why: "시청자가 속으로 답을 떠올리며 다음 장면을 기다리게 됩니다." },
    { type: "pain", narration: "세수만 하면 얼굴이 빨개지던 동생이 있었어요.", on_screen_text: "세수가 무서운 아이", why: "같은 고민을 가진 타깃이 바로 자기 이야기라고 느낍니다." },
  ],
  structure_notes: "실패 고백형 후킹으로 시작해 '왜 그렇게까지 했는지' 궁금하게 만들고, 동생이라는 구체적인 인물로 이유를 보여줍니다. 중간에 '그런데 진짜 문제는' 이라는 열린 고리로 이탈을 막고, 마지막 장면을 첫 장면의 실패와 연결해 다시 보기를 유도합니다.",
  visual_style: "warm morning light, soft film grain, muted beige and sage tones, handheld candid photography",
  voice_tone: "차분하고 따뜻한 20대 창업자, 친구에게 조용히 이야기하듯",
  scenes: [
    { role: "hook", narration: "첫 비누는 전부 버렸어요.", on_screen_text: "47개 전부 실패", media_id: "", image_prompt: "a pile of cracked handmade soap bars on a wooden table, early morning light", motion: "zoom_in", est_seconds: 3 },
    { role: "problem", narration: "세수만 하면 얼굴이 빨개지던 동생 때문에 시작했거든요.", on_screen_text: "동생을 위해", media_id: "", image_prompt: "a young girl washing her face at a small bathroom sink, seen from behind, soft daylight", motion: "pan_right", est_seconds: 5 },
    { role: "story", narration: "새벽 4시마다 부엌에서 성분을 하나씩 빼봤어요.", on_screen_text: "새벽 4시 부엌", media_id: "", image_prompt: "a home kitchen at dawn with glass jars, scale and soap molds, a single lamp on", motion: "zoom_out", est_seconds: 4.5 },
    { role: "turning_point", narration: "그런데 진짜 문제는 향료였어요. 다 빼니까 그제야 괜찮더라고요.", on_screen_text: "답은 '빼기'", media_id: "", image_prompt: "close-up of hands pouring plain white soap base into a mold, no fragrance bottles", motion: "zoom_in", est_seconds: 5.5 },
    { role: "value", narration: "그래서 저희 비누엔 향이 없어요. 대신 성분은 다섯 가지뿐이에요.", on_screen_text: "성분 5가지", media_id: "", image_prompt: "five simple natural ingredients arranged neatly next to a plain white soap bar", motion: "pan_left", est_seconds: 5 },
    { role: "cta", narration: "47번 버린 이유, 이제 아시겠죠? 피부 고민 있는 친구에게 보내주세요.", on_screen_text: "친구에게 공유", media_id: "", image_prompt: "a plain white soap bar wrapped in kraft paper held out toward the camera", motion: "zoom_out", est_seconds: 5 },
  ],
  caption: "첫 비누 47개를 전부 버렸어요.\n세수만 하면 빨개지던 동생 때문에 시작한 일이었어요.\n향을 빼고, 성분을 줄이고, 다시 만들었습니다.\n여러분은 어떤 피부 고민이 있나요?",
  hashtags: ["수제비누", "민감성피부", "브랜드스토리", "무향비누", "창업이야기", "학생창업"],
  authenticity_check: [
    "예시 데이터입니다 — 실제 스토리를 넣으면 Claude가 스토리 속 사실만으로 대본을 씁니다.",
    "'47개'처럼 숫자를 쓸 때는 실제로 맞는 숫자인지 꼭 확인하세요.",
  ],
};
