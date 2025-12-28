
import logoImage from '../../assets/mydose_logo_v2.png';

export function Header() {
  return `
    <header class="header" style="background: rgba(255,255,255,0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(0,0,0,0.05); position: fixed; width: 100%; top: 0; z-index: 1000;">
      <div class="mydose-container" style="display: flex; justify-content: space-between; align-items: center; height: 120px;">
        <a href="#" class="logo" style="display: flex; align-items: center; text-decoration: none; transition: transform 0.3s ease;">
          <img src="${logoImage}" alt="MY DOSE Logo" style="height: 100px; width: auto; object-fit: contain;">
        </a>
        <nav class="nav">
          <ul class="nav__list" style="display: flex; gap: 40px; list-style: none;">
            <li class="nav__item"><a href="#story" class="nav__link" style="color: var(--mydose-primary); font-weight: 500; text-decoration: none; font-size: 0.95rem;">Story</a></li>
            <li class="nav__item"><a href="#visibility" class="nav__link" style="color: var(--mydose-primary); font-weight: 500; text-decoration: none; font-size: 0.95rem;">Visibility</a></li>
            <li class="nav__item"><a href="#usability" class="nav__link" style="color: var(--mydose-primary); font-weight: 500; text-decoration: none; font-size: 0.95rem;">Usability</a></li>
            <li class="nav__item"><a href="#routine" class="nav__link" style="color: var(--mydose-primary); font-weight: 500; text-decoration: none; font-size: 0.95rem;">Routine</a></li>
            <li class="nav__item"><a href="#specs" class="nav__link" style="color: var(--mydose-primary); font-weight: 500; text-decoration: none; font-size: 0.95rem;">Specs</a></li>
          </ul>
        </nav>
        <div style="display: flex; align-items: center; gap: 20px;">
          <a href="#" class="md-btn" style="padding: 12px 28px; font-size: 0.9rem; border-radius: 100px; box-shadow: none;">구매하기</a>
        </div>
      </div>
    </header>
  `;
}
