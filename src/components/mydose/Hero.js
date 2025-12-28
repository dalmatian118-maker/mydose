
import imgRoutine from '../../assets/uploaded_image_0_1766903958555.jpg';

export function Hero() {
  return `
    <section id="hero" class="md-hero">
      <div class="mydose-container">
        <div class="md-hero__grid">
          <div class="md-hero__before reveal">
             <div class="md-hero__before-text">
               "깜빡한 고혈압 약, 유통기한 지난 영양제...<br>건강을 위해 샀는데 스트레스가 되진 않나요?"
             </div>
             <div class="md-visual">
               <img src="https://images.unsplash.com/photo-1550572017-ed200f5e64d7?q=80&w=1000&auto=format&fit=crop" alt="Cluttered medicine" style="filter: grayscale(0.5) contrast(0.8);">
             </div>
          </div>
          <div class="md-hero__after reveal">
            <span class="md-hero__badge">잊지 않음과 안심</span>
            <h1 class="md-hero__title">당신의 건강한 하루,<br>빠짐없이 챙겨드립니다.</h1>
            <p class="md-hero__subtitle">생활의 안심을 제안하는 마이 도즈(MY DOSE)</p>
            <div class="md-visual">
               <img src="${imgRoutine}" alt="MY DOSE Routine Kit">
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
