
import imgApp from '../../assets/app_screen_final_v2.png';
import imgUserApp from '../../assets/app_user_final_v2.jpg';
import imgNotebook from '../../assets/notebook_final_v2.jpg';

export function SectionRoutine() {
  return `
    <section id="routine" class="md-section md-section--alt">
      <div class="mydose-container">
        <div class="md-section__header">
          <span class="md-section__point" style="display: inline-block; padding: 8px 24px; background: var(--mydose-accent); border-radius: 100px; color: var(--mydose-primary); font-size: 0.9rem; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(242, 233, 228, 0.5);">Point 3. Record & Routine</span>
          <h2 class="md-section__title">매일매일 체크하며 완성하는 건강 루틴</h2>
        </div>
        <div class="md-content" style="align-items: flex-start;">
          <div class="md-text-box reveal">
            <h3 style="display: inline-block; font-size: 1.7rem; margin-bottom: 32px; padding: 8px 4px; border-bottom: 4px solid var(--mydose-cta); color: var(--mydose-primary);">복약관리앱 & 복약수첩</h3>
            <p style="font-size: 1.25rem; line-height: 1.9; color: var(--mydose-text);">
              <span style="font-weight: 700; color: var(--mydose-primary); display: block; margin-bottom: 16px; font-size: 1.45rem; letter-spacing: -0.5px;">"단순한 기록 이상의 가치."</span>
              오늘 약 챙겨 드셨나요? 직관적인 복약관리 앱과 수첩으로<br>
              당신의 성실한 하루를 잊지 않고 기록해 보세요.<br>
              꾸준한 데이터가 모여 당신의 소중한 내일을 지켜줍니다.
            </p>
          </div>
          <div class="md-visual reveal" style="padding: 0; background: none; box-shadow: none;">
            <div class="md-crossfade" style="border-radius: 48px; box-shadow: 0 30px 60px rgba(0,0,0,0.12); overflow: hidden;">
              <img src="${imgApp}" alt="MY DOSE App Screen" class="md-crossfade__img" style="border-radius: 48px;">
              <img src="${imgUserApp}" alt="User with MY DOSE App" class="md-crossfade__img" style="border-radius: 48px;">
              <img src="${imgNotebook}" alt="MY DOSE Notebook" class="md-crossfade__img" style="border-radius: 48px;">
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
