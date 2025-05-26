# Pesca Club - Sistema de Reservas de Botes

<div align="center">
  <img src="public/fish-favicon.svg" alt="Logo Pesca Club" width="120" />
  <h1>Pesca Club</h1>
  <p>Sistema de gestión de reservas de botes de pesca deportiva</p>
  
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)](https://firebase.google.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
</div>

---

## 🌎 Español

### 🚀 Descripción

Pesca Club es una aplicación web moderna para la gestión de reservas de botes de pesca deportiva. Permite a los usuarios reservar botes, realizar seguimiento de sus reservas y recibir notificaciones sobre el estado de las mismas. Los administradores pueden gestionar las reservas, actualizar disponibilidad y comunicarse con los clientes.

### ✨ Características Principales

- **Reserva de botes** con diferentes tipos y capacidades
- **Sistema de autenticación** para usuarios y administradores
- **Panel de control** para gestión de reservas
- **Notificaciones en tiempo real** para actualizaciones de estado
- **Componente meteorológico** para ver las condiciones climáticas
- **Interfaz responsiva** que funciona en dispositivos móviles
- **Sistema de gestión de inventario** de botes

### 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **Estilos**: Tailwind CSS, Headless UI
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **Utilidades**: date-fns, react-router-dom, react-toastify

### 🚀 Cómo Empezar

#### Requisitos Previos

- Node.js (v16 o superior)
- npm o yarn
- Cuenta de Firebase

#### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/pesca-club.git
   cd pesca-club/reserva-botes
   ```

2. Instala las dependencias:
   ```bash
   npm install
   # o
   yarn
   ```

3. Configura Firebase:
   - Crea un proyecto en Firebase Console
   - Configura Firestore y Authentication
   - Crea un archivo `.env` en la raíz del proyecto con tus credenciales:
     ```
     VITE_FIREBASE_API_KEY=tu_api_key
     VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=tu-proyecto
     VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
     VITE_FIREBASE_APP_ID=tu_app_id
     ```

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   # o
   yarn dev
   ```

5. Abre tu navegador en [http://localhost:5173](http://localhost:5173)

### 📦 Despliegue

Para desplegar en Firebase Hosting:

```bash
# Construye la aplicación para producción
npm run build

# Inicia sesión en Firebase (si no lo has hecho)
firebase login

# Inicializa Firebase Hosting (solo la primera vez)
firebase init

# Despliega la aplicación
firebase deploy --only hosting
```

### 📝 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más información.

---

## 🌎 English

### 🚀 Description

Pesca Club is a modern web application for managing fishing boat reservations. It allows users to book boats, track their reservations, and receive status notifications. Administrators can manage reservations, update availability, and communicate with customers.

### ✨ Key Features

- **Boat reservation** with different types and capacities
- **Authentication system** for users and administrators
- **Dashboard** for reservation management
- **Real-time notifications** for status updates
- **Weather component** to check weather conditions
- **Responsive interface** that works on mobile devices
- **Boat inventory management** system

### 🛠️ Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Headless UI
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **Utilities**: date-fns, react-router-dom, react-toastify

### 🚀 Getting Started

#### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

#### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/pesca-club.git
   cd pesca-club/reserva-botes
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Set up Firebase:
   - Create a project in Firebase Console
   - Set up Firestore and Authentication
   - Create a `.env` file in the project root with your credentials:
     ```
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your-project
     VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open your browser at [http://localhost:5173](http://localhost:5173)

### 📦 Deployment

To deploy to Firebase Hosting:

```bash
# Build the app for production
npm run build

# Log in to Firebase (if you haven't already)
firebase login

# Initialize Firebase Hosting (first time only)
firebase init

# Deploy the app
firebase deploy --only hosting
```

### 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
