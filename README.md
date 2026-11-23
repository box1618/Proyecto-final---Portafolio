# FINALE PROJECT ---Portafolio ArtSphere

> A centralized, interactive, and high-performance web platform designed for visual artists, designers, and illustrators to showcase their artwork in high resolution and manage custom commission requests without algorithmic distractions.

---

## Project Overview
Publicar y organizar obras artísticas en redes sociales tradicionales suele limitar la presentación visual y la interacción directa. Resuelve este problema ofreciendo un espacio dinámico donde los artistas pueden categorizar sus piezas, mostrar galerías optimizadas en alta resolución, detallar sus procesos creativos y permitir a los clientes solicitar comisiones personalizadas de manera directa.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **Backend** | Node.js, Express.js (RESTful API Architecture) |
| **Database** | MongoDB con Mongoose |
| **Libraries & Tools** | TypeScript, bcrypt, JSON Web Token |

---

## Estructura del Frontend

```text
frontend/
├── index.html
├── css/
│   ├── styles.css
│   ├── servicios.css
│   ├── auth.css
│   └── portal-style.css
├── js/
│   ├── auth.js
│   ├── commission-request.js
│   ├── config.js
│   └── services.js
└── pages/
    ├── art.html
    ├── animation-art.html
    ├── concept-art.html
    ├── login.html
    ├── portal.html
    ├── portfolio.html
    └── register.html
```

El frontend es estático y vive por completo en `frontend/`. `services.js` controla las opciones de las fichas; `auth.js` conecta el registro/inicio de sesión y `commission-request.js` envía las solicitudes al API. La URL del API para desarrollo se configura en `frontend/js/config.js`.

## Database Entity-Relationship (MongoDB)
El sistema está estructurado mediante colecciones orientadas a documentos NoSQL:
* **`USERS`**: Almacena perfiles de clientes y del artista administrador (`role`, `email`, contraseña encriptada).
* **`CATEGORIES`**: Clasifica los estilos técnicos del arte (ej. *Digital Illustration*, *Traditional Painting*).
* **`ARTWORKS`**: Contiene las piezas visuales, su enlace multimedia optimizado y detalles del proceso creativo (`artistId`, `categoryId`).
* **`COMMISSIONS`**: Gestiona las solicitudes de encargos personalizados hechas por los clientes (`clientId`, presupuesto, estado del proyecto).
![Insertar imagen](./images/entidad.png)
---

## Key Features & User Stories 
- [x] **High-Resolution Gallery:** Exploración de obras de arte adaptadas a una cuadrícula responsiva sin compresión agresiva
- [x] **Dynamic Filtering:** Filtrado rápido de piezas según su categoría o estilo artístico
- [x] **Creative Process Details:** Visualización de bocetos, paletas de colores y notas del autor para cada proyecto
- [x] **Secure Authentication:** Registro e inicio de sesión diferenciado para clientes y administrador
- [x] **Commission System:** Formulario para que los usuarios soliciten proyectos y servicios artísticos personalizados

##  Getting Started & Installation
1. Instala las dependencias desde la raíz del repositorio:

   ```powershell
   npm install
   ```

2. Copia `backend/src/.env.example` como `backend/src/.env` y configura `MONGO_URI`, un `JWT_SECRET` aleatorio de al menos 32 caracteres y `ARTIST_USER_ID`.

3. Registra una cuenta desde el sitio. Para asignarla como artista, cambia su campo `role` a `artist` en MongoDB y copia su `_id` en `ARTIST_USER_ID`. Reinicia el backend después de cambiar el archivo `.env`.

4. Inicia el API desde la raíz:

   ```powershell
   npm run dev
   ```

5. En otra terminal, sirve la carpeta `frontend` como sitio estático, por ejemplo:

   ```powershell
   py -m http.server 5500 --directory frontend
   ```

   Abre `http://localhost:5500`. El API queda disponible en `http://localhost:3000`; si usas otro puerto o URL, actualiza `frontend/js/config.js`.

Para comprobar el backend, ejecuta `npm run build` y `npm test` desde la raíz.

Los endpoints actuales para la funcionalidad conectada son `POST /api/users/register`, `POST /api/users/login`, `POST /api/commissions` (requiere JWT) y `GET /api/health`. El total de la comisión se calcula también en el backend a partir del servicio, paquete y licencias elegidos.

## Security & Environment
* Las credenciales de base de datos, el secreto JWT y el artista asignado se manejan mediante variables de entorno; no subas `backend/src/.env` a Git.
* Las contraseñas se almacenan con bcrypt. El inicio de sesión devuelve un JWT de siete días, que se requiere para enviar una comisión.

---

## Author
* Fátima Ávila Mendoza Lead Developer & UI/UX Designer and everything i guess
