import deviceImage from '../assets/device_v3.png'
import rfidImage from '../assets/rfid_cards_v2.png'

export function ProblemSolution() {
  return `
    <!-- Ticker Animation -->
    <div class="ticker-wrap">
      <div class="ticker">
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
        <div class="ticker__item">Washgizer</div>
      </div>
    </div>

    <section id="problem" class="section section--problem">
      <div class="container">
        <div class="section__header">
          <h2 class="section__title">의료 현장의 과제</h2>
          <p class="section__subtitle">병원내 감염(HAI)은 환자 안전을 위협하는 심각한 문제입니다.</p>
        </div>
        <div class="grid grid--2 problem-grid">
          <div class="card card--problem">
            <div class="card__visual">
               <img src="/problem_germs.jpg?v=2" alt="Viruses on hand" class="problem-image" />
            </div>
            <div class="card__content">
              <div class="card__icon">🦠</div>
              <h3 class="card__title">보이지 않는 위협</h3>
              <p class="card__text">병원균은 바쁜 의료 환경에서 쉽게 전파되어 면역력이 약한 환자들을 위험에 빠뜨립니다.</p>
            </div>
          </div>
          <div class="card card--problem">
            <div class="card__visual">
               <img src="/problem_manual_log.jpg?v=2" alt="Manual logging" class="problem-image" />
            </div>
            <div class="card__content">
              <div class="card__icon">📉</div>
              <h3 class="card__title">모니터링의 한계</h3>
              <p class="card__text">직접 관찰 방식/수기 기록은 시간이 많이 소요되고, 정확도가 떨어지며 데이터 분석이 어렵습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="solution" class="section section--solution">
      <div class="container">
        <div class="split-layout">
          <div class="split-layout__content">
            <span class="badge">솔루션</span>
            <h2 class="section__title">워시자이저를 만나보세요</h2>
            <p class="section__description">
              모든 손위생 순간을 자동으로 기록하는 완벽한 시스템입니다.
            </p>
            <ul class="feature-list">
              <li class="feature-item">
                <span class="check-icon">✓</span>
                <div>
                  <strong>스마트 RFID 네임카드</strong>
                  <p>의료진을 자동으로 식별하는 가볍고 편리한 네임카드</p>
                </div>
              </li>
              <li class="feature-item">
                <span class="check-icon">✓</span>
                <div>
                  <strong>지능형 메탈 디스펜서</strong>
                  <p>카드 접근을 감지하여 자동으로 소독제를 분사합니다.</p>
                </div>
              </li>
              <li class="feature-item">
                <span class="check-icon">✓</span>
                <div>
                  <strong>음성 제공 기능</strong>
                  <p>손소독 횟수를 음성으로 안내하여 자각할수 있게 합니다.</p>
                </div>
              </li>
              <li class="feature-item">
                <span class="check-icon">✓</span>
                <div>
                  <strong>실시간 분석 EMR 대시보드</strong>
                  <p>클라우드 기반으로 수행률과 추세를 한눈에 파악하세요.</p>
                </div>
              </li>
            </ul>
          </div>
          <div class="split-layout__visual">
            <div class="device-showcase-wrapper">
              <div class="device-showcase showcase--swap">
                <img src="${deviceImage}" alt="워시자이저 스마트 디바이스" class="showcase-img showcase-img--1" />
                <img src="${rfidImage}" alt="RFID 네임카드" class="showcase-img showcase-img--2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
