/**
 * ==========================================================================
 * TIAGO HIGIENIZAÇÃO - EXPERIÊNCIA CINEMATOGRÁFICA SCROLLYTELLING
 * Controle ultra-fluido de vídeo sincronizado ao scroll via GSAP ScrollTrigger
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
  video.pause();

  let videoTimeline = null;
  let isInitialized = false;

  // Função para destravar o decodificador de vídeo no primeiro toque/scroll (essencial para mobile/iOS)
  function unlockDecoder() {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          video.pause();
        })
        .catch(() => {});
    }
  }

  // Destrava imediatamente e no primeiro toque/scroll
  unlockDecoder();
  window.addEventListener('touchstart', unlockDecoder, { passive: true, once: true });
  window.addEventListener('scroll', unlockDecoder, { passive: true, once: true });
  window.addEventListener('click', unlockDecoder, { passive: true, once: true });

  /**
   * Constrói ou reconstrói a timeline do GSAP acoplada ao ScrollTrigger
   */
  function buildScrollyTimeline() {
    const rawDuration = video.duration;
    const duration = (!rawDuration || isNaN(rawDuration) || rawDuration <= 0) ? 10 : rawDuration;

    if (videoTimeline) {
      videoTimeline.kill();
    }

    videoTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: mainFlow,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1, // Scrub ultra-fluido nativo do GSAP com amortecimento suave
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // Garante que o currentTime esteja sempre no range válido
          const maxTime = Math.max(duration - 0.05, 0.1);
          const target = self.progress * maxTime;
          try {
            video.currentTime = target;
          } catch (e) {}
        }
      }
    });

    // Animação nativa de propriedade no elemento de vídeo
    videoTimeline.fromTo(
      video,
      { currentTime: 0 },
      {
        currentTime: Math.max(duration - 0.05, 0.1),
        ease: 'none',
        duration: 1
      }
    );

    // Desaparecimento do card do mapa ao aproximar do final
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

  // Inicializa imediatamente
  buildScrollyTimeline();

  // Re-calibra quando os metadados do vídeo forem carregados
  video.addEventListener('loadedmetadata', buildScrollyTimeline);
  video.addEventListener('durationchange', buildScrollyTimeline);
  video.addEventListener('canplay', buildScrollyTimeline);
  video.addEventListener('loadeddata', buildScrollyTimeline);

  /**
   * Sincronização de etapas no menu de navegação do topo
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

  // Recalibrações em eventos de janela
  window.addEventListener('load', () => {
    buildScrollyTimeline();
    ScrollTrigger.refresh();
  });

  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
  });
});
