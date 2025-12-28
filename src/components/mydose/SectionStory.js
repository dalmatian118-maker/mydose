
import storyMainImage from '../../assets/story_main.png';

export function SectionStory() {
  const line1 = "서랍 속 영양제부터";
  const line2 = "놓치면 안되는 처방약까지,";
  const line3 = "확실한 복약 관리의 시작";
  const delayStep = 0.1;

  const splitText = (text, offsetIndex = 0) => {
    return text.split('').map((char, index) =>
      `<span class="fade-char" style="animation-delay: ${(offsetIndex + index) * delayStep}s">${char === ' ' ? '&nbsp;' : char}</span>`
    ).join('');
  };

  return `
    <section id="story" class="md-section" style="background: linear-gradient(to bottom, #fff, #fdfcfb); border-bottom: 1px solid rgba(0,0,0,0.03);">
      <div class="mydose-container">
        <div class="md-content" style="align-items: center; gap: 100px;">
          <div class="md-text-box">
            <span class="md-section__point reveal" style="display: inline-block; padding: 8px 24px; background: var(--mydose-accent); border-radius: 100px; color: var(--mydose-primary); font-size: 0.9rem; margin-bottom: 24px; letter-spacing: 1px;">BRAND STORY</span>
            <div class="fade-in-container">
              <h2 class="md-hero__title reveal" style="font-size: 2.7rem; margin-top: 20px; line-height: 1.4; font-weight: 800; letter-spacing: -1px;">
                <span class="fade-line-1">${splitText(line1)}</span><br>
                <span class="fade-line-2">${splitText(line2, line1.length)}</span><br>
                <span class="fade-line-3" style="color: var(--mydose-cta);">${splitText(line3, line1.length + line2.length)}</span>
              </h2>
            </div>
            <div class="reveal" style="margin: 40px 0; padding-left: 20px; border-left: 3px solid var(--mydose-accent);">
              <p style="font-size: 1.3rem; font-weight: 600; color: var(--mydose-primary); margin-bottom: 15px;">
                눈으로 확인하는 확실한 습관, 마이도즈
              </p>
              <p class="md-hero__subtitle" style="font-size: 1.05rem; line-height: 1.8; color: var(--mydose-text-light);">
                약 챙기는 걱정 없이 온전히 하루에 집중할 수 있도록.<br>
                가장 직관적인 시스템으로 당신의 건강한 루틴을 완성합니다.
              </p>
            </div>
            <a href="#visibility" class="md-btn reveal" style="padding: 16px 36px; border-radius: 12px; font-size: 0.95rem; background: var(--mydose-primary);">건강 루틴 살펴보기</a>
          </div>
          <div class="md-visual reveal" style="border-radius: 40px; box-shadow: 0 40px 100px rgba(0,0,0,0.15);">
            <img src="${storyMainImage}" alt="MY DOSE Lifestyle" style="width: 100%; transition: transform 1.5s cubic-bezier(0.19, 1, 0.22, 1);">
          </div>
        </div>
      </div>
    </section>
  `;
}
