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

/* Catálogo único (id → título, precio, emoji, categoría).
   Si cambias un precio, cámbialo aquí. */
const COURSE_CATALOG = {
  'ia-cero':      { title: 'Inteligencia Artificial desde Cero',  price: 49, emoji: '🤖', category: 'IA' },
  'chatgpt-auto': { title: 'Automatización con ChatGPT',          price: 45, emoji: '⚡', category: 'IA' },
  'python-ia':    { title: 'Python para Inteligencia Artificial', price: 55, emoji: '🐍', category: 'IA' },
  'marketing-ia': { title: 'Marketing Digital con IA',            price: 39, emoji: '📱', category: 'Marketing' },
  'ventas-ia':    { title: 'Ventas Digitales con IA',             price: 45, emoji: '🎯', category: 'Marketing' },
  'ecommerce':    { title: 'E-Commerce con IA',                   price: 49, emoji: '🛒', category: 'Marketing' },
  'excel-datos':  { title: 'Excel y Análisis de Datos',           price: 35, emoji: '📊', category: 'Datos' },
  'finanzas':     { title: 'Finanzas Personales e Inversión',     price: 35, emoji: '💳', category: 'Datos' },
  'google-drive': { title: 'Google Drive Profesional',            price: 25, emoji: '💾', category: 'Herramientas' },
  'canva-ia':     { title: 'Diseño Digital con Canva e IA',       price: 29, emoji: '🎨', category: 'Herramientas' },
  'productivity': { title: 'Productividad con IA',                price: 29, emoji: '⏱️', category: 'Herramientas' },
  'cobranza-ia':  { title: 'Cobranza Inteligente con IA',         price: 55, emoji: '💰', category: 'Cobranza' }
};

/* ── Inicializar Firebase ───────────────────────────────────── */
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

const auth     = firebase.auth();
const database = firebase.database();

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
        ".write": "auth != null && !data.exists() && newData.child('uid').val() === auth.uid && root.child('users').child(auth.uid).child('courses').child(newData.child('courseId').val()).exists()"
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
  auth, database, SITE_URL, WHATSAPP_NUMBER, COURSE_CATALOG,
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
