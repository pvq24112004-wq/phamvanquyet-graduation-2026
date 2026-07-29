(() => {
  'use strict';
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => [...c.querySelectorAll(s)];
  const loader = $('#loadingScreen');
  window.addEventListener('load', () => setTimeout(() => loader?.classList.add('hidden'), 350));
  setTimeout(() => loader?.classList.add('hidden'), 2500);

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } });
  }, { threshold: .14 });
  $$('.reveal').forEach(el => revealObserver.observe(el));

  const progress = $('#scrollProgress');
  const backTop = $('#backToTop');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max > 0 ? scrollY / max * 100 : 0}%`;
    backTop.classList.toggle('visible', scrollY > 500);
  };
  addEventListener('scroll', onScroll, {passive:true}); onScroll();
  backTop.addEventListener('click', () => scrollTo({top:0, behavior:'smooth'}));

  const target = new Date('2026-08-08T09:30:00+07:00').getTime();
  const ids = ['days','hours','minutes','seconds'];
  const updateCountdown = () => {
    let diff = target - Date.now();
    if (diff <= 0) {
      ids.forEach(id => $('#' + id).textContent = '00');
      $('#countdownMessage').textContent = '🎉 Hôm nay là ngày tốt nghiệp!';
      return;
    }
    const values = [Math.floor(diff/86400000), Math.floor(diff/3600000)%24, Math.floor(diff/60000)%60, Math.floor(diff/1000)%60];
    ids.forEach((id,i) => $('#' + id).textContent = String(values[i]).padStart(2,'0'));
  };
  updateCountdown(); setInterval(updateCountdown, 1000);

  const audio = $('#bgMusic');
  const player = $('#musicPlayer');
  const playBtn = $('#musicToggle');
  const muteBtn = $('#muteToggle');
  const openBtn = $('#openInvitation');
  const syncAudio = () => { playBtn.textContent = audio.paused ? '▶' : '❚❚'; muteBtn.textContent = audio.muted ? '🔇' : '🔊'; };
  openBtn.addEventListener('click', async () => {
    player.classList.add('visible');
    try { await audio.play(); } catch (e) { /* autoplay requires user gesture; this click is the gesture */ }
    syncAudio(); launchConfetti();
    $('#message').scrollIntoView({behavior:'smooth'});
  });
  playBtn.addEventListener('click', async () => { audio.paused ? await audio.play().catch(()=>{}) : audio.pause(); syncAudio(); });
  muteBtn.addEventListener('click', () => { audio.muted = !audio.muted; syncAudio(); });
  audio.addEventListener('play', syncAudio); audio.addEventListener('pause', syncAudio);

  const lightbox = $('#lightbox');
  const closeLightbox = () => { lightbox.hidden = true; document.body.classList.remove('locked'); };
  $('#openLightbox').addEventListener('click', () => { lightbox.hidden = false; document.body.classList.add('locked'); });
  $('#closeLightbox').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !lightbox.hidden) closeLightbox(); });

  function launchConfetti(){
    const canvas=$('#confettiCanvas'),ctx=canvas.getContext('2d');
    const dpr=Math.min(devicePixelRatio||1,2); canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;ctx.scale(dpr,dpr);
    const colors=['#204098','#ffffff','#9fb0ef','#f1d07a'];
    const pieces=Array.from({length:150},()=>({x:innerWidth/2,y:innerHeight*.35,vx:(Math.random()-.5)*14,vy:-Math.random()*11-4,g:.22,r:Math.random()*6+3,a:1,rot:Math.random()*6,vr:(Math.random()-.5)*.25,c:colors[Math.floor(Math.random()*colors.length)]}));
    let frame=0; function draw(){ctx.clearRect(0,0,innerWidth,innerHeight);pieces.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.rot+=p.vr;p.a-=.006;ctx.save();ctx.globalAlpha=Math.max(0,p.a);ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.c;ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);ctx.restore()});if(frame++<180)requestAnimationFrame(draw);else ctx.clearRect(0,0,innerWidth,innerHeight)} draw();
  }
})();
