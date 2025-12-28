import './style.css'
import './mydose.css'
import { Header } from './components/mydose/Header.js'
import { MydosePage } from './components/mydose/MydosePage.js'
import { Footer } from './components/mydose/Footer.js'

document.querySelector('#app').innerHTML = `
  ${Header()}
  <main>
    ${MydosePage()}
  </main>
  ${Footer()}
`

// Scroll Reveal Animation
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1
});

revealElements.forEach(element => {
  element.classList.add('reveal');
  revealObserver.observe(element);
});

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});
