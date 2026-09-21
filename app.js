/**
 * ==========================================================================
 * TIAGO HIGIENIZAÇÃO - EXPERIÊNCIA CINEMATOGRÁFICA SCROLLYTELLING
 * Controle ultra-fluido de vídeo sincronizado ao scroll (GSAP + ScrollTrigger)
 * ==========================================================================
 */

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('scrolly-video');
  const mainFlow = document.querySelector('.scrolly-main-flow');
  const sections = document.querySelectorAll('.flow-section');
  const navItems = document.querySelectorAll('.nav-item');

  if (!video || !mainFlow) return;

  // Garante propriedades ideais de reprodução
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.pause();

  // Variáveis de controle de interpolação suave
  let targetProgress = 0;
  let currentProgress = 0;
  let videoDuration = 10; // Duração fallback até carregar metadados
  let isInitialized = false;

  // Atualiza a duração real assim que disponível
  function updateDuration() {
    if (video.duration && !isNaN(video.duration) && video.duration > 0) {
      videoDuration = video.duration;
    }
  }

  video.addEventListener('loadedmetadata', updateDuration);
  video.addEventListener('durationchange', updateDuration);
  video.addEventListener('canplay', updateDuration);

  // Inicializa o decodificador de vídeo (warmup para destravar frames em todos os browsers)
  const warmUpDecoder = () => {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          video.pause();
        })
        .catch(() => {
          // Autoplay sem interação pode falhar em alguns navegadores, fallback silencioso
        });
    }
  };
  warmUpDecoder();

  /**
   * Inicialização do Scrollytelling com GSAP ScrollTrigger
   */
  function initScrollyEngine() {
    if (isInitialized) return;
    isInitialized = true;
    updateDuration();

    // ScrollTrigger principal acoplado ao fluxo da página
    ScrollTrigger.create({
      trigger: mainFlow,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        targetProgress = self.progress;
      }
    });

    // Loop de renderização fluida com interpolação contínua (Lerp)
    function renderLoop() {
      // Interpolação suave (fator 0.12 para movimento natural e cinematográfico)
      currentProgress += (targetProgress - currentProgress) * 0.12;

      const targetTime = currentProgress * videoDuration;

      // Aplica o tempo ao vídeo quando houver diferença perceptível
      if (Math.abs(video.currentTime - targetTime) > 0.02) {
        try {
          const clampedTime = Math.min(Math.max(targetTime, 0.001), videoDuration - 0.05);
          video.currentTime = clampedTime;
        } catch (err) {
          // Proteção contra chamadas antes do buffer estar pronto
        }
      }

      requestAnimationFrame(renderLoop);
    }

    requestAnimationFrame(renderLoop);

    // Desaparecimento suave do card de localização ao rolar
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

  // Inicializa imediatamente o engine
  initScrollyEngine();

  // Recalibra quando os metadados chegarem
  if (video.readyState >= 1) {
    updateDuration();
    ScrollTrigger.refresh();
  } else {
    video.addEventListener('loadedmetadata', () => {
      updateDuration();
      ScrollTrigger.refresh();
    });
  }

  /**
   * Sincronização de etapas no menu de navegação
   */
  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -30% 0px',
    threshold: 0.15
  };

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
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));

  // Recalibrações em eventos de ciclo de vida da janela
  window.addEventListener('load', () => {
    updateDuration();
    ScrollTrigger.refresh();
  });

  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
  });
});
