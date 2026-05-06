/* ============================================================
   firebase.js — ElhyAI Platform
   Configuración real Firebase + Auth + Realtime Database
   ============================================================ */

/* ── SDK Firebase (CDN compatibilidad) ─────────────────────── */
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

/* ── Inicializar Firebase ───────────────────────────────────── */
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

const auth     = firebase.auth();
const database = firebase.database();

/* ══════════════════════════════════════════════════════════════
   AUTH HELPERS
══════════════════════════════════════════════════════════════ */

/* Registrar usuario con email/password */
async function registerUser(name, email, password, phone = '') {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  await cred.user.updateProfile({ displayName: name });

  /* Guardar perfil en Realtime DB */
  await database.ref('users/' + cred.user.uid).set({
    uid:       cred.user.uid,
    name,
    email,
    phone,
    role:      'student',
    createdAt: Date.now(),
    courses:   {},
    progress:  {}
  });

  return cred.user;
}

/* Login con email/password */
async function loginUser(email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  return cred.user;
}

/* Login con Google */
async function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await auth.signInWithPopup(provider);

  /* Si es nuevo usuario, crear perfil */
  const snap = await database.ref('users/' + cred.user.uid).once('value');
  if (!snap.exists()) {
    await database.ref('users/' + cred.user.uid).set({
      uid:       cred.user.uid,
      name:      cred.user.displayName,
      email:     cred.user.email,
      phone:     '',
      role:      'student',
      createdAt: Date.now(),
      courses:   {},
      progress:  {}
    });
  }
  return cred.user;
}

/* Logout */
async function logoutUser() {
  await auth.signOut();
  localStorage.removeItem('elhyai_user');
  location.href = 'index.html';
}

/* Recuperar contraseña */
async function resetPassword(email) {
  await auth.sendPasswordResetEmail(email);
}

/* Observer de sesión */
function onAuthStateChanged(callback) {
  return auth.onAuthStateChanged(callback);
}

/* ══════════════════════════════════════════════════════════════
   DATABASE HELPERS — USUARIOS
══════════════════════════════════════════════════════════════ */

async function getUserProfile(uid) {
  const snap = await database.ref('users/' + uid).once('value');
  return snap.val();
}

async function updateUserProfile(uid, data) {
  await database.ref('users/' + uid).update(data);
}

/* ══════════════════════════════════════════════════════════════
   DATABASE HELPERS — CURSOS / INSCRIPCIONES
══════════════════════════════════════════════════════════════ */

/* Inscribir estudiante en un curso */
async function enrollCourse(uid, courseId, courseTitle, price) {
  const enrollData = {
    courseId,
    courseTitle,
    price,
    enrolledAt: Date.now(),
    progress:   0,
    completed:  false
  };
  await database.ref(`users/${uid}/courses/${courseId}`).set(enrollData);
  /* Registrar en colección global de inscripciones */
  await database.ref(`enrollments/${courseId}/${uid}`).set({
    uid,
    enrolledAt: Date.now()
  });
  return enrollData;
}

/* Obtener cursos de un usuario */
async function getUserCourses(uid) {
  const snap = await database.ref(`users/${uid}/courses`).once('value');
  return snap.val() || {};
}

/* Verificar si usuario está inscrito */
async function isEnrolled(uid, courseId) {
  const snap = await database.ref(`users/${uid}/courses/${courseId}`).once('value');
  return snap.exists();
}

/* ══════════════════════════════════════════════════════════════
   DATABASE HELPERS — PROGRESO
══════════════════════════════════════════════════════════════ */

async function getProgress(uid, courseId) {
  const snap = await database.ref(`users/${uid}/progress/${courseId}`).once('value');
  return snap.val() || { completedModules: [], percent: 0 };
}

async function markModuleComplete(uid, courseId, moduleIndex, totalModules) {
  const progressRef = database.ref(`users/${uid}/progress/${courseId}`);
  const snap = await progressRef.once('value');
  const current = snap.val() || { completedModules: [] };

  const completed = current.completedModules || [];
  if (!completed.includes(moduleIndex)) {
    completed.push(moduleIndex);
  }
  const percent = Math.round((completed.length / totalModules) * 100);

  await progressRef.set({ completedModules: completed, percent, updatedAt: Date.now() });

  /* Si completó el 100%, marcar curso como completado */
  if (percent === 100) {
    await database.ref(`users/${uid}/courses/${courseId}`).update({
      completed: true,
      completedAt: Date.now(),
      progress: 100
    });
  } else {
    await database.ref(`users/${uid}/courses/${courseId}`).update({ progress: percent });
  }

  return percent;
}

/* ══════════════════════════════════════════════════════════════
   DATABASE HELPERS — CERTIFICADOS
══════════════════════════════════════════════════════════════ */

async function saveCertificate(uid, courseId, courseTitle, studentName) {
  const certId   = 'ELHYAI-' + Math.random().toString(36).substr(2, 10).toUpperCase();
  const certData = {
    certId,
    uid,
    courseId,
    courseTitle,
    studentName,
    issuedAt: Date.now(),
    validUrl: `https://cursos.elhyai.com/validar?code=${certId}`
  };
  await database.ref(`certificates/${certId}`).set(certData);
  await database.ref(`users/${uid}/certificates/${courseId}`).set(certData);
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
   DATABASE HELPERS — ADMIN
══════════════════════════════════════════════════════════════ */

async function getAllUsers() {
  const snap = await database.ref('users').once('value');
  return snap.val() || {};
}

async function getTotalEnrollments() {
  const snap = await database.ref('enrollments').once('value');
  return snap.val() || {};
}

async function savePayment(uid, courseId, amount, method) {
  const paymentId = 'PAY-' + Date.now();
  await database.ref(`payments/${paymentId}`).set({
    paymentId, uid, courseId, amount, method,
    status: 'completed',
    createdAt: Date.now()
  });
  return paymentId;
}

/* ══════════════════════════════════════════════════════════════
   REGLAS DE SEGURIDAD (copiar en Firebase Console → RTDB → Reglas)
══════════════════════════════════════════════════════════════

{
  "rules": {
    "users": {
      "$uid": {
        ".read":  "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "certificates": {
      ".read": true,
      "$certId": {
        ".write": "auth !== null"
      }
    },
    "enrollments": {
      ".read": "auth !== null",
      "$courseId": {
        "$uid": {
          ".write": "$uid === auth.uid"
        }
      }
    },
    "payments": {
      "$paymentId": {
        ".read":  "auth !== null",
        ".write": "auth !== null"
      }
    }
  }
}

══════════════════════════════════════════════════════════════ */

/* Exportar para uso global */
window.ElhyFirebase = {
  auth, database,
  registerUser, loginUser, loginWithGoogle, logoutUser,
  resetPassword, onAuthStateChanged,
  getUserProfile, updateUserProfile,
  enrollCourse, getUserCourses, isEnrolled,
  getProgress, markModuleComplete,
  saveCertificate, getUserCertificates, validateCertificate,
  getAllUsers, getTotalEnrollments, savePayment
};
