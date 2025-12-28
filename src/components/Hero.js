import nurseImage from '../assets/hero_main_v2.jpg'

export function Hero() {
  return `
    <section class="hero">
      <div class="container hero__container">
        <div class="hero__content">
          <h1 class="hero__title">병원 감염 관리의<br>새로운 기준, 워시자이저</h1>
          <p class="hero__description">
            RFID 스마트 센서로 손위생 수행률을 자동으로 모니터링하고 개선하세요.
            실시간 데이터로 환자와 의료진을 안전하게 보호합니다.
          </p>
          <div class="hero__actions">
            <a href="#solution" class="btn btn--primary">워시자이저 알아보기</a>
            <a href="#how-it-works" class="btn btn--outline">작동 원리</a>
          </div>
        </div>
        <div class="hero__visual">
          <div class="hero__image-container">
            <img src="${nurseImage}" alt="간호사가 워시자이저를 사용하는 모습" class="hero__image" />
            <div class="pulse-ring"></div>
          </div>
        </div>
      </div>
    </section>
  `;
}
