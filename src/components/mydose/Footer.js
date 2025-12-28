
export function Footer() {
  return `
    <footer id="contact" class="footer" style="padding: 100px 0 50px; background: #222;">
      <div class="mydose-container">
        <div class="footer__grid" style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 60px;">
          <div class="footer__col">
            <div class="logo logo--white" style="font-size: 1.8rem; font-weight: 800; margin-bottom: 20px; color: #fff;">MY DOSE</div>
            <p class="footer__text" style="color: #999; line-height: 1.8;">
              <strong>MY DOSE 최이현 대표</strong><br>
              <strong>사업자명: 키에르나인</strong><br>
              당신의 건강한 하루, 빠짐없이 챙겨드리는 라이프스타일 파트너입니다.
            </p>
          </div>
          
          <div class="footer__col">
            <h4 class="footer__heading" style="color: #fff; margin-bottom: 25px;">Menu</h4>
            <ul class="footer__links" style="list-style: none; padding: 0;">
              <li style="margin-bottom: 12px;"><a href="#visibility" style="color: #999; text-decoration: none;">Visibility</a></li>
              <li style="margin-bottom: 12px;"><a href="#usability" style="color: #999; text-decoration: none;">Usability</a></li>
              <li style="margin-bottom: 12px;"><a href="#routine" style="color: #999; text-decoration: none;">Routine</a></li>
            </ul>
          </div>
          
          <div class="footer__col">
            <h4 class="footer__heading" style="color: #fff; margin-bottom: 25px;">Contact</h4>
            <ul class="footer__links" style="list-style: none; padding: 0; color: #999; line-height: 1.8;">
              <li>문의: support@mydose.co.kr</li>
              <li>위치: 부산광역시</li>
            </ul>
          </div>
        </div>
        
        <div class="footer__bottom" style="margin-top: 80px; padding-top: 30px; border-top: 1px solid #333; text-align: center; color: #666; font-size: 0.9rem;">
          <p>&copy; ${new Date().getFullYear()} MY DOSE / KIER-NINE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `;
}
