import './style.css'
import { Header } from './components/Header.js'
import { Hero } from './components/Hero.js'
import { ProblemSolution } from './components/ProblemSolution.js'
import { HowItWorks } from './components/HowItWorks.js'
import { Benefits } from './components/Benefits.js'
import { Team } from './components/Team.js'
import { Slogan } from './components/Slogan.js'
import { Footer } from './components/Footer.js'

document.querySelector('#app').innerHTML = `
  ${Header()}
  <main>
    ${Hero()}
    ${ProblemSolution()}
    ${HowItWorks()}
    ${Benefits()}
    ${Team()}
    ${Slogan()}
  </main>
  ${Footer()}
`

// Scroll Reveal Animation
const revealElements = document.querySelectorAll('.section__title, .section__subtitle, .card, .step, .benefit-card, .cta-box, .hero__content, .hero__visual');

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
