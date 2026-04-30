# Instrucciones para poner el sitio en funcionamiento

## Archivos incluidos

| Archivo | Qué hace |
|---|---|
| `server.js` | El servidor backend (Node.js) |
| `main.js` | JS del sitio (ya actualizado para llamar al servidor) |
| `index.html` | Tu página web (sin cambios) |
| `styles.css` | Estilos (sin cambios) |
| `package.json` | Lista de librerías necesarias |
| `.env.example` | Plantilla de configuración |
| `.gitignore` | Protege archivos sensibles de Git |

---

## Paso 1 — Instalar Node.js

Si no lo tienes, descárgalo de: https://nodejs.org  
Elige la versión **LTS** (la recomendada). Instálalo normalmente.

Para verificar que quedó instalado, abre la terminal (cmd en Windows) y escribe:
```
node --version
```
Debe mostrarte algo como `v20.x.x`.

---

## Paso 2 — Configurar el correo

1. Duplica el archivo `.env.example` y renómbralo exactamente a `.env`
2. Ábrelo con el Bloc de notas y rellena los tres datos:

```
GMAIL_USER=tucorreo@gmail.com
GMAIL_PASS=abcdabcdabcdabcd   ← contraseña de aplicación (ver abajo)
CORREO_DESTINO=correo_donde_llegan_inscripciones@gmail.com
```

### Cómo obtener la contraseña de aplicación de Gmail

1. Entra a **myaccount.google.com**
2. Ve a **Seguridad**
3. Activa **Verificación en 2 pasos** (si no está activa)
4. Luego busca **Contraseñas de aplicaciones**
5. Haz clic en **Crear** → ponle cualquier nombre (ej. "ITSJO")
6. Google te dará **16 letras** → cópialas y pégalas en `GMAIL_PASS` sin espacios

---

## Paso 3 — Instalar las librerías

Abre la terminal **dentro de la carpeta del proyecto** y ejecuta:

```
npm install
```

Esto descarga las librerías. Solo se hace una vez.

---

## Paso 4 — Iniciar el servidor

```
npm start
```

Verás en la terminal:
```
✅ Base de datos lista (inscripciones.db)
🚀 Servidor corriendo en http://localhost:3000
```

Abre **http://localhost:3000** en tu navegador y verás el sitio completo.

---

## ¿Dónde se guardan las inscripciones?

Se crea automáticamente un archivo llamado `inscripciones.db` en la misma carpeta.
Es una base de datos SQLite — puedes abrirla con la aplicación gratuita:

**DB Browser for SQLite** → https://sqlitebrowser.org

Ahí podrás ver todas las pre-inscripciones en una tabla con todos los datos y la fecha.

---

## ¿Cómo ver el servidor mientras desarrollas?

En vez de `npm start`, usa:
```
npm run dev
```
Esto usa **nodemon**, que reinicia el servidor automáticamente cada vez que guardas un cambio.

---

## Poner el sitio en internet (hosting)

Para que el sitio sea accesible desde cualquier lugar, necesitas un hosting que soporte Node.js. Las opciones más fáciles y económicas:

- **Railway** (railway.app) — gratis para proyectos pequeños, muy fácil
- **Render** (render.com) — gratis con límites, buen soporte Node.js
- **VPS de DigitalOcean o Hostinger** — más control, desde $4/mes

En todos los casos, las variables del `.env` se configuran en el panel del hosting, no se sube el archivo `.env`.
