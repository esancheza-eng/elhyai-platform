// ============================================================
// app.js — ElhyAI
// Lógica principal: UI, navegación, cursos, certificados
// ============================================================

// ─── Datos de cursos ──────────────────────────────────────
const COURSES_DATA = [
  {
    id: "ia-desde-cero",
    title: "Inteligencia Artificial desde Cero",
    icon: "🤖",
    category: "IA",
    price: 49,
    originalPrice: 89,
    duration: "12 horas",
    level: "Principiante",
    modules: 8,
    students: 324,
    rating: 4.9,
    desc: "Aprende los fundamentos de la IA, machine learning y herramientas modernas sin experiencia previa.",
    color: "#1a4080",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  },
  {
    id: "marketing-ia",
    title: "Marketing Digital con IA",
    icon: "📈",
    category: "Marketing",
    price: 39,
    originalPrice: 75,
    duration: "8 horas",
    level: "Intermedio",
    modules: 6,
    students: 218,
    rating: 4.8,
    desc: "Domina las estrategias de marketing digital potenciadas por inteligencia artificial.",
    color: "#0a2a5c",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  },
  {
    id: "google-drive",
    title: "Google Drive Profesional",
    icon: "☁️",
    category: "Productividad",
    price: 25,
    originalPrice: 49,
    duration: "5 horas",
    level: "Básico",
    modules: 4,
    students: 156,
    rating: 4.7,
    desc: "Gestiona, organiza y colabora como un profesional usando todas las herramientas de Google Drive.",
    color: "#1a3060",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  },
  {
    id: "chatgpt-automatizacion",
    title: "Automatización con ChatGPT",
    icon: "⚡",
    category: "IA",
    price: 45,
    originalPrice: 85,
    duration: "10 horas",
    level: "Intermedio",
    modules: 7,
    students: 289,
    rating: 4.9,
    desc: "Automatiza tareas, crea flujos de trabajo y maximiza tu productividad con ChatGPT y prompting avanzado.",
    color: "#102050",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  },
  {
    id: "excel-datos",
    title: "Excel y Análisis de Datos",
    icon: "📊",
    category: "Datos",
    price: 35,
    originalPrice: 65,
    duration: "9 horas",
    level: "Intermedio",
    modules: 7,
    students: 401,
    rating: 4.8,
    desc: "Desde fórmulas básicas hasta dashboards avanzados y análisis predictivo con Excel.",
    color: "#0e3070",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  },
  {
    id: "cobranza-ia",
    title: "Cobranza Inteligente con IA",
    icon: "💼",
    category: "Finanzas",
    price: 55,
    originalPrice: 99,
    duration: "14 horas",
    level: "Avanzado",
    modules: 10,
    students: 142,
    rating: 5.0,
    desc: "Estrategias de cobranza modernas potenciadas con IA, automatización y negociación efectiva.",
    color: "#0a1e50",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  }
];

const TESTIMONIALS = [
  { name: "María González", role: "Emprendedora Digital", text: "Esta plataforma transformó mi negocio. El curso de IA desde cero fue increíble, muy bien explicado y práctico.", rating: 5, initials: "MG" },
  { name: "Carlos Mendoza", role: "Gerente Comercial", text: "El curso de Cobranza con IA fue exactamente lo que necesitaba. Las estrategias son reales y aplicables de inmediato.", rating: 5, initials: "CM" },
  { name: "Sofía Ramírez", role: "Community Manager", text: "Marketing Digital con IA me abrió nuevas oportunidades. Los certificados tienen un diseño muy profesional.", rating: 5, initials: "SR" },
  { name: "Luis Torres", role: "Contador", text: "El módulo de Excel y Análisis de Datos superó mis expectativas. Ahora automatizo reportes que antes me tomaban horas.", rating: 5, initials: "LT" },
  { name: "Ana Flores", role: "Asistente Administrativa", text: "Google Drive Profesional es simplemente revelador. Nunca imaginé que podía hacer tantas cosas con una herramienta gratuita.", rating: 4, initials: "AF" }
];

const FAQS = [
  { q: "¿Los cursos tienen fecha de vencimiento?", a: "No. Una vez que adquieres un curso tienes acceso de por vida a todo el contenido, incluyendo futuras actualizaciones." },
  { q: "¿Recibiré un certificado al finalizar?", a: "Sí. Al completar el 100% de los módulos y aprobar las evaluaciones, el sistema generará automáticamente tu certificado con código QR de validación." },
  { q: "¿Puedo acceder desde mi celular?", a: "Por supuesto. La plataforma es 100% responsive y funciona perfectamente en móvil, tablet y computadora." },
  { q: "¿Qué métodos de pago aceptan?", a: "Aceptamos tarjetas de crédito/débito (Visa, Mastercard), PayPal, transferencia bancaria y PayPhone para Ecuador." },
  { q: "¿Los cursos incluyen soporte?", a: "Sí. Cada curso incluye foro de preguntas y acceso al chat de WhatsApp para resolver dudas directamente con los instructores." },
  { q: "¿Puedo ver los videos sin internet?", a: "Los videos están optimizados para streaming. Para uso sin conexión recomendamos descargar el material complementario disponible en cada módulo." }
];

// ─── Inicialización principal ─────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavbar();
  initAOS();
  initBackToTop();
  initDarkMode();
  initFAQ();

  // Secciones dinámicas por página
  if (document.getElementById('courses-grid'))  renderCourses();
  if (document.getElementById('testimonials-track')) renderTestimonials();
  if (document.getElementById('faq-container')) renderFAQ();
  if (document.getElementById('hero-section'))  initHeroParticles();
  if (document.getElementById('search-input'))  initSearch();
});

// ─── Loading Screen ───────────────────────────────────────
function initLoadingScreen() {
  const ls = document.getElementById('loading-screen');
  if (!ls) return;
  setTimeout(() => ls.classList.add('hidden'), 1800);
}

// ─── Navbar ───────────────────────────────────────────────
function initNavbar() {
  const nav = document.querySelector('.navbar');
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');

  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      const spans = toggle.querySelectorAll('span');
      if (links.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translateY(7px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translateY(-7px)';
      } else {
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    });

    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      });
    });
  }

  // Activo según sección
  const sections = document.querySelectorAll('section[id]');
  const navAs = document.querySelectorAll('.nav-links a');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navAs.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`));
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => observer.observe(s));
}

// ─── AOS (Animate on Scroll) ──────────────────────────────
function initAOS() {
  const els = document.querySelectorAll('[data-aos]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('aos-animate'); });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
}

// ─── Back to Top ──────────────────────────────────────────
function initBackToTop() {
  const btn = document.querySelector('.back-top');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ─── Dark Mode ────────────────────────────────────────────
function initDarkMode() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  const saved = localStorage.getItem('liai-theme');
  if (saved === 'light') document.body.classList.add('light-mode');

  toggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('liai-theme', isLight ? 'light' : 'dark');
    toggle.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  });
}

// ─── Render Courses ───────────────────────────────────────
function renderCourses(filter = 'all') {
  const grid = document.getElementById('courses-grid');
  if (!grid) return;

  const filtered = filter === 'all' ? COURSES_DATA : COURSES_DATA.filter(c => c.category === filter);

  grid.innerHTML = filtered.map((c, i) => `
    <div class="course-card glass" data-aos="fade-up" data-aos-delay="${i * 80}" data-cat="${c.category}">
      <div class="course-thumb" style="background: linear-gradient(135deg, ${c.color}, #050d1a)">
        <div class="course-thumb-icon">${c.icon}</div>
        <div class="course-thumb-content">
          <span class="course-level-badge">
            <i class="fa-solid fa-signal"></i> ${c.level}
          </span>
          <div class="course-thumb-title">${c.title}</div>
        </div>
      </div>
      <div class="course-body">
        <div class="course-meta">
          <span><i class="fa-regular fa-clock"></i> ${c.duration}</span>
          <span><i class="fa-solid fa-book-open"></i> ${c.modules} módulos</span>
          <span><i class="fa-solid fa-star" style="color:#c9a84c"></i> ${c.rating}</span>
        </div>
        <p style="font-size:.85rem;color:var(--grey);line-height:1.6">${c.desc}</p>
        <div class="course-footer">
          <div class="course-price">
            $${c.price}
            <small>$${c.originalPrice}</small>
          </div>
          <div class="course-actions">
            <button class="btn btn-outline btn-sm" onclick="openCourseDetail('${c.id}')">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="btn btn-gold btn-sm" onclick="handleBuyCourse('${c.id}')">
              Comprar
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  initAOS();
}

// ─── Filtros de cursos ────────────────────────────────────
function initCourseFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCourses(btn.dataset.filter);
    });
  });
}

// ─── Detalle de curso (modal) ─────────────────────────────
function openCourseDetail(courseId) {
  const c = COURSES_DATA.find(c => c.id === courseId);
  if (!c) return;

  const overlay = document.getElementById('course-modal');
  if (!overlay) return;

  overlay.querySelector('#modal-title').textContent = c.title;
  overlay.querySelector('#modal-icon').textContent = c.icon;
  overlay.querySelector('#modal-desc').textContent = c.desc;
  overlay.querySelector('#modal-price').textContent = `$${c.price}`;
  overlay.querySelector('#modal-duration').textContent = c.duration;
  overlay.querySelector('#modal-modules').textContent = `${c.modules} módulos`;
  overlay.querySelector('#modal-level').textContent = c.level;
  overlay.querySelector('#modal-buy').onclick = () => handleBuyCourse(courseId);

  overlay.classList.add('open');
}

function closeCourseModal() {
  document.getElementById('course-modal')?.classList.remove('open');
}

// ─── Compra de curso ──────────────────────────────────────
function handleBuyCourse(courseId) {
  const user = getCurrentUser();
  if (!user) {
    showToast('Debes iniciar sesión para comprar un curso', 'info');
    setTimeout(() => window.location.href = 'login.html', 1500);
    return;
  }
  openPaymentModal(courseId);
}

function openPaymentModal(courseId) {
  const c = COURSES_DATA.find(c => c.id === courseId);
  if (!c) return;

  const modal = document.getElementById('payment-modal');
  if (!modal) { showToast('Procesando pago...', 'info'); return; }

  modal.querySelector('#pay-course-name').textContent = c.title;
  modal.querySelector('#pay-amount').textContent = `$${c.price}`;
  modal.classList.add('open');

  // Simular pago exitoso para demo
  modal.querySelector('#confirm-payment').onclick = () => {
    simulatePayment(courseId, c.title);
  };
}

function simulatePayment(courseId, courseTitle) {
  const modal = document.getElementById('payment-modal');
  if (modal) modal.classList.remove('open');

  showToast(`¡Pago exitoso! Accediendo a "${courseTitle}"...`, 'success');

  // Guardar en localStorage (en producción: Firestore)
  const user = getCurrentUser();
  if (user) {
    const purchased = JSON.parse(localStorage.getItem(`liai_courses_${user.id}`) || '[]');
    if (!purchased.includes(courseId)) purchased.push(courseId);
    localStorage.setItem(`liai_courses_${user.id}`, JSON.stringify(purchased));
  }

  setTimeout(() => {
    window.location.href = `dashboard.html?course=${courseId}`;
  }, 2000);
}

// ─── Render Testimonials ──────────────────────────────────
function renderTestimonials() {
  const track = document.getElementById('testimonials-track');
  if (!track) return;

  track.innerHTML = TESTIMONIALS.map(t => `
    <div class="testimonial-card glass">
      <div class="stars">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div>
      <p class="testimonial-text">"${t.text}"</p>
      <div class="testimonial-author">
        <div class="author-avatar">${t.initials}</div>
        <div class="author-info">
          <h5>${t.name}</h5>
          <span>${t.role}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ─── FAQ ──────────────────────────────────────────────────
function renderFAQ() {
  const container = document.getElementById('faq-container');
  if (!container) return;

  container.innerHTML = FAQS.map((f, i) => `
    <div class="faq-item" id="faq-${i}">
      <button class="faq-trigger" onclick="toggleFAQ(${i})">
        ${f.q}
        <span class="faq-icon"><i class="fa-solid fa-plus"></i></span>
      </button>
      <div class="faq-body" id="faq-body-${i}">
        <p>${f.a}</p>
      </div>
    </div>
  `).join('');
}

function initFAQ() { renderFAQ(); }

function toggleFAQ(i) {
  const item = document.getElementById(`faq-${i}`);
  const body = document.getElementById(`faq-body-${i}`);
  if (!item || !body) return;

  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(el => {
    el.classList.remove('open');
    el.querySelector('.faq-body')?.classList.remove('open');
  });

  if (!isOpen) {
    item.classList.add('open');
    body.classList.add('open');
  }
}

// ─── Search ───────────────────────────────────────────────
function initSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.course-card');
    cards.forEach(card => {
      const title = card.querySelector('.course-thumb-title')?.textContent.toLowerCase() || '';
      card.style.display = title.includes(q) || q === '' ? '' : 'none';
    });
  });
}

// ─── Hero Particles (Canvas) ──────────────────────────────
function initHeroParticles() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.4 + 0.05
  }));

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(32, 96, 192, ${p.alpha})`;
      ctx.fill();
    });

    // Lines between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(32, 96, 192, ${0.08 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.8;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ─── Auth helpers (localStorage demo) ────────────────────
function getCurrentUser() {
  const u = localStorage.getItem('liai_user');
  return u ? JSON.parse(u) : null;
}

function setCurrentUser(userData) {
  localStorage.setItem('liai_user', JSON.stringify(userData));
}

function logoutUser() {
  localStorage.removeItem('liai_user');
  showToast('Sesión cerrada correctamente', 'info');
  setTimeout(() => window.location.href = 'index.html', 1200);
}

// ─── Toast Notifications ──────────────────────────────────
function showToast(msg, type = 'info') {
  let container = document.querySelector('.notif-toast');
  if (!container) {
    container = document.createElement('div');
    container.className = 'notif-toast';
    document.body.appendChild(container);
  }

  const iconMap = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${iconMap[type]} toast-icon"></i>
    <span class="toast-msg">${msg}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4500);
}

// ─── Certificate Generator ────────────────────────────────
async function generateCertificate(studentName, courseName, courseId) {
  const { jsPDF } = window.jspdf;

  // Mostrar template HTML
  const template = document.getElementById('cert-template');
  if (template) {
    template.querySelector('#cert-student').textContent = studentName;
    template.querySelector('#cert-course').textContent = courseName;
    template.querySelector('#cert-date-val').textContent = new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });
    template.querySelector('#cert-code').textContent = generateCertCode(courseId);
    template.classList.add('visible');

    // QR
    if (window.QRCode) {
      const qrEl = document.getElementById('cert-qr');
      qrEl.innerHTML = '';
      new QRCode(qrEl, {
        text: `https://cursos.elhyai.com/validar?code=${generateCertCode(courseId)}`,
        width: 70, height: 70,
        colorDark: '#c9a84c', colorLight: '#050d1a'
      });
    }

    await new Promise(r => setTimeout(r, 800));

    try {
      const canvas = await html2canvas(template, { scale: 2, useCORS: true, backgroundColor: null });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [900, 630] });
      pdf.addImage(imgData, 'PNG', 0, 0, 900, 630);
      pdf.save(`Certificado-${courseName.replace(/\s+/g, '-')}.pdf`);
      showToast('Certificado descargado exitosamente 🎓', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error generando el certificado', 'error');
    }

    template.classList.remove('visible');
  }
}

function generateCertCode(courseId) {
  const ts = Date.now().toString(36).toUpperCase();
  const hash = (courseId + ts).split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0);
  return `LIAI-${Math.abs(hash).toString(36).toUpperCase().padStart(8, '0')}`;
}

// ─── Progress helpers ─────────────────────────────────────
function getProgress(courseId) {
  const user = getCurrentUser();
  if (!user) return 0;
  const prog = JSON.parse(localStorage.getItem(`liai_progress_${user.id}_${courseId}`) || '{}');
  return prog.percent || 0;
}

function setProgress(courseId, percent) {
  const user = getCurrentUser();
  if (!user) return;
  localStorage.setItem(`liai_progress_${user.id}_${courseId}`, JSON.stringify({ percent, updatedAt: Date.now() }));
}

function markModuleComplete(courseId, moduleIndex, totalModules) {
  const newPercent = Math.round(((moduleIndex + 1) / totalModules) * 100);
  setProgress(courseId, newPercent);

  document.querySelectorAll(`.progress-fill`).forEach(el => {
    if (el.dataset.course === courseId) {
      el.style.width = newPercent + '%';
    }
  });

  if (newPercent >= 100) {
    showToast('¡Módulo completado! Ya puedes descargar tu certificado 🎓', 'success');
  } else {
    showToast(`Módulo completado (${newPercent}%)`, 'success');
  }
}

// ─── Exportar funciones globales ──────────────────────────
window.LIAI = {
  renderCourses,
  initCourseFilters,
  openCourseDetail,
  closeCourseModal,
  handleBuyCourse,
  generateCertificate,
  getCurrentUser,
  setCurrentUser,
  logoutUser,
  showToast,
  toggleFAQ,
  markModuleComplete,
  getProgress,
  COURSES_DATA
};
