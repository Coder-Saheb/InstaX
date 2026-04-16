// MAGNETIC BUTTON
const magnetBtns = document.querySelectorAll('.cta-btn');
magnetBtns.forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width/2;
    const y = e.clientY - r.top - r.height/2;
    btn.style.transform = `translateY(-3px) scale(1.02) translate(${x*0.12}px,${y*0.12}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

// INTERSECTION OBSERVER
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
    } else {
      entry.target.classList.remove('visible');
    }
  });
}, {threshold: 0.12, rootMargin:'0px 0px -40px 0px'});

document.querySelectorAll('.anim-el').forEach(el => io.observe(el));

// HOW SECTION CONNECTOR
const howSection = document.getElementById('howSection');
const howIo = new IntersectionObserver(entries => {
  entries.forEach(e => {
    const fills = document.querySelectorAll('.connector-fill');
    if(e.isIntersecting){
      fills.forEach((f,i)=>{ setTimeout(()=>{f.style.width='100%'},300+i*200) });
      howSection.classList.add('visible');
    } else {
      fills.forEach(f=>{ f.style.width='0%' });
    }
  });
},{threshold:0.3});
howIo.observe(howSection);

// PARALLAX
let ticking = false;
window.addEventListener('scroll',()=>{
  if(!ticking){
    requestAnimationFrame(()=>{
      const sy = window.scrollY;
      const orbs = document.querySelectorAll('.amb-orb');
      orbs.forEach((o,i)=>{
        const speed = [0.04,0.06,0.03][i];
        o.style.transform = `translateY(${sy*speed}px)`;
      });
      ticking = false;
    });
    ticking = true;
  }
});
