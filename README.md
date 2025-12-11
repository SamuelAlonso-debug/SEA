# SEA – Sistema de Escritorio Administrativo  
_Backend (Node/Express/Prisma) + Frontend (Next.js/React)_

## 1. Descripción general

SEA es un sistema administrativo de escritorio (versión web) orientado a la gestión de:

- Inventario y catálogo de productos  
- Registro de ventas y tickets  
- Control de gastos y KPIs financieros  
- Gestión de clientes  
- Notificación de alertas

La solución está compuesta por:

- **Backend**: API REST desarrollada en Node.js + Express, con TypeScript y Prisma ORM sobre MongoDB.  
- **Frontend**: Aplicación React con Next.js (App Router), TypeScript, Tailwind CSS y componentes ShadCN UI.

---

## 2. Tecnologías principales

**Backend**

- Node.js (LTS)  
- TypeScript  
- Express.js  
- Prisma ORM (datasource: MongoDB)  
- Zod (validación de esquemas)  
- JWT (autenticación basada en tokens)  
- bcrypt / bcryptjs (hash de contraseñas)  

**Frontend**

- Next.js (React 18, App Router)  
- TypeScript  
- Tailwind CSS  
- ShadCN UI  
- Lucide-react (iconos)  

**Base de datos**

- MongoDB / MongoDB Atlas  

---

## 3. Requisitos previos

Antes de comenzar, asegúrate de contar con:

- **Node.js** v18+ (recomendado LTS)  
- **npm** o **pnpm** (según se use en el proyecto)  
- Acceso a una instancia de **MongoDB** (local o en la nube, por ejemplo MongoDB Atlas)  

---

## 4. Estructura del proyecto

Ejemplo de estructura de carpetas:

```bash
sea/
  backend/
    package.json
    tsconfig.json
    prisma/
      schema.prisma
    src/
      app.ts
      server.ts
      config/
      controllers/
      services/
      routes/
      schemas/
      dtos/
  frontend/
    package.json
    next.config.mjs
    tailwind.config.ts
    tsconfig.json
    src/
      app/
      components/
      lib/
      styles/
```


---

## 5. Configuración de entorno

### 5.1 Backend – Archivo `.env`

En la carpeta `backend/`, crear un archivo `.env` con las variables necesarias:

```env
# Puerto de la API
PORT=4000

# Cadena de conexión a MongoDB
DATABASE_URL="mongodb+srv://usuario:password@cluster.mongodb.net/sea?retryWrites=true&w=majority"

# Clave secreta para firmar JWT
JWT_SECRET="clave"

# Entorno
NODE_ENV=development
```

Variables típicas:

- `PORT`: Puerto donde se expondrá la API (4000).  
- `DATABASE_URL`: URL de conexión a MongoDB (local o Atlas).  
- `JWT_SECRET`: Cadena secreta para firmar tokens JWT.  

### 5.2 Frontend – Archivo `.env.local`

En la carpeta `frontend/`, crear un archivo `.env.local`:

```env
# URL base de la API backend
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000/api"
```

Variables típicas:

- `NEXT_PUBLIC_API_BASE_URL`: api.

---

## 6. Instalación

Clonar el repositorio:

```bash
git clone https://github.com/tu-usuario/sea.git
cd sea
```

### 6.1 Backend

```bash
cd backend

# Instalar dependencias
npm install

# Generar cliente de Prisma
npx prisma generate

# (Opcional) Sincronizar el schema con la base de datos
npx prisma db push
```

### 6.2 Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install
```

---

## 7. Ejecución del proyecto en desarrollo

### 7.1 Levantar el backend

Desde la carpeta `backend/`:

```bash
npm run dev
```

Comúnmente, la API se expondrá en:

```text
http://localhost:4000
```

Revisa el `package.json` del backend para confirmar el script (`dev`) y el puerto configurado.

### 7.2 Levantar el frontend

En otra terminal, desde la carpeta `frontend/`:

```bash
npm run dev
```

Por defecto, Next.js se ejecuta en:

```text
http://localhost:3000
```

---

## 8. Scripts útiles

### Backend (`backend/package.json`)

- `npm run dev` – Ejecuta el servidor en modo desarrollo (ts-node-dev / nodemon).  
- `npm run build` – Compila TypeScript a JavaScript.  
- `npm start` – Ejecuta la versión compilada en producción.  

### Frontend (`frontend/package.json`)

- `npm run dev` – Ejecuta el servidor de desarrollo de Next.js.  
- `npm run build` – Compila la aplicación para producción.  
- `npm start` – Inicia la aplicación compilada.  

---
