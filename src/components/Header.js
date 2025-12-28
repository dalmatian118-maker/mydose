import logoImage from '../assets/logo_v2.png';
export function Header() {
  return `
    <header class="header">
      <div class="container header__container">
        <a href="#" class="logo">
          <span class="logo-text">Washgizer</span>
        </a>
        <nav class="nav">
          <ul class="nav__list">
            <li class="nav__item"><a href="#problem" class="nav__link">문제점</a></li>
            <li class="nav__item"><a href="#solution" class="nav__link">솔루션</a></li>
            <li class="nav__item"><a href="#how-it-works" class="nav__link">작동 원리</a></li>
            <li class="nav__item"><a href="#benefits" class="nav__link">도입 효과</a></li>
          </ul>
        </nav>
        <a href="#contact" class="btn btn--primary">문의하기</a>
      </div>
    </header>
  `;
}
