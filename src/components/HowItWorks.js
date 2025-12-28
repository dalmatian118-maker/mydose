export function HowItWorks() {
  return `
    <section id="how-it-works" class="section section--how-it-works">
      <div class="container">
        <div class="section__header">
          <h2 class="section__title">워시자이저 작동 원리</h2>
          <p class="section__subtitle">바쁜 병원 환경을 위해 설계된 매끄러운 워크플로우</p>
        </div>
        
        <div class="steps">
          <div class="step">
            <div class="step__number">1</div>
            <div class="step__content">
              <div class="step__icon">🚶</div>
              <h3 class="step__title">접근 (Approach)</h3>
              <p class="step__text">의료진이 RFID 배지를 착용하고 워시자이저 디스펜서에 접근합니다.</p>
            </div>
          </div>
          
          <div class="step-connector"></div>
          
          <div class="step">
            <div class="step__number">2</div>
            <div class="step__content">
              <div class="step__icon">📡</div>
              <h3 class="step__title">감지 (Detect)</h3>
              <p class="step__text">디스펜서의 센서가 고유 RFID 태그를 즉시 감지합니다.</p>
            </div>
          </div>
          
          <div class="step-connector"></div>
          
          <div class="step">
            <div class="step__number">3</div>
            <div class="step__content">
              <div class="step__icon">💧</div>
              <h3 class="step__title">분사 (Dispense)</h3>
              <p class="step__text">접촉 없이 자동으로 손소독제가 분사됩니다.</p>
            </div>
          </div>
          
          <div class="step-connector"></div>
          
          <div class="step">
            <div class="step__number">4</div>
            <div class="step__content">
              <div class="step__icon">☁️</div>
              <h3 class="step__title">기록 (Record)</h3>
              <p class="step__text">누가, 언제, 어디서 수행했는지 실시간으로 기록됩니다.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
