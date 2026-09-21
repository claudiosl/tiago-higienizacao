/**
 * ==========================================================================
 * TIAGO HIGIENIZAÇÃO - EXPERIÊNCIA CINEMATOGRÁFICA SCROLLYTELLING
 * Sincronização Contínua e Fluida 1:1 do Vídeo do Topo ao Fim da Página
 * ==========================================================================
 */

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('scrolly-video');
  const mainFlow = document.querySelector('.scrolly-main-flow');
  const sections = document.querySelectorAll('.flow-section');
  const navItems = document.querySelectorAll('.nav-item');

  if (!video || !mainFlow) return;

  // Propriedades fundamentais para permitir reprodução sem som em todos os aparelhos
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.loop = false;
  video.pause();

  let targetProgress = 0;
  let targetTime = 0;
  let videoDuration = 10;
  let isSeeking = false;
  let animationFrameId = null;

  // Atualiza a duração real do vídeo assim que estiver pronta
  function updateDuration() {
    if (video.duration && !isNaN(video.duration) && video.duration > 0) {
      videoDuration = video.duration;
    }
  }

  // Destrava o decodificador de vídeo para mobile e desktop
  function unlockDecoder() {
    updateDuration();
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Breve pausa para manter os buffers abertos no hardware
          setTimeout(() => {
            if (targetProgress === 0 && video.currentTime < 0.2) {
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
   * Loop de Renderização Contínua a 60fps
   * Acompanha a rolagem do usuário do segundo 0:00 até o final do vídeo
   */
  function syncLoop() {
    updateDuration();
    const maxDuration = Math.max(videoDuration - 0.05, 0.1);
    targetTime = targetProgress * maxDuration;
    const current = video.currentTime;
    const diff = targetTime - current;

    // Rolando para frente: usa reprodução acelerada suave (sem travar decodificador)
    if (diff > 0.05) {
      // Velocidade adaptativa: quanto mais rápido rola, mais rápido o vídeo avança até alcançar a posição
      const speed = Math.min(Math.max(diff * 2.2, 0.8), 4.0);
      video.playbackRate = speed;
      if (video.paused) {
        const p = video.play();
        if (p !== undefined) p.catch(() => {});
      }
    } 
    // Rolando para trás: volta suavemente
    else if (diff < -0.1) {
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
    // Na posição exata da rolagem: pausa no frame correspondente
    else {
      if (!video.paused && Math.abs(diff) < 0.04) {
        video.pause();
      }
    }

    animationFrameId = requestAnimationFrame(syncLoop);
  }

  video.addEventListener('seeked', () => {
    isSeeking = false;
  });

  // Inicia o motor de animação
  animationFrameId = requestAnimationFrame(syncLoop);

  /**
   * Conecta o ScrollTrigger ao início e fim da página
   */
  function setupScrollTrigger() {
    updateDuration();

    ScrollTrigger.create({
      trigger: mainFlow,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // self.progress vai estritamente de 0.0 (topo) até 1.0 (rodapé final)
        targetProgress = self.progress;
      }
    });

    // Desaparecimento suave do card do mapa ao aproximar do final
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

  // Navegação suave pelos links do menu
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
    updateDuration();
    ScrollTrigger.refresh();
  });

  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
  });
});
