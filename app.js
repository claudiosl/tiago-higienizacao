/**
 * ==========================================================================
 * TIAGO HIGIENIZAÇÃO - EXPERIÊNCIA CINEMATOGRÁFICA SCROLLYTELLING
 * Sincronização Ultra-Fluida de Vídeo com Scroll (Queue-Based Hardware Seeker)
 * ==========================================================================
 */

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('scrolly-video');
  const mainFlow = document.querySelector('.scrolly-main-flow');
  const sections = document.querySelectorAll('.flow-section');
  const navItems = document.querySelectorAll('.nav-item');

  if (!video || !mainFlow) return;

  // Garante propriedades ideais
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  let isSeeking = false;
  let targetTime = 0;
  let duration = 10;
  let seekTimeout = null;

  // Função para aplicar o seek com proteção de hardware queue
  function performSeek() {
    if (isSeeking) return;

    const diff = Math.abs(video.currentTime - targetTime);
    if (diff > 0.02) {
      isSeeking = true;
      try {
        video.currentTime = targetTime;
      } catch (e) {
        isSeeking = false;
      }

      // Timeout de segurança caso o evento 'seeked' demore em aparelhos lentos
      clearTimeout(seekTimeout);
      seekTimeout = setTimeout(() => {
        if (isSeeking) {
          isSeeking = false;
          performSeek();
        }
      }, 100);
    }
  }

  // Quando o frame é decodificado pelo hardware, destrava e busca o próximo frame
  video.addEventListener('seeked', () => {
    clearTimeout(seekTimeout);
    isSeeking = false;
    performSeek();
  });

  // Atualiza duração
  function setDuration() {
    if (video.duration && !isNaN(video.duration) && video.duration > 0) {
      duration = video.duration;
    }
  }

  // Inicialização de ScrollTrigger
  function initScrolly() {
    setDuration();

    ScrollTrigger.create({
      trigger: mainFlow,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        setDuration();
        const maxTime = Math.max(duration - 0.05, 0.1);
        targetTime = Math.min(Math.max(self.progress * maxTime, 0.001), maxTime);
        performSeek();
      }
    });

    // Desaparecimento suave do card do mapa
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

    ScrollTrigger.refresh();
  }

  // Garante que o decoder de vídeo seja destravado
  const unlock = () => {
    const p = video.play();
    if (p !== undefined) {
      p.then(() => video.pause()).catch(() => {});
    }
  };
  unlock();
  window.addEventListener('touchstart', unlock, { passive: true, once: true });
  window.addEventListener('scroll', unlock, { passive: true, once: true });

  initScrolly();

  video.addEventListener('loadedmetadata', () => {
    initScrolly();
  });

  video.addEventListener('canplay', () => {
    initScrolly();
  });

  // Observador de seções para o menu
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

  window.addEventListener('load', () => ScrollTrigger.refresh());
  window.addEventListener('resize', () => ScrollTrigger.refresh());
});
