/* ============================================================
   ITSJO – Instituto Tecnológico San José de Ocoa
   main.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Scroll progress bar ──────────────────────────────────── */
  const scrollBar = document.getElementById('scrollBar');
  window.addEventListener('scroll', () => {
    const scrollTop  = window.scrollY;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    const progress   = (scrollTop / docHeight) * 100;
    scrollBar.style.width = progress + '%';
  });

  /* ── Navbar: fondo más sólido al hacer scroll ─────────────── */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.style.background = window.scrollY > 50
      ? 'rgba(6,14,28,0.97)'
      : 'rgba(10,22,40,0.92)';
  });

  /* ── Menú hamburguesa (móvil) ─────────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  /* Cerrar menú al hacer clic en un enlace */
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });

  /* ── Reveal on scroll (IntersectionObserver) ──────────────── */
  const reveals  = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  reveals.forEach(el => observer.observe(el));

  /* ── Animación de contadores en las estadísticas ─────────── */
  function animateCounter(el, target, duration = 1500) {
    let start     = null;
    const suffix  = el.dataset.suffix || '';
    const step    = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const value    = Math.floor(progress * target);
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const nums = entry.target.querySelectorAll('.stat-num[data-count]');
        nums.forEach(num => {
          const target = parseInt(num.dataset.count, 10);
          animateCounter(num, target);
        });
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) statsObserver.observe(heroStats);

  /* ── Formulario de pre-inscripción ───────────────────────── */
  const form  = document.getElementById('formInscripcion');
  const toast = document.getElementById('toast');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btnSubmit = form.querySelector('button[type="submit"]');
      btnSubmit.disabled = true;
      btnSubmit.textContent = '⏳ Enviando...';

      const datos = {
        nombres:   document.getElementById('nombres').value.trim(),
        apellidos: document.getElementById('apellidos').value.trim(),
        cedula:    document.getElementById('cedula').value.trim(),
        correo:    document.getElementById('correo').value.trim(),
        telefono:  document.getElementById('telefono').value.trim(),
        curso:     document.getElementById('curso').value,
        modalidad: document.getElementById('modalidad').value,
      };

      try {
        const res  = await fetch('/api/preinscripcion', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(datos),
        });
        const json = await res.json();

        if (json.ok) {
          mostrarToast('✅ ¡Pre-inscripción enviada! Te contactaremos pronto.');
          form.reset();
        } else {
          mostrarToast('❌ Error: ' + (json.error || 'Intenta de nuevo'));
        }
      } catch (err) {
        mostrarToast('❌ Error de conexión. Verifica tu internet e intenta de nuevo.');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = '✦ Enviar Pre-inscripción';
      }
    });
  }

  function mostrarToast(mensaje) {
    toast.textContent = mensaje;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  }

  /* ── Active nav link según sección visible ────────────────── */
  const sections   = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navAnchors.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => sectionObserver.observe(s));

});
