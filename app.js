/**
 * ==========================================================================
 * TIAGO HIGIENIZAÇÃO - EXPERIÊNCIA CINEMATOGRÁFICA SCROLLYTELLING
 * Motor Híbrido de Reprodução Sincronizada com Scroll (Active Pipeline Engine)
 * ==========================================================================
 */

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('scrolly-video');
  const mainFlow = document.querySelector('.scrolly-main-flow');
  const sections = document.querySelectorAll('.flow-section');
  const navItems = document.querySelectorAll('.nav-item');

  if (!video || !mainFlow) return;

  // Garante propriedades ideais de vídeo sem som e inline
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.autoplay = false;
  video.loop = false;

  let targetTime = 0;
  let videoDuration = 10;
  let isSeeking = false;
  let animationFrameId = null;

  function updateVideoDuration() {
    if (video.duration && !isNaN(video.duration) && video.duration > 0) {
      videoDuration = video.duration;
    }
  }

  // Destravamento de decodificação para navegadores restritivos (iOS/Safari/Android)
  function unlockDecoder() {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Mantém vivo por uma fração de segundo para abrir os buffers de hardware
          setTimeout(() => {
            if (targetTime === 0 && Math.abs(video.currentTime) < 0.1) {
              video.pause();
            }
          }, 150);
        })
        .catch(() => {});
    }
  }

  unlockDecoder();
  window.addEventListener('touchstart', unlockDecoder, { passive: true, once: true });
  window.addEventListener('scroll', unlockDecoder, { passive: true, once: true });
  window.addEventListener('click', unlockDecoder, { passive: true, once: true });

  /**
   * Loop de sincronização contínua de alta taxa de quadros (60fps)
   * Utiliza reprodução ativa para avançar suavemente e seeking protegido para retorno
   */
  function syncEngineLoop() {
    updateVideoDuration();
    const current = video.currentTime;
    const diff = targetTime - current;

    // Se o usuário rolou para frente (avanço suave sem travar o decoder)
    if (diff > 0.08) {
      // Ajusta a velocidade de reprodução conforme a velocidade de rolagem (de 0.8x até 3.5x)
      const speed = Math.min(Math.max(diff * 1.8, 0.8), 3.5);
      video.playbackRate = speed;
      
      if (video.paused) {
        const p = video.play();
        if (p !== undefined) p.catch(() => {});
      }
    } 
    // Se o usuário rolou para trás ou deu um salto grande
    else if (diff < -0.15) {
      if (!video.paused) {
        video.pause();
      }
      
      if (!isSeeking) {
        isSeeking = true;
        try {
          video.currentTime = Math.max(targetTime, 0.001);
        } catch (e) {
          isSeeking = false;
        }
      }
    } 
    // Quando atinge o ponto exato da seção
    else {
      if (!video.paused && Math.abs(diff) < 0.05) {
        video.pause();
      }
    }

    animationFrameId = requestAnimationFrame(syncEngineLoop);
  }

  video.addEventListener('seeked', () => {
    isSeeking = false;
  });

  // Inicia o motor de sincronização
  animationFrameId = requestAnimationFrame(syncEngineLoop);

  /**
   * Conecta o GSAP ScrollTrigger ao progresso do documento
   */
  function setupScrollTrigger() {
    updateVideoDuration();

    ScrollTrigger.create({
      trigger: mainFlow,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        updateVideoDuration();
        const maxTime = Math.max(videoDuration - 0.08, 0.1);
        targetTime = Math.min(Math.max(self.progress * maxTime, 0), maxTime);
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

  setupScrollTrigger();

  video.addEventListener('loadedmetadata', setupScrollTrigger);
  video.addEventListener('canplay', setupScrollTrigger);
  video.addEventListener('durationchange', setupScrollTrigger);

  /**
   * Observador para destacar links do menu conforme a seção ativa
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

  window.addEventListener('load', () => {
    updateVideoDuration();
    ScrollTrigger.refresh();
  });

  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
  });
});
