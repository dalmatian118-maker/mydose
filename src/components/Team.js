import teamPsj from '../assets/team_psj.jpg'
import teamKdy from '../assets/team_kdy.jpg'
import teamKms from '../assets/team_kms.jpg'
import teamPsy from '../assets/team_psy.jpg'

export function Team() {
  return `
    <section id="team" class="section section--team">
      <div class="container">
        <div class="section__header">
          <h2 class="section__title">TEAM</h2>
          <p class="section__subtitle">워시자이저를 만드는 사람들</p>
        </div>
        
        <div class="team-grid">
          <!-- Member 1 -->
          <div class="team-member">
            <div class="team-member__image-container">
              <img src="${teamPsj}" alt="박서정" class="team-member__image" />
            </div>
            <h3 class="team-member__name">박서정</h3>
            <p class="team-member__role">대표</p>
          </div>
          
          <!-- Member 2 -->
          <div class="team-member">
            <div class="team-member__image-container team-member__image-container--zoomed">
              <img src="${teamKdy}" alt="김도연" class="team-member__image" />
            </div>
            <h3 class="team-member__name">김도연</h3>
            <p class="team-member__role">개발</p>
          </div>
          
          <!-- Member 3 -->
          <div class="team-member">
            <div class="team-member__image-container">
              <img src="${teamKms}" alt="김민서" class="team-member__image" />
            </div>
            <h3 class="team-member__name">김민서</h3>
            <p class="team-member__role">마케팅</p>
          </div>
          
          <!-- Member 4 -->
          <div class="team-member">
            <div class="team-member__image-container">
              <img src="${teamPsy}" alt="박서영" class="team-member__image" />
            </div>
            <h3 class="team-member__name">박서영</h3>
            <p class="team-member__role">고객관리</p>
          </div>
        </div>

        <div class="cta-box">
          <h2 class="cta-box__title">병원의 안전을 강화할 준비가 되셨나요?</h2>
          <p class="cta-box__text">맞춤형 데모와 견적을 받아보세요.</p>
          <a href="#contact" class="btn btn--white">영업팀 문의</a>
        </div>
      </div>
    </section>
  `;
}
