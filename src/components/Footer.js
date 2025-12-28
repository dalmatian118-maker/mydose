export function Footer() {
  return `
    <footer id="contact" class="footer">
      <div class="container">
        <div class="footer__grid">
          <div class="footer__col">
            <div class="logo logo--white">Washgizer</div>
            <p class="footer__text">
              워시자이저 박서정 대표<br>부산여자대학교 간호학과 팀 프로젝트
            </p>
          </div>
          
          <div class="footer__col">
            <h4 class="footer__heading">제품</h4>
            <ul class="footer__links">
              <li><a href="#solution">솔루션</a></li>
              <li><a href="#how-it-works">작동 원리</a></li>
              <li><a href="#benefits">도입 효과</a></li>
            </ul>
          </div>
          
          <div class="footer__col">
            <h4 class="footer__heading">연락처</h4>
            <ul class="footer__links">
              <li>info@washgizer.com</li>
              <li>02-1234-5678</li>
              <li>부산광역시 부산진구 부산여자대학교</li>
            </ul>
          </div>
        </div>
        
        <div class="footer__bottom">
          <p>&copy; ${new Date().getFullYear()} Washgizer. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `;
}
