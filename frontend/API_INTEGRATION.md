# Integración API Sally - Frontend

## 📋 Resumen de cambios

Se ha integrado completamente la API de Sally en el frontend con las siguientes características:

### 1. **Configuración Centralizada** ✅
- Archivo: `src/config/api.config.js`
- Variables de entorno: `.env.local`
- URL base configurable: `http://localhost:3000`

### 2. **Pantalla de Chat** ✅
- **Ruta:** `http://localhost:5173/chat`
- **Archivo:** `src/features/assistant/components/Chat.jsx`
- Integración completa con la API
- Gestión automática de `sessionId`
- Interfaz amigable con indicadores de carga
- Manejo de errores

### 3. **Pantalla de Voz** ✅
- **Ruta:** `http://localhost:5173/voice`
- **Archivo:** `src/features/assistant/components/Voice.jsx`
- Reconocimiento de voz (Web Speech API)
- Síntesis de voz (Text-to-Speech)
- Soporte para entrada de texto como fallback
- Interfaz intuitiva con botones de control

---

## 🔧 Configuración

### Variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:3000
```

O usa `.env.example` como referencia.

---

## 📁 Estructura de archivos nuevos/modificados

### Nuevos archivos:
```
src/
├── config/
│   └── api.config.js              # Configuración centralizada
├── features/assistant/components/
│   └── Voice.jsx                  # Pantalla de voz
├── .env.local                     # Variables de entorno
└── .env.example                   # Ejemplo de variables
```

### Archivos modificados:
```
src/
├── features/assistant/
│   ├── components/
│   │   ├── Chat.jsx               # Integración con API
│   │   ├── InputBar.jsx           # Soporte para disabled
│   │   └── MessageBubble.jsx      # Mostrar info adicional
│   ├── hooks/
│   │   └── useChat.js             # Hook mejorado con sessionId
│   └── services/
│       └── api.js                 # Funciones de API
└── routes/
    └── AppRoutes.jsx              # Ruta /voice agregada
```

---

## 🔄 Flujo de la API

### Endpoint 1: Iniciar Sesión
```http
GET http://localhost:3000/api/ia
```

**Respuesta:**
```json
{
  "sessionId": "mh2klqgjaid0p",
  "message": "¡Buenas tardes! ¿Cómo está? Soy Sally..."
}
```

### Endpoint 2: Enviar Mensaje
```http
POST http://localhost:3000/api/ia/:sessionId
Content-Type: application/json

{
  "message": "¿Dónde hay Dolex?"
}
```

**Respuesta:**
```json
{
  "sessionId": "mh246bc2cn3jet",
  "reply": "El medicamento Dolex con principio activo...",
  "status": "medical_consultation",
  "user": "Jose",
  "medicamento_consultado": "dolex",
  "ubicaciones_encontradas": 86
}
```

---

## 📱 Uso de los componentes

### Chat
```jsx
import ChatScreen from "@/features/assistant/components/Chat";

// Se usa sin props - el hook maneja todo internamente
<ChatScreen />
```

### Voice
```jsx
import VoiceScreen from "@/features/assistant/components/Voice";

// Se usa sin props - el hook maneja todo internamente
<VoiceScreen />
```

### Hook useChat
```jsx
import { useChat } from "@/features/assistant/hooks/useChat";

function MyComponent() {
  const { messages, sendMessage, sessionId, loading, error } = useChat();
  
  // messages: Array de mensajes
  // sendMessage: Función para enviar mensaje
  // sessionId: ID de sesión actual
  // loading: Estado de carga
  // error: Error si existe
}
```

---

## 🎤 Funcionalidades de voz

### Reconocimiento de voz
- **Idioma:** Español (es-ES)
- **Activación:** Presionar botón de micrófono
- **Procesamiento:** Automático al finalizar grabación

### Síntesis de voz
- **Idioma:** Español (es-ES)
- **Velocidad:** 0.9x (moderada)
- **Volumen:** 100%
- **Reproducción:** Automática al recibir respuesta

---

## ⚙️ Requisitos previos

1. **Backend corriendo:**
   ```bash
   npm start  # Backend en http://localhost:3000
   ```

2. **Frontend corriendo:**
   ```bash
   npm run dev  # Frontend en http://localhost:5173
   ```

3. **Navegador compatible con Web APIs:**
   - Web Speech API (Chrome, Edge, Safari)
   - Speech Synthesis API (Todos los navegadores modernos)

---

## 🧪 Testing

### Chat
1. Navega a `http://localhost:5173/chat`
2. La pantalla debe cargar con el mensaje inicial de Sally
3. Escribe un mensaje y presiona "Enviar"
4. Debería recibir la respuesta con información del medicamento

### Voz
1. Navega a `http://localhost:5173/voice`
2. La pantalla debe cargar con el mensaje inicial de Sally (se reproducirá en voz)
3. Presiona el botón del micrófono para hablar
4. Debería reconocer tu voz en español
5. La respuesta se mostrará y reproducirá automáticamente

---

## 🐛 Troubleshooting

### "Error: API error: 404"
- Verifica que el backend esté corriendo en `http://localhost:3000`
- Revisa que los endpoints sean `/api/ia` y `/api/ia/:sessionId`

### La voz no funciona
- Verifica que tu navegador sea compatible (Chrome, Edge, Safari)
- Asegúrate de que el idioma del sistema sea español o explícitamente español
- Prueba en modo incógnito

### El sessionId no se guarda
- Revisa la consola para errores
- Verifica que la respuesta del backend incluya `sessionId`

---

## 📝 Notas técnicas

- El `sessionId` se guarda automáticamente en el estado del hook
- Las rutas están correctamente configuradas en `AppRoutes.jsx`
- El componente `MessageBubble` muestra información adicional del medicamento
- El `InputBar` tiene soporte para estado deshabilitado durante carga
- Los errores se manejan gracefully con mensajes al usuario

---

## 🚀 Próximos pasos

1. Implementar persistencia de sesiones (localStorage)
2. Agregar animaciones de transición
3. Mejorar el manejo de múltiples idiomas
4. Agregar historial de consultas
5. Integrar con un servicio de análisis

---

**¡Listo para usar! 🎉**
