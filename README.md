# Fichero de Clientes — Datos para Factura (versión Firebase, sin instalar nada)

Página web para registrar y consultar los datos de tus clientes (nombre, RUC/cédula,
dirección, teléfono, correo, ciudad) que necesitas para hacer una factura. Los datos
se guardan en Firestore (la base de datos de Firebase), y la página se conecta
directamente desde el navegador — no hace falta instalar Java, Node, ni ningún programa.

## Cómo funciona

- `index.html` — la página (formulario + listado de clientes)
- `style.css` — el diseño visual
- `app.js` — la lógica que guarda/lee/edita/borra clientes en Firestore
- `firebase-config.js` — aquí pegas las claves de TU proyecto de Firebase

## Paso 1 — Crear el proyecto en Firebase

1. Ve a https://console.firebase.google.com con tu cuenta de Google.
2. Clic en "Agregar proyecto" (o "Add project").
3. Dale un nombre, por ejemplo `fichero-clientes`, y sigue los pasos (puedes
   desactivar Google Analytics, no lo necesitas para esto).

## Paso 2 — Activar Firestore (la base de datos)

1. En el menú izquierdo, entra a "Compilación" → "Firestore Database".
2. Clic en "Crear base de datos".
3. Elige el modo **"Iniciar en modo de prueba"** (test mode) — así puedes leer y
   escribir sin configurar seguridad avanzada todavía.
4. Elige la ubicación del servidor más cercana (por ejemplo, una región de EE.UU.
   o Sudamérica, la que te sugiera por defecto está bien).

## Paso 3 — Registrar tu página web dentro del proyecto

1. En la página principal del proyecto (ícono de casita), busca el ícono `</>`
   ("agregar app web") y haz clic.
2. Ponle un apodo, por ejemplo `fichero-web` (no necesitas marcar "Firebase Hosting").
3. Firebase te va a mostrar un bloque de código con `firebaseConfig = { apiKey: ..., ... }`.
   **Copia esos valores completos.**

## Paso 4 — Pegar tu configuración

Abre el archivo `firebase-config.js` de este proyecto y reemplaza los valores de
ejemplo por los tuyos, tal como te los mostró Firebase.

## Paso 5 — Publicarla para poder usarla desde cualquier dispositivo

Como es una página estática (sin servidor), la forma más fácil sin instalar nada es
subirla a GitHub Pages, directamente desde el navegador:

1. Crea una cuenta gratis en https://github.com si no tienes.
2. Clic en "New repository", nómbralo por ejemplo `fichero-clientes`, y créalo
   como público.
3. Dentro del repositorio, usa el botón "Add file" → "Upload files", y arrastra
   los 4 archivos de esta carpeta (`index.html`, `style.css`, `app.js`,
   `firebase-config.js`). Confirma con "Commit changes".
4. Ve a la pestaña "Settings" del repositorio → sección "Pages" (menú izquierdo).
5. En "Branch", elige `main` y guarda.
6. GitHub te va a dar una dirección como `https://tu-usuario.github.io/fichero-clientes/`.
   Esa es tu página, accesible desde cualquier computadora o tablet con internet.

## Nota sobre seguridad

El "modo de prueba" de Firestore permite que cualquiera con el link pueda leer y
escribir datos durante 30 días, luego se bloquea solo. Para uso personal está bien
para empezar, pero si vas a compartir el link ampliamente, dime y te ayudo a
configurar reglas de seguridad más estrictas (por ejemplo, pedir una contraseña
simple antes de guardar datos).
