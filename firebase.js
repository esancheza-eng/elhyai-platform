/* ============================================================
   firebase.js — ElhyAI Platform
   Configuración Firebase + Auth + Realtime Database
   Flujo de pago: el alumno solicita el curso, paga por transferencia,
   envía el comprobante por WhatsApp y el admin lo habilita en admin.html
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyApAGUjcrB_rQQgNioPUgmGk8K7CiXTR9k",
  authDomain:        "elhyai-platform.firebaseapp.com",
  databaseURL:       "https://elhyai-platform-default-rtdb.firebaseio.com",
  projectId:         "elhyai-platform",
  storageBucket:     "elhyai-platform.firebasestorage.app",
  messagingSenderId: "388824598893",
  appId:             "1:388824598893:web:c55274f47eedcb2143f264",
  measurementId:     "G-ELQ6DB1TW5"
};

/* ── Datos generales de la plataforma ───────────────────────── */
const SITE_URL        = 'https://academy.elhyai.com';
const WHATSAPP_NUMBER = '593989938910';

/* Catálogo base (id → título, precio, precio anterior, emoji, categoría).
   Nombres y precios se editan desde admin.html → "Cursos y precios";
   lo que guardes ahí (nodo "catalog" en Firebase) reemplaza estos valores. */
const COURSE_CATALOG = {
  'ia-cero':      { title: 'Inteligencia Artificial desde Cero',  price: 49, originalPrice: 79, emoji: '🤖', category: 'IA', modality: 'online' },
  'chatgpt-auto': { title: 'Automatización con ChatGPT',          price: 45, originalPrice: 75, emoji: '⚡', category: 'IA', modality: 'online' },
  'python-ia':    { title: 'Python para Inteligencia Artificial', price: 55, originalPrice: 89, emoji: '🐍', category: 'IA', modality: 'online' },
  'marketing-ia': { title: 'Marketing Digital con IA',            price: 39, originalPrice: 65, emoji: '📱', category: 'Marketing', modality: 'online' },
  'ventas-ia':    { title: 'Ventas Digitales con IA',             price: 45, originalPrice: 70, emoji: '🎯', category: 'Marketing', modality: 'online' },
  'ecommerce':    { title: 'E-Commerce con IA',                   price: 49, originalPrice: 80, emoji: '🛒', category: 'Marketing', modality: 'online' },
  'excel-datos':  { title: 'Excel y Análisis de Datos',           price: 35, originalPrice: 55, emoji: '📊', category: 'Datos', modality: 'online' },
  'finanzas':     { title: 'Finanzas Personales e Inversión',     price: 35, originalPrice: 55, emoji: '💳', category: 'Datos', modality: 'online' },
  'google-drive': { title: 'Google Drive Profesional',            price: 25, originalPrice: 40, emoji: '💾', category: 'Herramientas', modality: 'online' },
  'canva-ia':     { title: 'Diseño Digital con Canva e IA',       price: 29, originalPrice: 45, emoji: '🎨', category: 'Herramientas', modality: 'online' },
  'productivity': { title: 'Productividad con IA',                price: 29, originalPrice: 45, emoji: '⏱️', category: 'Herramientas', modality: 'online' },
  'cobranza-ia':  { title: 'Cobranza Inteligente con IA',         price: 55, originalPrice: 90, emoji: '💰', category: 'Cobranza', modality: 'online' }
};

/* ── Inicializar Firebase ───────────────────────────────────── */
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

const auth     = firebase.auth();
const database = firebase.database();

/* ══════════════════════════════════════════════════════════════
   CATÁLOGO EDITABLE (nombres y precios guardados por el admin)
══════════════════════════════════════════════════════════════ */

/* Aplica los cambios guardados en Firebase sobre COURSE_CATALOG.
   Las páginas esperan esta promesa antes de mostrar nombres y precios. */
const catalogReady = database.ref('catalog').once('value')
  .then(snap => {
    const saved = snap.val() || {};
    Object.keys(saved).forEach(id => {
      const c = saved[id];
      if (!COURSE_CATALOG[id]) {
        /* Curso creado desde el panel admin */
        if (!c || !c.custom) return;
        COURSE_CATALOG[id] = {
          title: c.title, price: c.price, originalPrice: (typeof c.originalPrice === 'number') ? c.originalPrice : null,
          emoji: c.emoji || (c.modality === 'presencial' ? '👥' : '📘'),
          category: c.category || 'General',
          modality: c.modality === 'presencial' ? 'presencial' : 'online',
          description: c.description || '', hours: c.hours || 0,
          date: c.date || '', location: c.location || '',
          materials: Array.isArray(c.materials) ? c.materials : (c.materials ? Object.values(c.materials) : []),
          visible: c.visible !== false, custom: true, createdAt: c.createdAt || 0
        };
        return;
      }
      if (typeof c.title === 'string' && c.title.trim()) COURSE_CATALOG[id].title = c.title.trim();
      if (typeof c.price === 'number') COURSE_CATALOG[id].price = c.price;
      COURSE_CATALOG[id].originalPrice = (typeof c.originalPrice === 'number') ? c.originalPrice : null;
    });
    return COURSE_CATALOG;
  })
  .catch(err => { console.warn('Catálogo por defecto:', err); return COURSE_CATALOG; });

/* Admin: guarda nombre, precio y precio anterior (opcional) de un curso */
async function saveCatalogCourse(courseId, { title, price, originalPrice }) {
  const course = COURSE_CATALOG[courseId];
  if (!course) throw new Error('unknown-course');
  const data = { title: String(title).trim(), price: Number(price), updatedAt: Date.now() };
  const op = Number(originalPrice);
  if (originalPrice !== '' && originalPrice != null && op > data.price) data.originalPrice = op;
  if (course.custom) {
    /* curso creado por el admin: se actualizan solo estos campos */
    await database.ref(`catalog/${courseId}`).update({ ...data, originalPrice: data.originalPrice ?? null });
  } else {
    await database.ref(`catalog/${courseId}`).set(data);
  }
  Object.assign(course, { title: data.title, price: data.price, originalPrice: data.originalPrice ?? null });
}

/* Admin: crea o edita un curso completo (online o presencial).
   materials: [{ title, url }] — enlaces de Google Drive, YouTube, etc. */
async function saveCustomCourse(courseId, f) {
  const isNew = !courseId;
  if (isNew) {
    const slug = String(f.title).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'curso';
    courseId = `${slug}-${Date.now().toString(36).slice(-4)}`;
  } else if (COURSE_CATALOG[courseId] && !COURSE_CATALOG[courseId].custom) {
    throw new Error('built-in-course');
  }
  const price = Number(f.price), op = Number(f.originalPrice);
  const materials = (f.materials || [])
    .map(m => ({ title: String(m.title || '').trim().slice(0, 120), url: String(m.url || '').trim() }))
    .filter(m => /^https?:\/\//i.test(m.url))
    .slice(0, 30)
    .map(m => ({ title: m.title || 'Material de apoyo', url: m.url }));
  const data = {
    custom: true,
    title: String(f.title).trim(),
    modality: f.modality === 'presencial' ? 'presencial' : 'online',
    category: String(f.category || 'General').trim().slice(0, 40) || 'General',
    emoji: String(f.emoji || '').trim().slice(0, 8) || (f.modality === 'presencial' ? '👥' : '📘'),
    description: String(f.description || '').trim().slice(0, 1500),
    price,
    hours: Number(f.hours) || 0,
    date: String(f.date || '').trim().slice(0, 60),
    location: String(f.location || '').trim().slice(0, 120),
    materials,
    visible: f.visible !== false,
    updatedAt: Date.now()
  };
  if (f.originalPrice !== '' && f.originalPrice != null && op > price) data.originalPrice = op;
  if (isNew) data.createdAt = Date.now();
  if (isNew) await database.ref(`catalog/${courseId}`).set(data);
  else await database.ref(`catalog/${courseId}`).update({ ...data, originalPrice: data.originalPrice ?? null });
  COURSE_CATALOG[courseId] = {
    ...(COURSE_CATALOG[courseId] || {}), ...data,
    originalPrice: data.originalPrice ?? null,
    createdAt: (COURSE_CATALOG[courseId] && COURSE_CATALOG[courseId].createdAt) || data.createdAt || 0
  };
  return courseId;
}

/* ══════════════════════════════════════════════════════════════
   CURSOS PRESENCIALES (participantes por cédula, sin cuenta)
══════════════════════════════════════════════════════════════ */

/* Normaliza cédula / pasaporte: solo letras y números, en mayúsculas */
function normalizeId(v) {
  return String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/* Valida cédula ecuatoriana (10 dígitos). Para pasaportes devuelve false. */
function isValidCedulaEC(c) {
  if (!/^\d{10}$/.test(c)) return false;
  const prov = Number(c.slice(0, 2));
  if (!((prov >= 1 && prov <= 24) || prov === 30)) return false;
  if (Number(c[2]) >= 6) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(c[i]) * (i % 2 === 0 ? 2 : 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return ((10 - (sum % 10)) % 10) === Number(c[9]);
}

async function getParticipants(courseId) {
  const snap = await database.ref(`participants/${courseId}`).once('value');
  return snap.val() || {};
}

/* Admin: agrega o actualiza participantes [{ name, cedula, company }] */
async function addParticipants(courseId, list) {
  const now = Date.now();
  const existing = await getParticipants(courseId);
  const updates = {};
  list.forEach(p => {
    const id = normalizeId(p.cedula);
    if (!id || !p.name) return;
    const prev = existing[id] || {};
    updates[`participants/${courseId}/${id}`] = {
      name: String(p.name).trim().slice(0, 120),
      cedula: id,
      company: String(p.company || '').trim().slice(0, 120),
      finished: !!prev.finished,
      addedAt: prev.addedAt || now,
      ...(prev.finishedAt ? { finishedAt: prev.finishedAt } : {}),
      ...(prev.certId ? { certId: prev.certId } : {})
    };
    updates[`cedulas/${id}/${courseId}`] = true;
  });
  if (Object.keys(updates).length) await database.ref().update(updates);
  return Object.keys(updates).length / 2;
}

async function removeParticipant(courseId, cedula) {
  const id = normalizeId(cedula);
  await database.ref().update({
    [`participants/${courseId}/${id}`]: null,
    [`cedulas/${id}/${courseId}`]: null
  });
}

/* Admin: marca como finalizados y emite el certificado (una sola vez por persona y curso) */
async function finishParticipants(courseId, cedulas) {
  await catalogReady;
  const course = COURSE_CATALOG[courseId] || {};
  const parts = await getParticipants(courseId);
  const now = Date.now();
  const updates = {};
  let count = 0;
  cedulas.map(normalizeId).forEach(id => {
    const p = parts[id];
    if (!p || p.finished) return;
    const certId = p.certId || newCertId();
    updates[`participants/${courseId}/${id}/finished`] = true;
    updates[`participants/${courseId}/${id}/finishedAt`] = now;
    updates[`participants/${courseId}/${id}/certId`] = certId;
    if (!p.certId) {
      updates[`certificates/${certId}`] = {
        certId, uid: 'presencial', courseId,
        courseTitle: course.title || courseId,
        studentName: p.name,
        modality: 'presencial',
        hours: course.hours || 0,
        location: course.location || '',
        courseDate: course.date || '',
        issuedAt: now,
        validUrl: certificateUrl(certId)
      };
    }
    count++;
  });
  if (count) await database.ref().update(updates);
  return count;
}

/* Admin: quita la marca de finalizado (el código de certificado se conserva) */
async function unfinishParticipant(courseId, cedula) {
  await database.ref(`participants/${courseId}/${normalizeId(cedula)}`).update({ finished: false, finishedAt: null });
}

/* Público: busca por cédula los cursos presenciales de una persona */
async function findByCedula(cedula) {
  const id = normalizeId(cedula);
  if (!id || id.length < 5 || id.length > 20) return [];
  await catalogReady;
  const idx = (await database.ref(`cedulas/${id}`).once('value')).val() || {};
  const out = [];
  for (const courseId of Object.keys(idx)) {
    const p = (await database.ref(`participants/${courseId}/${id}`).once('value')).val();
    if (!p) continue;
    let cert = null;
    if (p.finished && p.certId) cert = await validateCertificate(p.certId);
    out.push({ courseId, course: COURSE_CATALOG[courseId] || { title: courseId, materials: [] }, participant: p, cert });
  }
  return out;
}

/* ══════════════════════════════════════════════════════════════
   AUTH
══════════════════════════════════════════════════════════════ */

async function registerUser(name, email, password, phone = '') {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  await cred.user.updateProfile({ displayName: name });
  await database.ref('users/' + cred.user.uid).set({
    uid: cred.user.uid, name, email, phone,
    role: 'student', createdAt: Date.now()
  });
  return cred.user;
}

async function loginUser(email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  return cred.user;
}

async function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await auth.signInWithPopup(provider);
  await ensureUserProfile(cred.user);
  return cred.user;
}

async function logoutUser() {
  await auth.signOut();
  localStorage.removeItem('elhyai_user');
  location.href = 'index.html';
}

async function resetPassword(email) {
  auth.languageCode = 'es';
  await auth.sendPasswordResetEmail(email);
}

function onAuthStateChanged(callback) {
  return auth.onAuthStateChanged(callback);
}

/* ══════════════════════════════════════════════════════════════
   PERFIL
══════════════════════════════════════════════════════════════ */

/* Crea el perfil si no existe (usuarios antiguos o de Google) */
async function ensureUserProfile(user) {
  const ref  = database.ref('users/' + user.uid);
  const snap = await ref.once('value');
  if (snap.exists()) return snap.val();
  const profile = {
    uid: user.uid,
    name: user.displayName || (user.email || '').split('@')[0],
    email: user.email || '',
    phone: '',
    role: 'student',
    createdAt: Date.now()
  };
  await ref.set(profile);
  return profile;
}

async function getUserProfile(uid) {
  const snap = await database.ref('users/' + uid).once('value');
  return snap.val();
}

async function updateUserProfile(uid, data) {
  const allowed = {};
  if (data.name  !== undefined) allowed.name  = data.name;
  if (data.phone !== undefined) allowed.phone = data.phone;
  await database.ref('users/' + uid).update(allowed);
}

/* ══════════════════════════════════════════════════════════════
   SOLICITUDES DE CURSO (alumno)
══════════════════════════════════════════════════════════════ */

async function requestCourse(courseId) {
  const user = auth.currentUser;
  if (!user) throw new Error('not-logged-in');
  await catalogReady;
  const course = COURSE_CATALOG[courseId];
  if (!course) throw new Error('unknown-course');

  const enrolled = await isEnrolled(user.uid, courseId);
  if (enrolled) return { alreadyEnrolled: true };

  await database.ref(`requests/${user.uid}/${courseId}`).set({
    uid: user.uid,
    name: user.displayName || '',
    email: user.email || '',
    courseId,
    courseTitle: course.title,
    price: course.price,
    status: 'pending',
    requestedAt: Date.now()
  });
  return { alreadyEnrolled: false };
}

async function getMyRequests(uid) {
  const snap = await database.ref(`requests/${uid}`).once('value');
  return snap.val() || {};
}

/* Enlace de WhatsApp con el mensaje del comprobante ya escrito */
function whatsappPaymentLink(courseId, user) {
  const c = COURSE_CATALOG[courseId] || { title: courseId, price: '' };
  const msg =
    `Hola ElhyAI 👋, solicité el curso *${c.title}* ($${c.price}).\n` +
    `Nombre: ${user?.displayName || ''}\n` +
    `Correo: ${user?.email || ''}\n` +
    `Adjunto mi comprobante de pago (o envíenme los datos para transferir).`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

/* ══════════════════════════════════════════════════════════════
   CURSOS DEL ALUMNO
══════════════════════════════════════════════════════════════ */

async function getUserCourses(uid) {
  const snap = await database.ref(`users/${uid}/courses`).once('value');
  return snap.val() || {};
}

async function isEnrolled(uid, courseId) {
  const snap = await database.ref(`users/${uid}/courses/${courseId}`).once('value');
  return snap.exists();
}

/* ══════════════════════════════════════════════════════════════
   PROGRESO (por lección)
══════════════════════════════════════════════════════════════ */

/* Devuelve { courseId: { lessonId: timestamp } } */
async function getAllProgress(uid) {
  const snap = await database.ref(`users/${uid}/progress`).once('value');
  const raw  = snap.val() || {};
  const out  = {};
  Object.keys(raw).forEach(cid => { out[cid] = raw[cid].lessons || {}; });
  return out;
}

async function saveLessonComplete(uid, courseId, lessonId, percent) {
  const base = `users/${uid}/progress/${courseId}`;
  await database.ref().update({
    [`${base}/lessons/${lessonId}`]: Date.now(),
    [`${base}/percent`]: percent,
    [`${base}/updatedAt`]: Date.now()
  });
}

/* ══════════════════════════════════════════════════════════════
   CERTIFICADOS
══════════════════════════════════════════════════════════════ */

function newCertId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin O/0 ni I/1
  let id = '';
  const rnd = crypto.getRandomValues(new Uint32Array(10));
  for (let i = 0; i < 10; i++) id += chars[rnd[i] % chars.length];
  return 'ELHYAI-' + id;
}

function certificateUrl(certId) {
  return `${SITE_URL}/validar.html?code=${certId}`;
}

/* Emite el certificado una sola vez por curso; si ya existe, lo devuelve */
async function issueCertificate(uid, courseId, courseTitle, studentName) {
  const mine = await database.ref(`users/${uid}/certificates/${courseId}`).once('value');
  if (mine.exists()) return mine.val();

  const certId = newCertId();
  const certData = {
    certId, uid, courseId, courseTitle, studentName,
    issuedAt: Date.now(),
    validUrl: certificateUrl(certId)
  };
  await database.ref().update({
    [`certificates/${certId}`]: certData,
    [`users/${uid}/certificates/${courseId}`]: certData
  });
  return certData;
}

async function getUserCertificates(uid) {
  const snap = await database.ref(`users/${uid}/certificates`).once('value');
  return snap.val() || {};
}

async function validateCertificate(certId) {
  const snap = await database.ref(`certificates/${certId}`).once('value');
  return snap.val();
}

/* ══════════════════════════════════════════════════════════════
   ADMIN
══════════════════════════════════════════════════════════════ */

async function isAdmin(uid) {
  try {
    const snap = await database.ref(`admins/${uid}`).once('value');
    return snap.val() === true;
  } catch (e) {
    return false;
  }
}

async function getAllUsers() {
  const snap = await database.ref('users').once('value');
  return snap.val() || {};
}

async function getAllRequests() {
  const snap = await database.ref('requests').once('value');
  return snap.val() || {};
}

async function getAllPayments() {
  const snap = await database.ref('payments').once('value');
  return snap.val() || {};
}

async function getAllCertificates() {
  const snap = await database.ref('certificates').once('value');
  return snap.val() || {};
}

/* Habilita un curso: inscripción + pago + marca la solicitud como aprobada */
async function approveCourse(uid, courseId, amount, method = 'Transferencia') {
  await catalogReady;
  const course = COURSE_CATALOG[courseId] || { title: courseId };
  const now = Date.now();
  const paymentId = 'PAY-' + now;
  const updates = {
    [`users/${uid}/courses/${courseId}`]: {
      courseId, courseTitle: course.title, price: Number(amount) || 0,
      enrolledAt: now, approvedBy: auth.currentUser.uid
    },
    [`enrollments/${courseId}/${uid}`]: { uid, enrolledAt: now },
    [`payments/${paymentId}`]: {
      paymentId, uid, courseId, courseTitle: course.title,
      amount: Number(amount) || 0, method, status: 'completed', createdAt: now
    }
  };
  const req = await database.ref(`requests/${uid}/${courseId}`).once('value');
  if (req.exists()) {
    updates[`requests/${uid}/${courseId}/status`] = 'approved';
    updates[`requests/${uid}/${courseId}/updatedAt`] = now;
  }
  await database.ref().update(updates);
  return paymentId;
}

async function rejectRequest(uid, courseId) {
  await database.ref(`requests/${uid}/${courseId}`).update({
    status: 'rejected', updatedAt: Date.now()
  });
}

/* Quita el acceso a un curso (no borra el pago registrado) */
async function revokeCourse(uid, courseId) {
  const updates = {
    [`users/${uid}/courses/${courseId}`]: null,
    [`enrollments/${courseId}/${uid}`]: null
  };
  const req = await database.ref(`requests/${uid}/${courseId}`).once('value');
  if (req.exists()) {
    updates[`requests/${uid}/${courseId}/status`] = 'revoked';
    updates[`requests/${uid}/${courseId}/updatedAt`] = Date.now();
  }
  await database.ref().update(updates);
}

/* ══════════════════════════════════════════════════════════════
   REGLAS DE SEGURIDAD — copiar en Firebase Console → Realtime Database → Reglas
══════════════════════════════════════════════════════════════

{
  "rules": {
    "admins": {
      ".read": "auth != null && root.child('admins').child(auth.uid).val() === true",
      ".write": false,
      "$uid": { ".read": "$uid === auth.uid" }
    },
    "users": {
      ".read": "auth != null && root.child('admins').child(auth.uid).val() === true",
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "(auth != null && root.child('admins').child(auth.uid).val() === true) || ($uid === auth.uid && !data.exists() && !newData.child('courses').exists() && !newData.child('certificates').exists() && !newData.child('progress').exists())",
        "role": { ".validate": "newData.val() === 'student' || root.child('admins').child(auth.uid).val() === true" },
        "name": { ".write": "$uid === auth.uid", ".validate": "newData.isString() && newData.val().length <= 120" },
        "phone": { ".write": "$uid === auth.uid", ".validate": "newData.isString() && newData.val().length <= 30" },
        "progress": { ".write": "$uid === auth.uid" },
        "certificates": {
          "$courseId": { ".write": "$uid === auth.uid && !data.exists() && root.child('users').child($uid).child('courses').child($courseId).exists()" }
        }
      }
    },
    "requests": {
      ".read": "auth != null && root.child('admins').child(auth.uid).val() === true",
      "$uid": {
        ".read": "$uid === auth.uid",
        "$courseId": {
          ".write": "(auth != null && root.child('admins').child(auth.uid).val() === true) || ($uid === auth.uid && (!data.exists() || data.child('status').val() !== 'approved') && newData.child('status').val() === 'pending')"
        }
      }
    },
    "certificates": {
      ".read": "auth != null && root.child('admins').child(auth.uid).val() === true",
      "$certId": {
        ".read": true,
        ".write": "(auth != null && root.child('admins').child(auth.uid).val() === true && !data.exists()) || (auth != null && !data.exists() && newData.child('uid').val() === auth.uid && root.child('users').child(auth.uid).child('courses').child(newData.child('courseId').val()).exists())"
      }
    },
    "catalog": {
      ".read": true,
      "$courseId": {
        ".write": "auth != null && root.child('admins').child(auth.uid).val() === true",
        ".validate": "newData.hasChildren(['title', 'price'])",
        "title": { ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 120" },
        "price": { ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 10000" },
        "originalPrice": { ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 10000" },
        "updatedAt": { ".validate": "newData.isNumber()" },
        "createdAt": { ".validate": "newData.isNumber()" },
        "custom": { ".validate": "newData.isBoolean()" },
        "visible": { ".validate": "newData.isBoolean()" },
        "modality": { ".validate": "newData.val() === 'online' || newData.val() === 'presencial'" },
        "category": { ".validate": "newData.isString() && newData.val().length <= 40" },
        "emoji": { ".validate": "newData.isString() && newData.val().length <= 8" },
        "description": { ".validate": "newData.isString() && newData.val().length <= 1500" },
        "hours": { ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 1000" },
        "date": { ".validate": "newData.isString() && newData.val().length <= 60" },
        "location": { ".validate": "newData.isString() && newData.val().length <= 120" },
        "materials": {
          "$i": {
            "title": { ".validate": "newData.isString() && newData.val().length <= 120" },
            "url": { ".validate": "newData.isString() && newData.val().matches(/^https?:\\/\\//) && newData.val().length <= 500" },
            "$other": { ".validate": false }
          }
        },
        "$other": { ".validate": false }
      }
    },
    "participants": {
      ".read": "auth != null && root.child('admins').child(auth.uid).val() === true",
      "$courseId": {
        ".write": "auth != null && root.child('admins').child(auth.uid).val() === true",
        "$cedula": { ".read": true }
      }
    },
    "cedulas": {
      ".read": "auth != null && root.child('admins').child(auth.uid).val() === true",
      "$cedula": {
        ".read": true,
        ".write": "auth != null && root.child('admins').child(auth.uid).val() === true"
      }
    },
    "enrollments": {
      ".read": "auth != null && root.child('admins').child(auth.uid).val() === true",
      ".write": "auth != null && root.child('admins').child(auth.uid).val() === true"
    },
    "payments": {
      ".read": "auth != null && root.child('admins').child(auth.uid).val() === true",
      ".write": "auth != null && root.child('admins').child(auth.uid).val() === true"
    }
  }
}

══════════════════════════════════════════════════════════════ */

window.ElhyFirebase = {
  auth, database, SITE_URL, WHATSAPP_NUMBER, COURSE_CATALOG, catalogReady, saveCatalogCourse, saveCustomCourse,
  normalizeId, isValidCedulaEC, getParticipants, addParticipants, removeParticipant,
  finishParticipants, unfinishParticipant, findByCedula,
  registerUser, loginUser, loginWithGoogle, logoutUser,
  resetPassword, onAuthStateChanged,
  ensureUserProfile, getUserProfile, updateUserProfile,
  requestCourse, getMyRequests, whatsappPaymentLink,
  getUserCourses, isEnrolled,
  getAllProgress, saveLessonComplete,
  issueCertificate, getUserCertificates, validateCertificate, certificateUrl,
  isAdmin, getAllUsers, getAllRequests, getAllPayments, getAllCertificates,
  approveCourse, rejectRequest, revokeCourse
};
