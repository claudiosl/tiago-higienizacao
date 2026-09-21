/**
 * ==========================================================================
 * TIAGO HIGIENIZAÇÃO - EXPERIÊNCIA CINEMATOGRÁFICA SCROLLYTELLING
 * Controle ultra-fluido de vídeo na memória (Blob Object URL + GSAP ScrollTrigger)
 * ==========================================================================
 */

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', async () => {
  const video = document.getElementById('scrolly-video');
  const mainFlow = document.querySelector('.scrolly-main-flow');
  const sections = document.querySelectorAll('.flow-section');
  const navItems = document.querySelectorAll('.nav-item');

  if (!video || !mainFlow) return;

  // Garante propriedades ideais de reprodução
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.pause();

  /**
   * 1. Carregamento do MP4 em memória via Blob Object URL
   * Elimina requisições HTTP parciais (byte-range) a cada mudança de currentTime
   */
  async function loadVideoBlob() {
    const candidateUrls = [
      'videos/higienizacao-veicular.webm',
      '/videos/higienizacao-veicular.webm',
      'videos/higienizacao-veicular.mp4',
      '/videos/higienizacao-veicular.mp4'
    ];

    for (const url of candidateUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          
          // Aplica o Blob no vídeo
          video.src = objectUrl;
          video.load();
          return true;
        }
      } catch (err) {
        // Tenta próxima URL candidata
      }
    }
    return false;
  }

  /**
   * 2. Inicialização do Scrollytelling de Alta Fluidez
   */
  function setupFluidScrolly() {
    video.pause();
    const duration = video.duration || 10;
    
    let targetTime = 0;
    let isSeeking = false;
    let rafId = null;

    // Render loop otimizado com requestAnimationFrame para evitar gargalos do decoder
    function renderVideoFrame() {
      if (!isSeeking && video.readyState >= 2) {
        const diff = targetTime - video.currentTime;
        if (Math.abs(diff) > 0.015) {
          isSeeking = true;
          try {
            if ('fastSeek' in video) {
              video.fastSeek(targetTime);
            } else {
              video.currentTime = targetTime;
            }
          } catch (e) {
            video.currentTime = targetTime;
          }
        }
      }
      rafId = requestAnimationFrame(renderVideoFrame);
    }

    // Libera a trava de seek assim que o frame é decodificado
    video.addEventListener('seeked', () => {
      isSeeking = false;
    });

    // Inicia o render loop
    renderVideoFrame();

    // GSAP Timeline com ScrollTrigger acoplado às 5 seções
    const progressProxy = { val: 0 };

    gsap.timeline({
      scrollTrigger: {
        trigger: mainFlow,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2, // Scrub mais suave e estendido para maior tempo de apreciação do vídeo
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          targetTime = Math.min(Math.max(self.progress * duration, 0), duration - 0.05);
        }
      }
    });

    // Desaparecimento suave do mapa ao rolar para o final (revelação total do carro)
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

    // Força atualização das dimensões e triggers
    ScrollTrigger.refresh();
  }

  // Executa o carregamento em memória como Blob
  const loadedAsBlob = await loadVideoBlob();

  // Aguarda os metadados do vídeo antes de inicializar o ScrollTrigger
  if (video.readyState >= 1 && video.duration && !isNaN(video.duration)) {
    setupFluidScrolly();
  } else {
    video.addEventListener('loadedmetadata', setupFluidScrolly, { once: true });
    // Fallback de canplay
    video.addEventListener('canplay', () => {
      if (video.duration && !isNaN(video.duration)) {
        setupFluidScrolly();
      }
    }, { once: true });
  }

  /**
   * 3. Sincronização de etapas no cabeçalho fixo
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

  // Recalibra ScrollTrigger no carregamento final e redimensionamento
  window.addEventListener('load', () => {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  });

  window.addEventListener('resize', () => {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  });
});
