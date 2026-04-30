/* ============================================================
   NTA – Servidor completo
   server.js  (v3 – incluye Aula Virtual)
   ============================================================ */

require('dotenv').config();
const express    = require('express');
const nodemailer = require('nodemailer');
const sqlite3    = require('sqlite3').verbose();
const { open }   = require('sqlite');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Middleware ───────────────────────────────────────────── */
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ── Carpeta de uploads ───────────────────────────────────── */
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

/* ── Multer (subida de archivos) ─────────────────────────── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1e6) + ext;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf|mp4|mov|avi|mkv|webm/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  },
});

/* ── Base de datos ────────────────────────────────────────── */
let db;

async function initDB() {
  db = await open({ filename: 'inscripciones.db', driver: sqlite3.Database });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS preinscripciones (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      nombres        TEXT    NOT NULL,
      apellidos      TEXT    NOT NULL,
      cedula         TEXT,
      correo         TEXT    NOT NULL,
      telefono       TEXT,
      curso          TEXT,
      modalidad      TEXT,
      fecha_creacion TEXT DEFAULT (strftime('%d/%m/%Y %H:%M','now','localtime'))
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS clases (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre         TEXT    NOT NULL,
      curso          TEXT    NOT NULL,
      codigo         TEXT    NOT NULL UNIQUE,
      fecha_creacion TEXT DEFAULT (strftime('%d/%m/%Y','now','localtime'))
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS materiales (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      clase_id       INTEGER NOT NULL,
      tipo           TEXT    NOT NULL,
      titulo         TEXT    NOT NULL,
      descripcion    TEXT,
      url            TEXT    NOT NULL,
      fecha_creacion TEXT DEFAULT (strftime('%d/%m/%Y','now','localtime')),
      FOREIGN KEY (clase_id) REFERENCES clases(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Base de datos lista');
}

/* ── Correo ───────────────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
});

/* ═══════════════════════════════════════════════════════════
   RUTAS – PRE-INSCRIPCIÓN
═══════════════════════════════════════════════════════════ */
app.post('/api/preinscripcion', async (req, res) => {
  const { nombres, apellidos, cedula, correo, telefono, curso, modalidad } = req.body;
  if (!nombres || !apellidos || !correo)
    return res.status(400).json({ ok: false, error: 'Nombres, apellidos y correo son requeridos.' });

  let nuevoId;
  try {
    const result = await db.run(
      `INSERT INTO preinscripciones (nombres,apellidos,cedula,correo,telefono,curso,modalidad)
       VALUES (?,?,?,?,?,?,?)`,
      [nombres, apellidos, cedula||'', correo, telefono||'', curso||'', modalidad||'']
    );
    nuevoId = result.lastID;
    console.log(`💾 Pre-inscripción #${nuevoId} — ${nombres} ${apellidos}`);
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Error al guardar.' });
  }

  const fechaHora = new Date().toLocaleString('es-DO', {
    dateStyle:'full', timeStyle:'short', timeZone:'America/Santo_Domingo'
  });

  transporter.sendMail({
    from:    `"NTA Pre-inscripciones" <${process.env.GMAIL_USER}>`,
    to:      process.env.CORREO_DESTINO,
    subject: `Nueva Pre-inscripción #${nuevoId} — ${nombres} ${apellidos}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
        <div style="background:#0a1628;padding:24px 28px">
          <h2 style="color:#fff;margin:0;font-size:18px">📋 Nueva Pre-inscripción #${nuevoId}</h2>
          <p style="color:#94a3b8;margin:6px 0 0;font-size:13px">National Technology Academy</p>
        </div>
        <div style="padding:28px">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b;width:140px">Nombre</td><td style="padding:10px 0;font-weight:600">${nombres} ${apellidos}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">Cédula</td><td style="padding:10px 0">${cedula||'—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">Correo</td><td style="padding:10px 0">${correo}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">Teléfono</td><td style="padding:10px 0">${telefono||'—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">Curso</td><td style="padding:10px 0;font-weight:600;color:#2563eb">${curso||'—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:10px 0;color:#64748b">Modalidad</td><td style="padding:10px 0">${modalidad||'—'}</td></tr>
            <tr><td style="padding:10px 0;color:#64748b">Fecha</td><td style="padding:10px 0">${fechaHora}</td></tr>
          </table>
        </div>
      </div>`
  }, (err) => {
    if (err) console.error('⚠️ Correo no enviado:', err.message);
    else     console.log(`📧 Correo enviado a ${process.env.CORREO_DESTINO}`);
  });

  res.json({ ok: true, id: nuevoId });
});

/* ═══════════════════════════════════════════════════════════
   RUTAS – AULA VIRTUAL (ESTUDIANTE)
═══════════════════════════════════════════════════════════ */
app.get('/api/clase/:codigo', async (req, res) => {
  const codigo = req.params.codigo.toUpperCase();
  const clase  = await db.get('SELECT * FROM clases WHERE codigo = ?', [codigo]);
  if (!clase) return res.json({ ok: false });

  const materiales = await db.all('SELECT * FROM materiales WHERE clase_id = ?', [clase.id]);
  const clasif = { youtube:'videos', video:'videos', pdf:'pdfs', imagen:'imagenes' };
  materiales.forEach(m => m.tipo_grupo = clasif[m.tipo] || 'videos');

  res.json({ ok: true, clase, materiales });
});

/* ═══════════════════════════════════════════════════════════
   RUTAS – PANEL DEL PROFESOR
═══════════════════════════════════════════════════════════ */
app.post('/api/panel/login', (req, res) => {
  res.json({ ok: req.body.clave === process.env.PANEL_CLAVE });
});

app.get('/api/panel/clases', async (req, res) => {
  const clases = await db.all(`
    SELECT c.*, COUNT(m.id) as total_materiales
    FROM clases c LEFT JOIN materiales m ON m.clase_id = c.id
    GROUP BY c.id ORDER BY c.id DESC
  `);
  res.json({ ok: true, clases });
});

app.post('/api/panel/clases', async (req, res) => {
  const { nombre, curso, codigo } = req.body;
  if (!nombre || !codigo) return res.json({ ok: false, error: 'Faltan campos.' });
  try {
    const r = await db.run(
      'INSERT INTO clases (nombre,curso,codigo) VALUES (?,?,?)',
      [nombre, curso, codigo.toUpperCase()]
    );
    console.log(`📚 Clase creada: ${nombre} (${codigo})`);
    res.json({ ok: true, id: r.lastID });
  } catch {
    res.json({ ok: false, error: 'El código ya está en uso. Elige otro.' });
  }
});

app.delete('/api/panel/clases/:id', async (req, res) => {
  await db.run('DELETE FROM clases WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

app.get('/api/panel/materiales/:claseId', async (req, res) => {
  const mats = await db.all(
    'SELECT * FROM materiales WHERE clase_id = ? ORDER BY id DESC',
    [req.params.claseId]
  );
  res.json({ ok: true, materiales: mats });
});

app.post('/api/panel/materiales', async (req, res) => {
  const { clase_id, tipo, titulo, descripcion, url } = req.body;
  if (!clase_id || !titulo || !url) return res.json({ ok: false, error: 'Faltan campos.' });
  await db.run(
    'INSERT INTO materiales (clase_id,tipo,titulo,descripcion,url) VALUES (?,?,?,?,?)',
    [clase_id, tipo, titulo, descripcion||'', url]
  );
  res.json({ ok: true });
});

app.post('/api/panel/materiales/upload', upload.single('archivo'), async (req, res) => {
  if (!req.file) return res.json({ ok: false, error: 'No se recibió el archivo.' });
  const { clase_id, tipo, titulo, descripcion } = req.body;
  const url = '/uploads/' + req.file.filename;
  await db.run(
    'INSERT INTO materiales (clase_id,tipo,titulo,descripcion,url) VALUES (?,?,?,?,?)',
    [clase_id, tipo, titulo, descripcion||'', url]
  );
  console.log(`📎 Archivo subido: ${req.file.filename}`);
  res.json({ ok: true, url });
});

app.delete('/api/panel/materiales/:id', async (req, res) => {
  const mat = await db.get('SELECT * FROM materiales WHERE id = ?', [req.params.id]);
  if (mat && mat.url.startsWith('/uploads/')) {
    const fp = path.join(__dirname, mat.url);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  await db.run('DELETE FROM materiales WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

/* ── Iniciar ──────────────────────────────────────────────── */
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor en http://localhost:${PORT}`);
    console.log(`   Aula Virtual:   http://localhost:${PORT}/aula.html`);
    console.log(`   Panel Profesor: http://localhost:${PORT}/panel.html\n`);
  });
}).catch(err => { console.error('Error:', err); process.exit(1); });
