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


  // ===== RSVP -> Google Sheets =====
  // Dán URL Web App của Google Apps Script vào giữa hai dấu nháy bên dưới.
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxrOJMIX2QZ8IdAkey5Dv7X1xzc4D55GRDMC8L43WvnVFFh-NLEb00V9Fk83Rx9Rq6F/exec';
  const rsvpForm = $('#rsvpForm');
  const submitRsvp = $('#submitRsvp');
  const formStatus = $('#formStatus');
  const messageInput = $('#guestMessage');
  const messageCount = $('#messageCount');

  messageInput?.addEventListener('input', () => {
    messageCount.textContent = String(messageInput.value.length);
  });

  const setFieldError = (selector, message) => {
    const el = $(selector);
    if (el) el.textContent = message;
  };

  rsvpForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setFieldError('#nameError', '');
    setFieldError('#attendanceError', '');
    formStatus.textContent = '';
    formStatus.className = 'form-status';

    const formData = new FormData(rsvpForm);
    const name = String(formData.get('name') || '').trim();
    const attendance = String(formData.get('attendance') || '').trim();
    const message = String(formData.get('message') || '').trim();
    const website = String(formData.get('website') || '').trim();

    let valid = true;
    if (name.length < 2) {
      setFieldError('#nameError', 'Bạn vui lòng nhập họ và tên.');
      valid = false;
    }
    if (!attendance) {
      setFieldError('#attendanceError', 'Bạn vui lòng chọn một phương án.');
      valid = false;
    }
    if (!valid) return;
    if (website) return; // chống bot

    if (!GOOGLE_SCRIPT_URL.startsWith('https://script.google.com/macros/s/')) {
      formStatus.textContent = 'Chủ thiệp chưa kết nối Google Sheets. Vui lòng cấu hình URL Apps Script.';
      formStatus.classList.add('error');
      return;
    }

    submitRsvp.disabled = true;
    submitRsvp.classList.add('loading');

    try {
      const payload = new URLSearchParams({
        name,
        attendance,
        message,
        pageUrl: location.href,
        userAgent: navigator.userAgent
      });

      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
        body: payload.toString()
      });

      formStatus.textContent = `Cảm ơn ${name}! Mình đã nhận được xác nhận của bạn 💙`;
      formStatus.classList.add('success');
      rsvpForm.reset();
      messageCount.textContent = '0';
      launchConfetti();
      submitRsvp.querySelector('.submit-button__text').textContent = 'Đã gửi ✓';
      setTimeout(() => {
        submitRsvp.querySelector('.submit-button__text').textContent = 'Gửi xác nhận';
      }, 3500);
    } catch (error) {
      formStatus.textContent = 'Chưa thể gửi xác nhận. Bạn vui lòng thử lại sau.';
      formStatus.classList.add('error');
    } finally {
      submitRsvp.disabled = false;
      submitRsvp.classList.remove('loading');
    }
  });

})();
