# La Miga Dorada — proyecto organizado

Tienda web de panadería boutique con páginas de catálogo, registro, inicio de sesión, perfil, carrito y pedidos.

**Tecnologías:** HTML, CSS, JavaScript, Node.js, Express y Firebase Firestore.

## Estructura del proyecto

```text
la-miga-dorada/
├── public/                 # Sitio web que ve el cliente
│   ├── index.html           # Inicio (se conserva el diseño existente)
│   ├── productos.html
│   ├── nosotros.html
│   ├── login.html
│   ├── register.html
│   ├── recuperar.html
│   ├── perfil.html
│   ├── *.css
│   ├── img/                 # Imágenes
│   └── js/                  # Código del navegador y llamadas a la API
├── src/
│   ├── config/              # Configuración del servidor
│   ├── database/            # Conexión e inicialización de Firestore
│   ├── middleware/          # Validación del token
│   ├── routes/              # API de usuarios, productos, carrito y pedidos
│   └── utils/
├── scripts/                 # Migración opcional de la antigua SQLite
├── data/                    # Reservado para archivos locales; no subir datos privados
├── server.js                # Entrada del backend
├── package.json
├── .env.example             # Plantilla; copiar a .env
├── .gitignore
└── render.yaml              # Configuración opcional de despliegue en Render
```

## 1. Requisitos

- Instala Node.js 22 LTS: https://nodejs.org/
- Crea o utiliza un proyecto en Firebase: https://console.firebase.google.com/

## 2. Configura Firebase

1. En Firebase Console, abre **Firestore Database** y crea la base de datos.
2. En **Configuración del proyecto → Cuentas de servicio**, genera una clave privada.
3. Descarga el JSON y guárdalo en la raíz del proyecto como `firebase-service-account.json`.
4. **No subas ese archivo a GitHub ni lo compartas.** El `.gitignore` ya lo excluye.

Alternativamente, configura la variable `FIREBASE_SERVICE_ACCOUNT` con el JSON de la cuenta de servicio en tu entorno de ejecución.

## 3. Configura las variables

Copia `.env.example` con el nombre `.env` y genera un valor largo, aleatorio y privado para `JWT_SECRET`.

En PowerShell, puedes crear una clave aleatoria con:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copia el resultado en `.env` después de `JWT_SECRET=`. No compartas `.env`.

## 4. Instala y ejecuta

Abre esta carpeta en Visual Studio Code. En **Terminal → Nuevo terminal**, ejecuta:

```bash
npm install
npm start
```

Abre http://127.0.0.1:3000 en el navegador. **No uses Live Server para probar la integración**; abre la web mediante el servidor Node para que las rutas `/api` funcionen en el mismo origen.

La primera ejecución inicializa el catálogo de productos en Firestore. Para que funcione, las credenciales de Firebase deben estar configuradas correctamente.

## 5. Funciones incluidas

- Registro e inicio de sesión de usuarios.
- Contraseñas almacenadas como hash con bcrypt.
- Perfil de usuario.
- Catálogo de productos.
- Carrito por usuario.
- Creación y consulta de pedidos por usuario.
- API protegida con JWT.

## 6. GitHub y publicación

GitHub Pages solo sirve archivos estáticos y no ejecuta este backend. Para publicar el sistema completo, despliega el servicio Node en un hosting como Render y configura allí `FIREBASE_SERVICE_ACCOUNT` y `JWT_SECRET` como variables secretas.

El archivo `render.yaml` incluye una configuración inicial de Render. Revisa el despliegue y la persistencia de configuración antes de usarlo públicamente.

## Avisos de seguridad antes de producción

- No publiques nunca las credenciales de Firebase, el `.env`, tokens ni bases de datos con información real.
- La recuperación de contraseña actual es una implementación simplificada de demostración y no verifica la propiedad del correo. No debe usarse públicamente hasta integrarla con un flujo seguro de recuperación por correo.
- El servidor debe validar los precios del catálogo y el total de cada pedido antes de aceptar compras reales.
- Añade limitación de intentos al login, validación adicional de entradas y pruebas antes de usar datos reales.

## Datos SQLite antiguos

La base de datos SQLite antigua no se incluye en esta carpeta organizada, para evitar exponer datos personales. Si necesitas migrar cuentas o pedidos antiguos, conserva el archivo original en un lugar privado y realiza la migración de forma controlada siguiendo el script `scripts/migrate-sqlite-to-firebase.js`.
