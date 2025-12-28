import dashboardImage from '../assets/dashboard.png' // Keeping original for context if needed, but looks like file name wasn't matched in import previously, using direct string. Let's start imports.
import dashboardV2 from '../assets/dashboard_v2.png'
import dashboardV3 from '../assets/dashboard_v3.png'

export function Benefits() {
  return `
    <section id="benefits" class="section section--benefits">
      <div class="container">
        <div class="section__header">
          <h2 class="section__title">왜 워시자이저인가요?</h2>
          <p class="section__subtitle">의료 기관을 위한 측정 가능한 결과를 제공합니다.</p>
        </div>
        
        <div class="dashboard-showcase">
          <img src="/effect_dashboard.png?v=3" alt="워시자이저 대시보드" class="dashboard-image" />
          <p class="dashboard-caption">실시간으로 간호사별 손소독 횟수와 추세를 확인하세요.</p>
        </div>

        <div class="grid grid--3">
          <div class="benefit-card">
            <div class="benefit-card__icon">🚀</div>
            <h3 class="benefit-card__title">수행률 향상</h3>
            <p class="benefit-card__text">워시자이저를 도입한 병원은 첫 달 내에 평균 40%의 손위생 수행률 증가를 경험했습니다.</p>
          </div>
          
          <div class="benefit-card">
            <div class="benefit-card__icon">📊</div>
            <h3 class="benefit-card__title">데이터 기반 관리</h3>
            <p class="benefit-card__text">고위험 구역과 시간대를 식별하세요. 병원 행정을 위한 자동화된 보고서를 생성합니다.</p>
          </div>
          
          <div class="benefit-card">
            <div class="benefit-card__icon">🛡️</div>
            <h3 class="benefit-card__title">감염 관리</h3>
            <p class="benefit-card__text">병원내 감염(HAI) 비율 감소에 직접적으로 기여하여 비용을 절감하고 환자의 생명을 보호합니다.</p>
          </div>
        </div>
        
      </div>
    </section>
  `;
}
