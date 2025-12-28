
import imgPouch from '../../assets/uploaded_image_3_1766903958555.jpg';
import imgKeychain from '../../assets/uploaded_image_4_1766903958555.jpg';

export function SectionUsability() {
  return `
    <section id="usability" class="md-section">
      <div class="mydose-container">
        <div class="md-section__header">
          <span class="md-section__point" style="display: inline-block; padding: 8px 24px; background: var(--mydose-accent); border-radius: 100px; color: var(--mydose-primary); font-size: 0.9rem; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(242, 233, 228, 0.5);">Point 2. Usability</span>
          <h2 class="md-section__title">바쁜 일상 속에서도 잊지 않도록</h2>
        </div>
        <div class="md-content" style="align-items: flex-start;">
          <div class="md-visual reveal">
            <img src="${imgKeychain}" alt="MY DOSE Keychain Pouch" style="border-radius: 40px;">
          </div>
          <div class="md-text-box">
            <h3 style="display: inline-block; font-size: 1.7rem; margin-bottom: 32px; padding: 8px 4px; border-bottom: 4px solid var(--mydose-cta); color: var(--mydose-primary);">키링 미니 파우치</h3>
            <p style="font-size: 1.25rem; line-height: 1.9; color: var(--mydose-text);">
              <span style="font-weight: 700; color: var(--mydose-primary); display: block; margin-bottom: 16px; font-size: 1.45rem; letter-spacing: -0.5px;">"가방에 걸어두면 안심입니다."</span>
              깜빡하기 쉬운 점심 약이나 상비약을 가방에 걸어보세요.<br>
              콤팩트한 사이즈와 세련된 컬러가 당신의 소중한<br>
              가방을 더욱 돋보이게 해주는 건강한 액세서리가 됩니다.
            </p>
          </div>
        </div>
        <div class="md-content" style="margin-top: 120px; align-items: flex-start;">
          <div class="md-text-box">
            <h3 style="display: inline-block; font-size: 1.7rem; margin-bottom: 32px; padding: 8px 4px; border-bottom: 4px solid var(--mydose-cta); color: var(--mydose-primary);">사각 파우치</h3>
            <p style="font-size: 1.25rem; line-height: 1.9; color: var(--mydose-text);">
              <span style="font-weight: 700; color: var(--mydose-primary); display: block; margin-bottom: 16px; font-size: 1.45rem; letter-spacing: -0.5px;">"언제 어디서나 든든하게."</span>
              여행 갈 때도, 회사 갈 때도 넉넉한 수납공간과<br>
              견고한 원단으로 소중한 약을 깔끔하게 보호하세요.<br>
              당신의 모든 여정을 건강하게 동행합니다.
            </p>
          </div>
          <div class="md-visual reveal">
            <img src="${imgPouch}" alt="MY DOSE Square Pouch" style="border-radius: 40px;">
          </div>
        </div>
      </div>
    </section>
  `;
}
