# 🩺 Sally – Asistente IA 

> Consulta la **disponibilidad de medicamentos** en sedes de EPS mediante un chat con inteligencia artificial, sin desplazamientos ni llamadas innecesarias o procesos poco agies y eficientes.

---

## Descripción

### Problema
Miles de personas en Colombia enfrentan dificultades diarias al intentar saber si su medicamento está disponible en alguna sede de su EPS.  
El proceso implica llamadas repetitivas, esperas prolongadas o visitas presenciales innecesarias, lo cual afecta especialmente a **adultos mayores**, **personas con enfermedades crónicas** y quienes viven en **zonas rurales** o no tienen la posibilidad de desplazarse a una sede.

### Objetivo del prototipo
El proyecto busca **transformar la experiencia de las personas** al consultar disponibilidad de medicamentos, disminuyendo barreras de tiempo, desplazamiento y desinformación.

Para ello se desarrolla **Sally**, un asistente conversacional que:
- Permite consultar disponibilidad de medicamentos **en lenguaje natural**.
- Brinda información sobre **sede, dirección y cantidad disponible**.
- Explica el motivo de no disponibilidad y ofrece **alternativas o tiempos estimados de reabastecimiento**.

### Usuarios principales
- **Adultos mayores** (población prioritaria).  
- **Pacientes crónicos** o con movilidad reducida para desplazarse.  
- Cualquier usuario que necesite obtener información **rápida y de manera sencilla** sobre medicamentos.

### Alcance del prototipo
El prototipo permite consultar por chat:
- Medicamentos, EPS, sedes o usuarios del sistema.
- Disponibilidad de medicamentos en una sede específica.
- Sedes cercanas según ubicación del usuario o sitio de interes.  

---

## Instalación y Uso

### Clonar el repositorio
```bash
git clone https://github.com/Josesitobb/SenaSoftTeam10.git

cd SenaSoftTeam10/backend 

### Instalar dependencias


### Configurar las variables de entorno (.env)
DATABASE_URL="mysql://usuario:password@localhost:3306/sallydb"
OPENAI_API_KEY="clave_openai"

### Migrar la base de datos
npx prisma migrate dev

### Ejecutar servidor
npm run start:dev

o

cd SenaSoftTeam10/frontend

- npm install

- npm install axios leaflet react-leaflet

### Arrancar el servidor
  - npm run start
