
import imgCalendar from '../../assets/calendar_final.png';
import imgAcrylic from '../../assets/acrylic_final_v2.jpg';

export function SectionVisibility() {
  return `
    <section id="visibility" class="md-section md-section--alt">
      <div class="mydose-container">
        <div class="md-section__header">
          <span class="md-section__point" style="display: inline-block; padding: 8px 24px; background: var(--mydose-accent); border-radius: 100px; color: var(--mydose-primary); font-size: 0.9rem; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(242, 233, 228, 0.5);">Point 1. Visibility</span>
          <h2 class="md-section__title">노인도, 아이도 한눈에 확인하는 복약 관리</h2>
        </div>
        <div class="md-content" style="align-items: flex-start;">
          <div class="md-text-box">
            <h3 style="display: inline-block; font-size: 1.7rem; margin-bottom: 32px; padding: 8px 4px; border-bottom: 4px solid var(--mydose-cta); color: var(--mydose-primary);">벽걸이 복약 달력</h3>
            <p style="font-size: 1.25rem; line-height: 1.9; color: var(--mydose-text);">
              <span style="font-weight: 700; color: var(--mydose-primary); display: block; margin-bottom: 16px; font-size: 1.45rem; letter-spacing: -0.5px;">"가장 잘 보이는 곳에 두세요."</span>
              투명 포켓으로 복용 여부를 직관적으로 알 수 있습니다.<br>
              온 가족의 건강 상태를 한눈에 관리하는 즐거움을<br>
              매일 아침 침대 곁에서, 혹은 거실 벽면에서 느껴보세요.
            </p>
          </div>
          <div class="md-visual reveal" style="border-radius: 40px; box-shadow: 0 40px 100px rgba(0,0,0,0.12);">
            <img src="${imgCalendar}" alt="MY DOSE Wall Calendar" style="border-radius: 40px;">
          </div>
        </div>
        <div class="md-content" style="margin-top: 120px; align-items: flex-start;">
          <div class="md-visual reveal" style="border-radius: 40px;">
            <img src="${imgAcrylic}" alt="MY DOSE Weekly Acrylic Box" style="border-radius: 40px;">
          </div>
          <div class="md-text-box">
            <h3 style="display: inline-block; font-size: 1.7rem; margin-bottom: 32px; padding: 8px 4px; border-bottom: 4px solid var(--mydose-cta); color: var(--mydose-primary);">Weekly 아크릴 보관함</h3>
            <p style="font-size: 1.25rem; line-height: 1.9; color: var(--mydose-text);">
              <span style="font-weight: 700; color: var(--mydose-primary); display: block; margin-bottom: 16px; font-size: 1.45rem; letter-spacing: -0.5px;">"요일별 분리로 헷갈릴 걱정 끝."</span>
              견고하고 투명한 아크릴 소재가 거실의 분위기를<br>
              해치지 않으면서도 완벽한 정리 정돈을 도와줍니다.<br>
              이제 어떤 약을 먹어야 할지 고민하지 마세요.
            </p>
          </div>
        </div>
      </div>
    </section>
  `;
}
