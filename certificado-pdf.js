/* ============================================================
   certificado-pdf.js — ElhyAI Platform
   Diseño del certificado (clásico elegante) compartido por
   dashboard.html (cursos online) y certificado.html (presenciales).
   Requiere jsPDF y qrcodejs cargados antes que este archivo.
   ============================================================ */

const NAVY = [30, 58, 95], GOLD = [201, 146, 26], INK = [33, 37, 41], GREY = [108, 117, 125];

/* Texto centrado con espaciado entre letras (jsPDF no lo centra bien solo) */
function textSpaced(doc, text, x, y, cs) {
  const w = doc.getTextWidth(text) + cs * (text.length - 1);
  doc.text(text, x - w / 2, y, { charSpace: cs });
}

function fitText(doc, text, maxW, size, minSize) {
  let s = size;
  doc.setFontSize(s);
  while (doc.getTextWidth(text) > maxW && s > minSize) { s -= 0.5; doc.setFontSize(s); }
  return s;
}

/* B · Clásico elegante */
function drawCertClassic(doc, d) {
  doc.setFillColor(255, 255, 255); doc.rect(0, 0, 297, 210, 'F');
  // marco
  doc.setDrawColor(...NAVY); doc.setLineWidth(2.2); doc.rect(9, 9, 279, 192);
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.8); doc.rect(13, 13, 271, 184);
  doc.setLineWidth(0.3); doc.rect(15.5, 15.5, 266, 179);
  // esquinas decorativas
  doc.setFillColor(...GOLD);
  [[15.5, 15.5], [281.5, 15.5], [15.5, 194.5], [281.5, 194.5]].forEach(([x, y]) => doc.circle(x, y, 1.6, 'F'));

  if (d.logo) doc.addImage(d.logo, 'PNG', 119.5, 22, 58, 21.5, 'logo');
  else {
    doc.setTextColor(...NAVY); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text('ElhyAi Consultores', 148.5, 36, { align: 'center' });
  }

  doc.setTextColor(...NAVY); doc.setFont('times', 'bold'); doc.setFontSize(34);
  textSpaced(doc, 'CERTIFICADO', 148.5, 61, 2);
  doc.setTextColor(...GOLD); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  textSpaced(doc, 'DE FINALIZACIÓN DE CURSO', 148.5, 68.5, 1.6);

  doc.setTextColor(...GREY); doc.setFont('times', 'italic'); doc.setFontSize(13);
  doc.text('Se otorga el presente certificado a', 148.5, 83, { align: 'center' });

  doc.setTextColor(...NAVY); doc.setFont('times', 'bolditalic');
  fitText(doc, d.name, 220, 32, 20);
  doc.text(d.name, 148.5, 100, { align: 'center' });
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.5); doc.line(68.5, 104.5, 228.5, 104.5);

  doc.setTextColor(...GREY); doc.setFont('times', 'italic'); doc.setFontSize(12.5);
  doc.text(d.lead || 'por haber completado satisfactoriamente el curso', 148.5, 116, { align: 'center' });
  doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
  const lines = doc.splitTextToSize(d.course, 210).slice(0, 2);
  doc.text(lines, 148.5, 127, { align: 'center' });
  if (d.detail) {
    doc.setTextColor(...GREY); doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    doc.text(d.detail, 148.5, 127 + (lines.length - 1) * 7 + 7.5, { align: 'center' });
  }

  // Pie: fecha · sello · firma
  const y = 158;
  doc.setDrawColor(...INK); doc.setLineWidth(0.3);
  doc.line(38, y, 108, y); doc.line(189, y, 259, y);
  // firma manuscrita del instructor (imagen PNG con fondo transparente)
  if (d.signature) {
    const h = Math.min(24, 76 * d.signature.ratio), w = h / d.signature.ratio;   // máx. 76 mm de ancho, 24 mm de alto
    doc.addImage(d.signature.data, 'PNG', 224 - w / 2, y - h + 1.8, w, h, 'firma');
  }
  doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text(d.date, 73, y - 3, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...GREY);
  doc.text('Fecha de emisión', 73, y + 5, { align: 'center' });

  doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text(d.instructor, 224, y + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...GREY);
  doc.text('Instructor', 224, y + 10, { align: 'center' });
  doc.setFontSize(7.8);
  doc.text(`Registro del título: ${d.reg}`, 224, y + 14.5, { align: 'center' });

  // sello central
  doc.setFillColor(...GOLD); doc.circle(148.5, y, 15, 'F');
  doc.setFillColor(...NAVY); doc.circle(148.5, y, 12.5, 'F');
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.4); doc.circle(148.5, y, 10.8, 'S');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  doc.text('ElhyAi', 148.5, y - 0.5, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(4.8);
  textSpaced(doc, 'CERTIFICADO', 148.5, y + 3.5, 0.4);

  // QR + código
  if (d.qr) {
    doc.setFillColor(255, 255, 255); doc.rect(18, 163, 28, 28, 'F');   // margen blanco para el lector
    doc.addImage(d.qr, 'PNG', 19, 164, 26, 26);
  }
  doc.setTextColor(...GREY); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text('Escanea el QR o ingresa el código en:', 50, 177);
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK); doc.setFontSize(8);
  doc.text(d.code, 50, 182.5);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...GREY); doc.setFontSize(7);
  doc.text(d.url.replace('https://', '').replace(/\?code=.*$/, ''), 50, 187.5);
}

/* Datos del instructor que aparecen en el certificado */
const INSTRUCTOR_NAME      = 'Master Elhy Christian Sánchez Arreaga';
const INSTRUCTOR_TITLE_REG = '1024-2023-2621298';

/* Carga una imagen del sitio como dataURL para el PDF (null si falla) */
function loadImageData(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve(c.toDataURL('image/png'));
      } catch (e) { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}


/* Carga la firma (si existe) y su proporción alto/ancho */
function loadSignature(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve({ data: c.toDataURL('image/png'), ratio: img.naturalHeight / img.naturalWidth });
      } catch (e) { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/* Genera y descarga el PDF de un certificado guardado en Firebase */
async function downloadCertificatePDF(cert) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  const url = ElhyFirebase.certificateUrl(cert.certId);

  let qr = null;
  if (window.QRCode) {
    const holder = document.createElement('div');
    new QRCode(holder, { text: url, width: 512, height: 512, correctLevel: QRCode.CorrectLevel.L });
    const qrCanvas = holder.querySelector('canvas');
    if (qrCanvas) qr = qrCanvas.toDataURL('image/png');
  }

  const presencial = cert.modality === 'presencial';
  const detail = presencial
    ? [cert.hours ? `Duración: ${cert.hours} ${Number(cert.hours) === 1 ? 'hora' : 'horas'}` : '', cert.location || '', cert.courseDate || ''].filter(Boolean).join('  ·  ')
    : '';

  drawCertClassic(doc, {
    name: cert.studentName,
    course: cert.courseTitle,
    date: new Date(cert.issuedAt).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' }),
    code: cert.certId,
    url,
    lead: presencial ? 'por haber aprobado satisfactoriamente el curso presencial' : null,
    detail,
    logo: await loadImageData('logo-elhyai.png'),
    signature: await loadSignature('firma-elhy.png'),
    qr,
    instructor: INSTRUCTOR_NAME,
    reg: INSTRUCTOR_TITLE_REG
  });

  const safe = String(cert.courseTitle || 'curso').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').slice(0, 30);
  doc.save(`Certificado-ElhyAI-${safe}.pdf`);
}
