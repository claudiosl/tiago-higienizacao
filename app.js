/**
 * ==========================================================================
 * TIAGO HIGIENIZAÇÃO - EXPERIÊNCIA CINEMATOGRÁFICA SCROLLYTELLING
 * Motor Adaptativo Ultra-Otimizado (Dual-Mode: Mobile Fluid Loop + Desktop Scrolly)
 * ==========================================================================
 */

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('scrolly-video');
  const mainFlow = document.querySelector('.scrolly-main-flow');
  const sections = document.querySelectorAll('.flow-section');
  const navItems = document.querySelectorAll('.nav-item');

  if (!video || !mainFlow) return;

  // Propriedades fundamentais de vídeo sem som e inline para máxima compatibilidade
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  const isTouchOrMobile = () => {
    return window.innerWidth <= 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  /**
   * 📱 MODO MOBILE: Reprodução Contínua Fluida 60fps
   * Elimina o processamento excessivo de CPU/GPU em smartphones,
   * mantendo a rolagem 100% lisa e o vídeo cinematográfico em segundo plano.
   */
  function initMobileMode() {
    video.loop = true;
    video.playbackRate = 1.0;

    const startMobilePlay = () => {
      const p = video.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    };

    startMobilePlay();
    window.addEventListener('touchstart', startMobilePlay, { passive: true, once: true });
    window.addEventListener('scroll', startMobilePlay, { passive: true, once: true });
  }

  /**
   * 💻 MODO DESKTOP: Sincronização Progressiva com Scroll
   */
  function initDesktopMode() {
    video.loop = false;
    let targetTime = 0;
    let videoDuration = 10;
    let isSeeking = false;
    let rafId = null;

    function updateDuration() {
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        videoDuration = video.duration;
      }
    }

    const unlock = () => {
      const p = video.play();
      if (p !== undefined) {
        p.then(() => {
          setTimeout(() => {
            if (targetTime === 0) video.pause();
          }, 100);
        }).catch(() => {});
      }
    };
    unlock();

    function desktopLoop() {
      updateDuration();
      const current = video.currentTime;
      const diff = targetTime - current;

      if (diff > 0.08) {
        const speed = Math.min(Math.max(diff * 1.8, 0.8), 3.0);
        video.playbackRate = speed;
        if (video.paused) {
          const p = video.play();
          if (p !== undefined) p.catch(() => {});
        }
      } else if (diff < -0.15) {
        if (!video.paused) video.pause();
        if (!isSeeking) {
          isSeeking = true;
          try {
            video.currentTime = Math.max(targetTime, 0.001);
          } catch (e) {
            isSeeking = false;
          }
        }
      } else {
        if (!video.paused && Math.abs(diff) < 0.05) {
          video.pause();
        }
      }

      rafId = requestAnimationFrame(desktopLoop);
    }

    video.addEventListener('seeked', () => {
      isSeeking = false;
    });

    rafId = requestAnimationFrame(desktopLoop);

    ScrollTrigger.create({
      trigger: mainFlow,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        updateDuration();
        const maxTime = Math.max(videoDuration - 0.08, 0.1);
        targetTime = Math.min(Math.max(self.progress * maxTime, 0), maxTime);
      }
    });

    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('canplay', updateDuration);
  }

  // Inicializa o modo ideal para o dispositivo atual
  if (isTouchOrMobile()) {
    initMobileMode();
  } else {
    initDesktopMode();
  }

  // Desaparecimento suave do card do mapa ao rolar
  const mapCard = document.querySelector('.location-snapshot-card');
  if (mapCard) {
    gsap.to(mapCard, {
      opacity: 0,
      y: -40,
      scale: 0.96,
      pointerEvents: 'none',
      ease: 'power1.out',
      scrollTrigger: {
        trigger: mapCard,
        start: 'top 30%',
        end: 'bottom 5%',
        scrub: 1.2
      }
    });
  }

  /**
   * Sincronização de etapas no menu de navegação
   */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const targetId = entry.target.getAttribute('id');
        navItems.forEach((item) => {
          const href = item.getAttribute('href').replace('#', '');
          if (href === targetId) {
            item.classList.add('is-active');
          } else {
            item.classList.remove('is-active');
          }
        });
      }
    });
  }, { rootMargin: '-30% 0px -30% 0px', threshold: 0.15 });

  sections.forEach((section) => observer.observe(section));

  // Cliques suaves nos itens do menu
  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = item.getAttribute('href');
      const targetElem = document.querySelector(targetId);
      if (targetElem) {
        targetElem.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
  window.addEventListener('resize', () => ScrollTrigger.refresh());
});
