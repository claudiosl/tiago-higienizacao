/**
 * ==========================================================================
 * TIAGO HIGIENIZAÇÃO - EXPERIÊNCIA CINEMATOGRÁFICA SCROLLYTELLING
 * Sincronização Absoluta 1:1 do Vídeo com o Scroll (Início ao Fim da Página)
 * ==========================================================================
 */

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('scrolly-video');
  const mainFlow = document.querySelector('.scrolly-main-flow');
  const sections = document.querySelectorAll('.flow-section');
  const navItems = document.querySelectorAll('.nav-item');

  if (!video || !mainFlow) return;

  // Garante propriedades ideais para scrub sem som e inline
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.pause();

  let scrubTween = null;

  function initScrollytelling() {
    const rawDuration = video.duration;
    const dur = (!rawDuration || isNaN(rawDuration) || rawDuration <= 0) ? 10 : rawDuration;

    if (scrubTween) {
      if (scrubTween.scrollTrigger) {
        scrubTween.scrollTrigger.kill();
      }
      scrubTween.kill();
    }

    // Cria a timeline de sincronização 1:1 (0s no topo -> final do vídeo no final do scroll)
    scrubTween = gsap.fromTo(video, 
      { currentTime: 0 },
      {
        currentTime: Math.max(dur - 0.05, 0.1),
        ease: 'none',
        scrollTrigger: {
          trigger: mainFlow,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5, // Amortecimento suave de meio segundo
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Reforço direto de sincronização para todos os navegadores
            if (video.duration && !isNaN(video.duration)) {
              const target = self.progress * (video.duration - 0.05);
              if (Math.abs(video.currentTime - target) > 0.06) {
                try {
                  video.currentTime = target;
                } catch (e) {}
              }
            }
          }
        }
      }
    );

    // Desaparecimento suave do card do mapa ao aproximar do final da página
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

  // Destrava decodificador em dispositivos móveis no primeiro toque ou rolagem
  const unlockDecoder = () => {
    const p = video.play();
    if (p !== undefined) {
      p.then(() => video.pause()).catch(() => {});
    }
  };
  unlockDecoder();
  window.addEventListener('touchstart', unlockDecoder, { passive: true, once: true });
  window.addEventListener('scroll', unlockDecoder, { passive: true, once: true });
  window.addEventListener('click', unlockDecoder, { passive: true, once: true });

  // Inicializa imediatamente
  initScrollytelling();

  // Recalibra assim que metadados e buffers forem carregados
  if (video.readyState >= 1) {
    initScrollytelling();
  } else {
    video.addEventListener('loadedmetadata', initScrollytelling, { once: true });
    video.addEventListener('canplay', initScrollytelling, { once: true });
    video.addEventListener('loadeddata', initScrollytelling, { once: true });
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
    initScrollytelling();
    ScrollTrigger.refresh();
  });

  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
  });
});
