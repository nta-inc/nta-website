/* ============================================================
   ITSJO – Servidor de Pre-inscripciones
   server.js
   ============================================================ */

require('dotenv').config();
const express    = require('express');
const nodemailer = require('nodemailer');
const sqlite3    = require('sqlite3').verbose();
const { open }   = require('sqlite');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Middleware ───────────────────────────────────────────── */
app.use(express.json());
app.use(express.static(path.join(__dirname)));   // sirve index.html, styles.css, main.js

/* ── Base de datos SQLite ─────────────────────────────────── */
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
      fecha_creacion TEXT    DEFAULT (strftime('%d/%m/%Y %H:%M', 'now', 'localtime'))
    )
  `);
  console.log('✅ Base de datos lista (inscripciones.db)');
}

/* ── Configuración de correo (Gmail) ─────────────────────── */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,   // tu correo gmail
    pass: process.env.GMAIL_PASS,   // contraseña de aplicación (ver .env.example)
  },
});

/* ── Endpoint principal ───────────────────────────────────── */
app.post('/api/preinscripcion', async (req, res) => {
  const { nombres, apellidos, cedula, correo, telefono, curso, modalidad } = req.body;

  /* Validación básica */
  if (!nombres || !apellidos || !correo) {
    return res.status(400).json({ ok: false, error: 'Nombres, apellidos y correo son requeridos.' });
  }

  /* 1 ── Guardar en la base de datos */
  let nuevoId;
  try {
    const result = await db.run(
      `INSERT INTO preinscripciones (nombres, apellidos, cedula, correo, telefono, curso, modalidad)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombres, apellidos, cedula || '', correo, telefono || '', curso || '', modalidad || '']
    );
    nuevoId = result.lastID;
    console.log(`💾 Pre-inscripción #${nuevoId} guardada — ${nombres} ${apellidos}`);
  } catch (err) {
    console.error('Error guardando en BD:', err.message);
    return res.status(500).json({ ok: false, error: 'Error al guardar los datos.' });
  }

  /* 2 ── Enviar correo de notificación */
  const fechaHora = new Date().toLocaleString('es-DO', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Santo_Domingo',
  });

  const mailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
      <div style="background:#0a1628;padding:24px 28px">
        <h2 style="color:#fff;margin:0;font-size:18px">📋 Nueva Pre-inscripción #${nuevoId}</h2>
        <p style="color:#94a3b8;margin:6px 0 0;font-size:13px">National Technology Academy</p>
      </div>
      <div style="padding:28px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr style="border-bottom:1px solid #f1f5f9">
            <td style="padding:10px 0;color:#64748b;width:140px">Nombre completo:</td>
            <td style="padding:10px 0;font-weight:600;color:#1e293b">${nombres} ${apellidos}</td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9">
            <td style="padding:10px 0;color:#64748b">Cédula / Pasaporte:</td>
            <td style="padding:10px 0;color:#1e293b">${cedula || '—'}</td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9">
            <td style="padding:10px 0;color:#64748b">Correo:</td>
            <td style="padding:10px 0;color:#1e293b">${correo}</td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9">
            <td style="padding:10px 0;color:#64748b">Teléfono:</td>
            <td style="padding:10px 0;color:#1e293b">${telefono || '—'}</td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9">
            <td style="padding:10px 0;color:#64748b">Curso de interés:</td>
            <td style="padding:10px 0;font-weight:600;color:#2563eb">${curso || '—'}</td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9">
            <td style="padding:10px 0;color:#64748b">Modalidad:</td>
            <td style="padding:10px 0;color:#1e293b">${modalidad || '—'}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#64748b">Fecha y hora:</td>
            <td style="padding:10px 0;color:#1e293b">${fechaHora}</td>
          </tr>
        </table>
      </div>
      <div style="background:#f8fafc;padding:16px 28px;font-size:12px;color:#94a3b8;text-align:center">
        Este correo fue generado automáticamente por National Technology Academy.
      </div>
    </div>
  `;

  transporter.sendMail({
    from:    `"ITSJO Pre-inscripciones" <${process.env.GMAIL_USER}>`,
    to:      process.env.CORREO_DESTINO,
    subject: `Nueva Pre-inscripción #${nuevoId} — ${nombres} ${apellidos}`,
    html:    mailHtml,
  }, (err) => {
    if (err) {
      console.error('⚠️  Advertencia: no se pudo enviar el correo:', err.message);
    } else {
      console.log(`📧 Correo enviado a ${process.env.CORREO_DESTINO}`);
    }
  });

  /* 3 ── Responder al navegador */
  res.json({ ok: true, id: nuevoId });
});

/* ── Iniciar servidor ─────────────────────────────────────── */
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`   Abre esa URL en tu navegador para ver el sitio.\n`);
  });
}).catch(err => {
  console.error('Error iniciando la base de datos:', err);
  process.exit(1);
});
