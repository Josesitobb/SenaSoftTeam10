import prisma from "../models/prismaClient.js";
import OpenAI from 'openai';

// Importar las funciones de otros controladores
import { getById } from './userController.js';
import { getMedicamentos } from './medicamentosController.js';
import { getEps } from './epsController.js';
import { getSede } from './sedesController.js';

// Simple in-memory session store (for first version).
const sessions = new Map();

function genSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Función para crear un nuevo usuario en la base de datos
async function crearNuevoUsuario(datosUsuario) {
  try {
    console.log('=== INICIANDO CREACIÓN DE USUARIO ===');
    console.log('Datos recibidos:', JSON.stringify(datosUsuario, null, 2));
    
    // Validar que tenemos los datos mínimos requeridos
    if (!datosUsuario.documento || !datosUsuario.nombre_usuario) {
      console.error('❌ ERROR: Faltan datos requeridos - documento y nombre son obligatorios');
      throw new Error('Faltan datos requeridos: documento y nombre');
    }

    // Verificar que el documento no exista ya (doble verificación)
    const usuarioExistente = await prisma.usuarios.findFirst({
      where: { documento: datosUsuario.documento }
    });

    if (usuarioExistente) {
      console.error('❌ ERROR: El documento ya existe en la base de datos');
      throw new Error('El documento ya está registrado');
    }

    console.log('✅ Validaciones pasadas, procediendo a insertar en la base de datos...');

    // Generar password_hash como nombre + número random (1-100)
    const numeroRandom = Math.floor(Math.random() * 100) + 1;
    const passwordHash = `${datosUsuario.nombre_usuario.replace(/\s+/g, '')}${numeroRandom}`;

    const nuevoUsuario = await prisma.usuarios.create({
      data: {
        tipo_documento: datosUsuario.tipo_documento || 'CC',
        documento: datosUsuario.documento,
        nombre_usuario: datosUsuario.nombre_usuario,
        email: datosUsuario.email || null,
        password_hash: passwordHash,
        edad: datosUsuario.edad || null,
        ciudad: datosUsuario.ciudad || null,
        canal_preferido: datosUsuario.canal_preferido || 'web',
        id_sede_preferida: datosUsuario.id_sede_preferida || null,
        id_rol: 1, // Siempre rol 1
        estado: 'activo',
        fecha_creacion: new Date(),
        ultimo_acceso: null
      }
    });

    console.log('✅ USUARIO CREADO EXITOSAMENTE EN LA BASE DE DATOS');
    console.log('Datos del nuevo usuario:', JSON.stringify(nuevoUsuario, null, 2));
    return nuevoUsuario;
  } catch (error) {
    console.error('❌ ERROR AL CREAR USUARIO:', error.message);
    console.error('Detalles del error:', error);
    return null;
  }
}

// Función para manejar el registro paso a paso
async function manejarRegistroUsuario(session, userInput, sessionId, res) {
  let preguntaValida = false;
  let errorMensaje = '';
  let siguientePregunta = '';
  
  switch (session.currentQuestion) {
    case 'tipo_documento':
      const tipoDoc = userInput.toUpperCase().replace(/[^A-Z]/g, '');
      if (['CC', 'CE', 'TI'].includes(tipoDoc) || 
          userInput.toLowerCase().includes('cedula') || 
          userInput.toLowerCase().includes('ciudadania') ||
          userInput.toLowerCase().includes('extranjeria') ||
          userInput.toLowerCase().includes('identidad')) {
        
        if (tipoDoc === 'CC' || userInput.toLowerCase().includes('cedula') || userInput.toLowerCase().includes('ciudadania')) {
          session.newUserData.tipo_documento = 'CC';
        } else if (tipoDoc === 'CE' || userInput.toLowerCase().includes('extranjeria')) {
          session.newUserData.tipo_documento = 'CE';
        } else if (tipoDoc === 'TI' || userInput.toLowerCase().includes('identidad')) {
          session.newUserData.tipo_documento = 'TI';
        } else {
          session.newUserData.tipo_documento = tipoDoc;
        }
        
        session.currentQuestion = 'nombre';
        preguntaValida = true;
        siguientePregunta = '¿Cuál es su nombre completo?';
      } else {
        errorMensaje = 'Por favor seleccione: CC (Cédula de Ciudadanía), CE (Cédula de Extranjería) o TI (Tarjeta de Identidad)';
      }
      break;
      
    case 'nombre':
      if (userInput.length >= 2 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(userInput)) {
        session.newUserData.nombre_usuario = userInput.trim();
        session.currentQuestion = 'email';
        preguntaValida = true;
        siguientePregunta = '¿Cuál es su correo electrónico? Si no tiene, escriba "no tengo"';
      } else {
        errorMensaje = 'Por favor ingrese un nombre válido (mínimo 2 caracteres, solo letras)';
      }
      break;
      
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(userInput.trim())) {
        session.newUserData.email = userInput.trim().toLowerCase();
      } else if (userInput.toLowerCase().includes('no') || userInput.toLowerCase().includes('tengo') || userInput.toLowerCase().includes('skip')) {
        session.newUserData.email = null;
      } else {
        errorMensaje = 'Por favor ingrese un email válido o escriba "no tengo" si no tiene email';
        break;
      }
      session.currentQuestion = 'edad';
      preguntaValida = true;
      siguientePregunta = '¿Cuál es su edad?';
      break;
      
    case 'edad':
      const edad = parseInt(userInput.replace(/\D/g, ''));
      if (edad && edad >= 18 && edad <= 120) {
        session.newUserData.edad = edad;
        session.currentQuestion = 'ciudad';
        preguntaValida = true;
        siguientePregunta = '¿En qué ciudad vive?';
      } else {
        errorMensaje = 'Por favor ingrese una edad válida (entre 18 y 120 años)';
      }
      break;
      
    case 'ciudad':
      if (userInput.length >= 2) {
        session.newUserData.ciudad = userInput.trim();
        session.currentQuestion = 'canal_preferido';
        preguntaValida = true;
        siguientePregunta = '¿Cuál es su canal de comunicación preferido?\n• web\n• whatsapp\n• telefono';
      } else {
        errorMensaje = 'Por favor ingrese una ciudad válida';
      }
      break;
      
    case 'canal_preferido':
      const canal = userInput.toLowerCase().trim();
      if (['web', 'whatsapp', 'telefono'].includes(canal) || 
          canal.includes('whats') || canal.includes('telefon') || canal.includes('web')) {
        
        if (canal.includes('whats')) {
          session.newUserData.canal_preferido = 'whatsapp';
        } else if (canal.includes('telefon')) {
          session.newUserData.canal_preferido = 'telefono';
        } else {
          session.newUserData.canal_preferido = 'web';
        }
        
        session.currentQuestion = 'sede';
        preguntaValida = true;
        // Aquí necesitamos mostrar las sedes disponibles
        const sedes = await obtenerTodasSedesFromDB();
        siguientePregunta = `Por favor seleccione una sede de las disponibles (escriba el número):\n\n${sedes.slice(0, 10).map((sede, index) => 
          `${index + 1}. ${sede.nombre_sede} - ${sede.ciudad}`
        ).join('\n')}\n\n¿Cuál sede prefiere? (escriba el número)`;
      } else {
        errorMensaje = 'Por favor seleccione: web, whatsapp o telefono';
      }
      break;
      
    case 'sede':
      const numeroSede = parseInt(userInput.replace(/\D/g, ''));
      if (numeroSede && numeroSede >= 1 && numeroSede <= 50) {
        const sedes = await obtenerTodasSedesFromDB();
        const sedeSeleccionada = sedes[numeroSede - 1];
        
        if (sedeSeleccionada) {
          session.newUserData.id_sede_preferida = sedeSeleccionada.id_sede;
          session.currentQuestion = 'complete';
          preguntaValida = true;
        } else {
          errorMensaje = 'Número de sede no válido. Por favor seleccione un número de la lista.';
        }
      } else {
        errorMensaje = 'Por favor ingrese un número válido de sede.';
      }
      break;
  }
  
  // Si la pregunta no fue válida, mantener el estado actual
  if (!preguntaValida && errorMensaje) {
    return res.json({
      sessionId,
      reply: errorMensaje,
      status: 'error_input',
      progress: { step: session.currentQuestion, total: 7 }
    });
  }
  
  // Si completamos todas las preguntas, crear el usuario
  if (session.currentQuestion === 'complete') {
    console.log('🎯 Intentando crear usuario con datos completos:', session.newUserData);
    const nuevoUsuario = await crearNuevoUsuario(session.newUserData);
    
    if (nuevoUsuario) {
      session.userData = nuevoUsuario;
      session.state = 'user_created';
      
      return res.json({
        sessionId,
        reply: `🎉 ¡Perfecto ${nuevoUsuario.nombre_usuario}! Su registro se completó exitosamente.\n\n✅ **Datos registrados:**\n• Documento: ${nuevoUsuario.documento} (${nuevoUsuario.tipo_documento})\n• Edad: ${nuevoUsuario.edad} años\n• Ciudad: ${nuevoUsuario.ciudad}\n• Canal preferido: ${nuevoUsuario.canal_preferido}\n${nuevoUsuario.email ? `• Email: ${nuevoUsuario.email}` : ''}\n\nAhora puede consultarme sobre medicamentos disponibles en nuestras farmacias. ¿En qué puedo ayudarle?`,
        status: 'registration_complete',
        user_data: {
          id: nuevoUsuario.id_usuario,
          nombre: nuevoUsuario.nombre_usuario,
          documento: nuevoUsuario.documento
        }
      });
    } else {
      session.state = 'user_creation_failed';
      return res.json({
        sessionId,
        reply: `❌ Lo siento, hubo un error al crear su perfil en el sistema. Por favor, intente nuevamente proporcionando su documento de identidad.`,
        status: 'error',
        action_required: 'restart'
      });
    }
  }
  
  // Continuar con la siguiente pregunta
  const stepNumber = ['tipo_documento', 'nombre', 'email', 'edad', 'ciudad', 'canal_preferido', 'sede'].indexOf(session.currentQuestion) + 1;
  
  sessions.set(sessionId, session);
  
  return res.json({
    sessionId,
    reply: siguientePregunta,
    status: 'collecting_data',
    progress: { step: stepNumber, total: 7 }
  });
}

// Función para procesar consultas médicas con ChatGPT
async function procesarConsultaMedica(session, userInput, sessionId, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return res.json({
      sessionId,
      reply: 'Servicio de consultas temporalmente no disponible. Por favor intente más tarde.',
      status: 'service_unavailable'
    });
  }

  try {
    // Inicializar historial de mensajes si no existe
    if (!session.messages) {
      session.messages = [];
    }
    
    // Agregar el mensaje del usuario al historial
    session.messages.push({ role: 'user', content: userInput });

    // Consultar datos necesarios de la base de datos
    console.log('=== CONSULTANDO BASE DE DATOS PARA ChatGPT ===');
    const todosMedicamentos = await obtenerTodosMedicamentosFromDB();
    const todasEps = await obtenerTodasEpsFromDB();
    const todasSedes = await obtenerTodasSedesFromDB();
    
    console.log(`✅ Datos disponibles: ${todosMedicamentos.length} medicamentos, ${todasEps.length} EPS, ${todasSedes.length} sedes`);

    const { OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

    // Crear contexto especializado para consultas médicas
    let systemPrompt = `Eres Sally, un asistente especializado en medicamentos para adultos mayores (50-80 años). 

USUARIO VERIFICADO: ${session.userData.nombre_usuario} (Documento: ${session.userData.documento})

REGLAS ESTRICTAS:
- Usa lenguaje claro y simple para adultos mayores
- SOLO habla de medicamentos que EXISTEN en la base de datos
- NUNCA inventes medicamentos
- Siempre recomienda consultar con un médico
- Mantén respuestas cortas y directas

MEDICAMENTOS DISPONIBLES (${todosMedicamentos.length} total):`;

    // Agregar lista de medicamentos disponibles
    if (todosMedicamentos && todosMedicamentos.length > 0) {
      const medicamentosParaIA = todosMedicamentos.slice(0, 50).map(m => ({
        nombre_comercial: m.nombre_comercial,
        nombre_generico: m.nombre_generico,
        principio_activo: m.principio_activo,
        forma: m.forma_farmaceutica,
        concentracion: m.concentracion
      }));
      systemPrompt += `\n${JSON.stringify(medicamentosParaIA, null, 2)}`;
    }

    // Agregar información de sedes
    if (todasSedes && todasSedes.length > 0) {
      systemPrompt += `\n\nSEDES DISPONIBLES (${todasSedes.length} total):`;
      const sedesParaIA = todasSedes.slice(0, 15).map(s => ({
        nombre: s.nombre_sede,
        ciudad: s.ciudad,
        direccion: s.direccion,
        telefono: s.telefono
      }));
      systemPrompt += `\n${JSON.stringify(sedesParaIA, null, 2)}`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...session.messages
    ];

    console.log('🤖 Enviando consulta a OpenAI...');
    const response = await client.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: 400,
      temperature: 0.3
    });

    const aiReply = response.choices[0]?.message?.content || 'Disculpe, no pude procesar su consulta. ¿Puede repetir su pregunta?';

    // Guardar respuesta en el historial
    session.messages.push({ role: 'assistant', content: aiReply });
    sessions.set(sessionId, session);

    // Registrar la consulta en la base de datos
    await agregarConsulta(userInput, sessionId, session.userData);

    return res.json({
      sessionId,
      reply: aiReply,
      status: 'medical_consultation',
      user: session.userData.nombre_usuario
    });

  } catch (error) {
    console.error('❌ Error en consulta médica:', error);
    return res.status(500).json({ error: 'Error procesando la consulta médica.' });
  }
}
// Funciones auxiliares que usan los controladores existentes
async function buscarUsuarioPorDocumento(documento) {
  try {
    const usuario = await prisma.usuarios.findFirst({
      where: { documento: documento }
    });
    return usuario;
  } catch (error) {
    console.error('Error buscando usuario:', error);
    return null;
  }
}

// Función que usa el controlador getMedicamentos para obtener TODOS los medicamentos
async function obtenerTodosMedicamentosFromDB() {
  try {
    console.log('Consultando TODOS los medicamentos en la base de datos...');
    const medicamentos = await prisma.medicamentos.findMany();
    console.log(`Se encontraron ${medicamentos.length} medicamentos en la base de datos`);
    return medicamentos;
  } catch (error) {
    console.error('Error obteniendo medicamentos:', error);
    return [];
  }
}

// Obtener inventario de una sede específica o de todas las sedes si no se pasa id
async function obtenerInventarioSede(sedeId) {
    try {
        if (sedeId) {
            console.log(`Consultando inventario para la sede con ID: ${sedeId}`);
            const inventario = await prisma.inventario_sede.findMany({
                where: { id_sede: sedeId },
                select: {
                    id_inventario: true,
                    id_sede: true,
                    cantidad_disponible: true,
                    punto_reorden: true,
                    medicamento: {
                        select: {
                            id_medicamento: true,
                            nombre_comercial: true,
                            nombre_generico: true,
                            principio_activo: true,
                            forma_farmaceutica: true
                        }
                    },
                    sedes: {
                        select: {
                            id_sede: true,
                            nombre_sede: true,
                            direccion: true,
                            telefono: true
                        }
                    }
                }
            });
            console.log(`Se encontraron ${inventario.length} registros en el inventario de la sede ${sedeId}`);
            return inventario;
        }

        // Si no se proporciona sedeId, devolver inventario agregado por sede
        console.log('Consultando inventario para TODAS las sedes...');
        const todosInventarios = await prisma.inventario_sede.findMany({
            select: {
                id_inventario: true,
                id_sede: true,
                cantidad_disponible: true,
                punto_reorden: true,
                medicamento: {
                    select: {
                        id_medicamento: true,
                        nombre_comercial: true,
                        nombre_generico: true,
                        principio_activo: true,
                        forma_farmaceutica: true
                    }
                },
                sedes: {
                    select: {
                        id_sede: true,
                        nombre_sede: true,
                        direccion: true,
                        telefono: true
                    }
                }
            }
        });

        // Función auxiliar para extraer la cantidad de campo posible
        const getCantidad = (item) => {
            return item.cantidad ?? item.cantidad_disponible ?? item.stock ?? item.cantidad_actual ?? 0;
        };

        const mapaSedes = new Map();

        for (const item of todosInventarios) {
            const idSede = item.id_sede ?? (item.sedes && (item.sedes.id_sede ?? item.sedes.id)) ?? 'sin_sede';
            const nombreSede = item.sedes ? (item.sedes.nombre_sede ?? item.sedes.nombre ?? `Sede ${idSede}`) : `Sede ${idSede}`;
            const cantidad = Number(getCantidad(item)) || 0;

            if (!mapaSedes.has(idSede)) {
                mapaSedes.set(idSede, {
                    id_sede: idSede,
                    nombre_sede: nombreSede,
                    medicamentos: [],
                    total_medicamentos: 0
                });
            }

            const entrada = mapaSedes.get(idSede);

            entrada.medicamentos.push({
                id_medicamento: item.medicamento ? (item.medicamento.id_medicamento ?? item.medicamento.id) : null,
                nombre_comercial: item.medicamento ? (item.medicamento.nombre_comercial ?? item.medicamento.nombre) : 'Desconocido',
                principio_activo: item.medicamento ? item.medicamento.principio_activo : null,
                cantidad: cantidad
            });

            entrada.total_medicamentos += cantidad;
        }

        const inventarioPorSede = Array.from(mapaSedes.values());
        console.log(`Se encontraron inventarios en ${inventarioPorSede.length} sedes`);
        return inventarioPorSede;

    } catch (error) {
        console.error('Error obteniendo inventario de sede:', error);
        return [];
    }
}

// Función que usa el controlador getEps para obtener TODAS las EPS
async function obtenerTodasEpsFromDB() {
  try {
    console.log('Consultando TODAS las EPS en la base de datos...');
    const eps = await prisma.eps.findMany();
    console.log(`Se encontraron ${eps.length} EPS en la base de datos`);
    return eps;
  } catch (error) {
    console.error('Error obteniendo EPS:', error);
    return [];
  }
}

// Función que usa el controlador getSede para obtener TODAS las sedes relacionadas con EPS
async function obtenerTodasSedesFromDB() {
  try {
    console.log('Consultando TODAS las sedes en la base de datos...');
    const sedes = await prisma.sedes.findMany({
      include: {
        eps: true // Incluir información completa de la EPS relacionada
      }
    });
    console.log(`Se encontraron ${sedes.length} sedes en la base de datos`);
    return sedes;
  } catch (error) {
    console.error('Error obteniendo sedes:', error);
    return [];
  }
}

// Función para buscar medicamento específico por nombre
async function buscarMedicamentoEspecifico(nombreBusqueda) {
  try {
    const medicamentos = await prisma.medicamentos.findMany({
      where: {
        OR: [
          { nombre_comercial: { contains: nombreBusqueda, mode: 'insensitive' } },
          { principio_activo: { contains: nombreBusqueda, mode: 'insensitive' } }
        ]
      }
    });
    return medicamentos;
  } catch (error) {
    console.error('Error buscando medicamento específico:', error);
    return [];
  }
}

// Funcion para agregrar cada consulta realizada en la tabla
// reemplaza $SELECTION_PLACEHOLDER$ por esta función (queda en el mismo archivo)
async function agregarConsulta(sessionId, consulta) {
    try {
        console.log(`Agregando consulta para la sesión ${sessionId}:`, consulta);

        const session = sessions.get(sessionId);

        // Construir objeto data según existencia de usuario registrado o documento
        const data = {
            sessionId,
            consulta: typeof consulta === 'string' ? { texto: consulta } : consulta
        };

        if (session) {
            // Si existe userData, intentar asociar por id_usuario o id
            if (session.userData) {
                const userId = session.userData.id_usuario ?? session.userData.id;
                if (userId) {
                    data.id_usuario = userId;
                }
                // También guardar documento y nombre por si el esquema los tiene
                if (session.userData.documento) data.documento = session.userData.documento;
                if (session.userData.nombre_usuario) data.nombre_usuario = session.userData.nombre_usuario;
            } else if (session.document) {
                // Si no hay userData pero se tiene documento en la sesión, guardarlo
                data.documento = session.document;
            }
        }

        const created = await prisma.consultas.create({
            data
        });

        console.log('Consulta creada:', created);
        return created;
    } catch (error) {
        console.error('Error agregando consulta:', error);
        return null;
    }
}

// GET /api/ia -> inicia la conversación y devuelve un sessionId
export const startConversation = async (req, res) => {
  const sessionId = genSessionId();
  
  // Obtener la hora actual para el saludo apropiado
  const now = new Date();
  const hour = now.getHours();
  let saludo;
  
  if (hour >= 5 && hour < 12) {
    saludo = "¡Buenos días!";
  } else if (hour >= 12 && hour < 18) {
    saludo = "¡Buenas tardes!";
  } else {
    saludo = "¡Buenas noches!";
  }
  
  sessions.set(sessionId, { 
    state: 'initial_greeting', 
    createdAt: Date.now() 
  });

  const message = `${saludo} ¿Cómo está? Soy Sally, su asistente personal de medicamentos. Estoy aquí para ayudarle con consultas sobre medicamentos y sedes médicas.\n\nPara comenzar, por favor compártame su número de documento de identidad.`;

  return res.json({ sessionId, message });
};

// POST /api/ia/:sessionId -> recibe mensajes del usuario; en la primera versión,
// cuando el estado es awaiting_document guarda el número y responde.
export const postMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, documento } = req.body; // Permitir documento desde body

    if (!sessionId || !sessions.has(sessionId)) {
      return res.status(400).json({ error: 'Session no encontrada. Llame primero a GET /api/ia para iniciar.' });
    }

    const session = sessions.get(sessionId);

    // Usar documento del body si está disponible, sino usar el mensaje
    const userInput = documento || (message || '').toString().trim();
    if (!userInput) {
      return res.status(400).json({ error: 'Por favor envíe un mensaje válido o documento.' });
    }

    console.log(`📥 Recibido en sesión ${sessionId}:`, { userInput, estado: session.state });

    // *** PASO 1: MANEJO INICIAL - RECIBIR DOCUMENTO ***
    if (session.state === 'initial_greeting') {
      // Detectar si el input contiene un documento (números entre 6 y 15 dígitos)
      const documentoMatch = userInput.match(/\b\d{6,15}\b/);
      
      if (!documentoMatch) {
        return res.json({
          sessionId,
          reply: "Por favor ingrese su número de documento de identidad (solo números).",
          status: 'awaiting_document'
        });
      }

      const documentoUsuario = documentoMatch[0];
      console.log('🔍 Buscando usuario con documento:', documentoUsuario);

      // *** PASO 2: BUSCAR EN BASE DE DATOS ***
      const usuarioExistente = await buscarUsuarioPorDocumento(documentoUsuario);

      if (usuarioExistente) {
        // *** CAMINO 1: USUARIO EXISTE - ENVIAR A ChatGPT ***
        console.log('✅ Usuario encontrado:', usuarioExistente.nombre_usuario);
        session.userData = usuarioExistente;
        session.document = documentoUsuario;
        session.state = 'user_verified';
        sessions.set(sessionId, session);
        
        // Dar bienvenida y proceder con ChatGPT
        return res.json({
          sessionId,
          reply: `¡Hola ${usuarioExistente.nombre_usuario}! Es un gusto atenderle nuevamente. ¿En qué puedo ayudarle hoy con sus medicamentos?`,
          status: 'user_verified',
          user_data: {
            nombre: usuarioExistente.nombre_usuario,
            documento: usuarioExistente.documento
          }
        });
        
      } else {
        // *** CAMINO 2: USUARIO NO EXISTE - INICIAR REGISTRO ***
        console.log('❌ Usuario no encontrado, iniciando registro para documento:', documentoUsuario);
        session.document = documentoUsuario;
        session.state = 'collecting_user_data';
        session.newUserData = { 
          documento: documentoUsuario 
        };
        session.currentQuestion = 'tipo_documento';
        sessions.set(sessionId, session);
        
        return res.json({
          sessionId,
          reply: `No encontré su documento ${documentoUsuario} en nuestro sistema. Vamos a registrarlo paso a paso.\n\n¿Qué tipo de documento es?\n• CC para Cédula de Ciudadanía\n• CE para Cédula de Extranjería\n• TI para Tarjeta de Identidad`,
          status: 'registration_started',
          progress: { step: 1, total: 7 }
        });
      }
    }

    // *** PASO 3: RECOPILACIÓN DE DATOS PARA REGISTRO ***
    if (session.state === 'collecting_user_data') {
      return await manejarRegistroUsuario(session, userInput, sessionId, res);
    }

    // *** PASO 4: USUARIO VERIFICADO - PROCESAR CONSULTAS ***
    if (session.state === 'user_verified' || session.state === 'user_created') {
      return await procesarConsultaMedica(session, userInput, sessionId, res);
    }

    // Estado no reconocido
    return res.status(400).json({ error: 'Estado de sesión no válido.' });

  } catch (error) {
    console.error('❌ Error en postMessage:', error);
    return res.status(500).json({ error: 'Error interno en el sistema' });
  }
};
              session.newUserData.tipo_documento = 'TI';
            } else {
              session.newUserData.tipo_documento = tipoDoc;
            }
            session.currentQuestion = 'complete';
            preguntaValida = true;
          } else {
            errorMensaje = 'Por favor seleccione: CC (Cédula de Ciudadanía), CE (Cédula de Extranjería) o TI (Tarjeta de Identidad)';
          }
          break;
      }
      
      // Si la pregunta no fue válida, mantener el estado actual
      if (!preguntaValida && errorMensaje) {
        return res.json({
          message: errorMensaje,
          sessionId: sessionId,
          status: 'error_input'
        });
      }
    }
      
    // Si completamos todas las preguntas, crear el usuario
    if (session.currentQuestion === 'complete') {
      console.log('Intentando crear usuario con datos:', session.newUserData);
      const nuevoUsuario = await crearNuevoUsuario(session.newUserData);
      
      if (nuevoUsuario) {
        session.userData = nuevoUsuario;
        session.state = 'user_created';
        userData = nuevoUsuario;
        console.log('Nuevo usuario creado exitosamente:', nuevoUsuario.nombre_usuario);
      } else {
        session.state = 'user_creation_failed';
        console.log('Error al crear usuario');
      }
    }

    sessions.set(sessionId, session);

    // *** CONSULTAS OBLIGATORIAS A LA BASE DE DATOS ***
    console.log('=== INICIANDO CONSULTAS A LA BASE DE DATOS ===');
    
    // 1. SIEMPRE consultar TODOS los medicamentos disponibles
    const todosMedicamentos = await obtenerTodosMedicamentosFromDB();
    
    // 2. SIEMPRE consultar TODAS las EPS disponibles
    const todasEps = await obtenerTodasEpsFromDB();

    const inventarioSedes = await obtenerInventarioSede();

    // 3. SIEMPRE consultar TODAS las sedes relacionadas con sus EPS
    const todasSedes = await obtenerTodasSedesFromDB();
    
    console.log('=== RESUMEN DE CONSULTAS ===');
    console.log(`- Medicamentos encontrados: ${todosMedicamentos.length}`);
    console.log(`- EPS encontradas: ${todasEps.length}`);
    console.log(`- Sedes encontradas: ${todasSedes.length}`);
    
    // 4. Si el usuario menciona un medicamento específico, buscarlo
    let medicamentoEspecifico = null;
    const medicamentosMencionados = userMessage.toLowerCase().match(/\b(paracetamol|ibuprofeno|aspirina|acetaminofen|dolex|advil|bayer|ácido acetilsalicílico|amoxicilina|diclofenaco|naproxeno|dipirona|omeprazol|losartan|metformina)\b/g);
    
    if (medicamentosMencionados) {
      for (const medicamento of medicamentosMencionados) {
        const resultado = await buscarMedicamentoEspecifico(medicamento);
        if (resultado.length > 0) {
          medicamentoEspecifico = resultado;
          console.log(`Medicamento específico encontrado: ${medicamento} - ${resultado.length} resultados`);
          break;
        }
      }
    }

    // Enviar todo a OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('API Key disponible:', apiKey ? 'SÍ' : 'NO');
    
    // *** MANEJO DE RESPUESTAS DIRECTAS (SIN ChatGPT) ***
    
    // Si hay error en la creación del usuario, responder directamente
    if (session.state === 'user_creation_failed') {
      return res.json({
        sessionId,
        reply: `❌ Lo siento, hubo un error al crear tu perfil en el sistema. Por favor, intenta nuevamente proporcionando tu documento de identidad para comenzar el proceso de registro.`,
        status: 'error',
        action_required: 'provide_document'
      });
    }
    
    // Si estamos recopilando datos, responder directamente sin ChatGPT
    if (session.state === 'collecting_user_data') {
      let directReply = '';
      
      switch (session.currentQuestion) {
        case 'name':
          directReply = `👋 Hola! No encontré tu documento ${session.document} en nuestro sistema, pero no te preocupes, puedo ayudarte a registrarte.\n\n¿Cuál es tu nombre completo?`;
          break;
        case 'age':
          directReply = `Perfecto ${session.newUserData.nombre_usuario}, ahora necesito conocer tu edad. ¿Cuántos años tienes?`;
          break;
        case 'city':
          directReply = `Gracias. Ahora dime, ¿en qué ciudad vives?`;
          break;
        case 'email':
          directReply = `¿Tienes correo electrónico? Si lo tienes, por favor compártelo. Si no tienes, simplemente escribe "no tengo".`;
          break;
        case 'document_type':
          directReply = `Por último, ¿qué tipo de documento es el ${session.document}?\n\nEscribe:\n• CC para Cédula de Ciudadanía\n• CE para Cédula de Extranjería\n• TI para Tarjeta de Identidad`;
          break;
        default:
          directReply = 'Por favor continúa con el proceso de registro.';
      }
      
      return res.json({
        sessionId,
        reply: directReply,
        status: 'collecting_data',
        progress: {
          step: session.currentQuestion,
          completed_data: Object.keys(session.newUserData || {}).length,
          total_steps: 5
        }
      });
    }
    
    // Si acabamos de crear el usuario exitosamente
    if (session.state === 'user_created' && userData) {
      return res.json({
        sessionId,
        reply: `🎉 ¡Perfecto ${userData.nombre_usuario}! Tu registro se completó exitosamente en nuestro sistema.\n\n✅ **Registro completado:**\n• Documento: ${userData.documento}\n• Tipo: ${userData.tipo_documento}\n• Edad: ${userData.edad} años\n• Ciudad: ${userData.ciudad}\n${userData.email ? `• Email: ${userData.email}` : ''}\n\nAhora puedes consultarme sobre medicamentos disponibles en nuestras farmacias. ¿En qué puedo ayudarte?`,
        status: 'registration_complete',
        user_data: {
          id: userData.id_usuario,
          nombre: userData.nombre_usuario,
          documento: userData.documento
        }
      });
    }

    // *** USAR ChatGPT SOLO PARA CONSULTAS MÉDICAS DE USUARIOS VERIFICADOS ***
    if (apiKey && (session.state === 'user_verified' || session.state === 'awaiting_document')) {
      try {
        console.log('Enviando mensaje a OpenAI:', userMessage);
        const client = new OpenAI({ apiKey });
        const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

        // Crear el contexto para la IA con TODA la información de la base de datos
        let systemPrompt = `Eres Sally, un asistente especializado en medicamentos y consultas médicas para personas de 50 a 80 años. 
        
IMPORTANTE: 
- Usa un lenguaje muy claro, amable y comprensible para adultos mayores
- Mantén las respuestas cortas y simples
- SOLO puedes hablar de medicamentos y sedes médicas que EXISTEN en la base de datos
- NUNCA inventes medicamentos que no estén en la lista
- Siempre termina recomendando consultar con un médico
- Si el usuario se sale del tema, redirige amablemente hacia medicamentos o sedes

ESTADO ACTUAL DE LA CONVERSACIÓN: `;

        // Manejar diferentes estados de la conversación
        if (session.state === 'awaiting_document') {
          systemPrompt += `\nESTADO: Esperando documento de identidad del usuario. Si mencionan un número de documento, verificar si existe.`;
        } else if (session.state === 'collecting_user_data') {
          systemPrompt += `\nESTADO CRÍTICO: El usuario con documento ${session.document} NO existe en la base de datos. Estás recopilando información para crear su perfil.`;
          systemPrompt += `\nDATOS RECOPILADOS HASTA AHORA: ${JSON.stringify(session.newUserData || {})}`;
          
          if (session.currentQuestion === 'name') {
            systemPrompt += `\nACCIÓN REQUERIDA: Explica que no encontraste su documento en el sistema y pregunta su nombre completo para crear su perfil.`;
          } else if (session.currentQuestion === 'age') {
            systemPrompt += `\nACCIÓN REQUERIDA: Pregunta su edad (debe ser un número entre 18 y 120).`;
          } else if (session.currentQuestion === 'city') {
            systemPrompt += `\nACCIÓN REQUERIDA: Pregunta en qué ciudad vive.`;
          } else if (session.currentQuestion === 'email') {
            systemPrompt += `\nACCIÓN REQUERIDA: Pregunta si tiene correo electrónico (opcional, puede decir "no tengo").`;
          } else if (session.currentQuestion === 'document_type') {
            systemPrompt += `\nACCIÓN REQUERIDA: Pregunta qué tipo de documento es (CC, CE, TI).`;
          }
          
          systemPrompt += `\nIMPORTANTE: NO menciones medicamentos hasta que se complete el registro.`;
        } else if (session.state === 'user_created') {
          systemPrompt += `\nESTADO: Usuario recién creado exitosamente. Dale la bienvenida personalizada y ofrece ayuda con medicamentos.`;
        } else if (session.state === 'user_verified') {
          systemPrompt += `\nESTADO: Usuario existente verificado y autenticado. Puede proceder con consultas médicas normalmente.`;
        } else if (session.state === 'user_creation_failed') {
          systemPrompt += `\nESTADO: Error al crear usuario. Pide disculpas y sugiere intentar de nuevo con el documento.`;
        }

        systemPrompt += `\n\nREGLAS ESTRICTAS:
1. Si el estado es 'collecting_user_data', SOLO haz la pregunta correspondiente
2. Si el usuario está verificado, SOLO habla de medicamentos que aparecen en la lista
3. Si preguntan por un medicamento que NO existe en la base de datos, dile que no lo tienes disponible
4. Para sedes, usa la información completa de sedes y sus EPS relacionadas
5. Nunca proporciones consejos médicos definitivos, solo información general

DATOS ACTUALES DE LA BASE DE DATOS:
`;

        // Solo agregar información de la base de datos si el usuario ya está verificado o creado
        if (session.state === 'user_verified' || session.state === 'user_created') {
          // Agregar información del usuario si está disponible
          if (userData) {
            systemPrompt += `\n=== USUARIO IDENTIFICADO ===\nNombre: ${userData.nombre_usuario}\nDocumento: ${userData.documento}\n`;
          }

          // SIEMPRE agregar información de medicamentos (máximo 20 para no sobrecargar)
          if (todosMedicamentos && todosMedicamentos.length > 0) {
            systemPrompt += `\n=== MEDICAMENTOS DISPONIBLES EN LA BASE DE DATOS (${todosMedicamentos.length} total) ===\n`;
            const medicamentosParaIA = todosMedicamentos.slice(0, 20).map(m => ({
              id: m.id_medicamento,
              nombre_comercial: m.nombre_comercial,
              principio_activo: m.principio_activo,
              concentracion: m.concentracion,
              presentacion: m.presentacion,
              via_administracion: m.via_administracion,
              requiere_formula: m.requiere_formula,
              control_especial: m.control_especial
            }));
            systemPrompt += JSON.stringify(medicamentosParaIA, null, 2);
          }

          // Si hay un medicamento específico buscado, destacarlo
          if (medicamentoEspecifico && medicamentoEspecifico.length > 0) {
            systemPrompt += `\n=== MEDICAMENTO ESPECÍFICO ENCONTRADO ===\n`;
            systemPrompt += JSON.stringify(medicamentoEspecifico.map(m => ({
              nombre_comercial: m.nombre_comercial,
              principio_activo: m.principio_activo,
              concentracion: m.concentracion,
              presentacion: m.presentacion,
              via_administracion: m.via_administracion,
              requiere_formula: m.requiere_formula ? 'Sí requiere fórmula médica' : 'No requiere fórmula médica',
              control_especial: m.control_especial ? 'Es un medicamento de control especial' : 'No es de control especial'
            })), null, 2);
          }

          // SIEMPRE agregar información de EPS
          if (todasEps && todasEps.length > 0) {
            systemPrompt += `\n=== EPS DISPONIBLES (${todasEps.length} total) ===\n`;
            const epsParaIA = todasEps.map(e => ({
              id: e.id_eps,
              nombre: e.nombre_eps,
              nit: e.nit,
              regimen: e.regimen,
              telefono: e.telefono,
              email: e.email,
              sitio_web: e.sitio_web
            }));
            systemPrompt += JSON.stringify(epsParaIA, null, 2);
          }

          // SIEMPRE agregar información de sedes (máximo 15 para no sobrecargar)
          if (todasSedes && todasSedes.length > 0) {
            systemPrompt += `\n=== SEDES DISPONIBLES (${todasSedes.length} total) ===\n`;
            const sedesParaIA = todasSedes.slice(0, 15).map(s => ({
              id: s.id_sede,
              nombre: s.nombre_sede,
              eps: s.eps ? s.eps.nombre_eps : 'Sin EPS asociada',
              ciudad: s.ciudad,
              departamento: s.departamento,
              direccion: s.direccion,
              barrio: s.barrio,
              telefono: s.telefono,
              horario: s.horario
            }));
            systemPrompt += JSON.stringify(sedesParaIA, null, 2);
          }
        }

        // Preparar los mensajes para la IA
        const messages = [
          { role: 'system', content: systemPrompt },
          ...session.messages
        ];

        console.log('Llamando a OpenAI con modelo:', model);
        const response = await client.chat.completions.create({
          model: model,
          messages: messages,
          max_tokens: 400,
          temperature: 0.3 // Más conservador para respuestas médicas
        });

        console.log('Respuesta de OpenAI recibida');
        const aiReply = response.choices[0]?.message?.content || 'Disculpe, no pude procesar su consulta. ¿Puede repetir su pregunta?';

        // Guardar la respuesta de la IA en el historial
        session.messages.push({ role: 'assistant', content: aiReply });
        sessions.set(sessionId, session);

        return res.json({ 
          sessionId, 
          reply: aiReply,
          ...(session.document && { storedDocument: session.document }),
          ...(userData && { userName: userData.nombre_usuario })
        });

      } catch (openaiErr) {
        console.error('OpenAI SDK error completo:', openaiErr);
        return res.json({ 
          sessionId, 
          reply: 'Disculpe, tengo problemas técnicos en este momento. ¿Puede intentar de nuevo en unos minutos?',
          error: openaiErr.message,
          ...(session.document && { storedDocument: session.document })
        });
      }
    }

    // Si no hay API key, generar respuestas por defecto según el estado
    let defaultReply = '';
    
    if (session.state === 'awaiting_document') {
      defaultReply = '¡Hola! Para poder ayudarle con medicamentos, necesito su número de documento de identidad. ¿Podría proporcionármelo, por favor?';
    } else if (session.state === 'collecting_user_data') {
      switch (session.currentQuestion) {
        case 'name':
          defaultReply = `No encontré el documento ${session.document} en nuestro sistema. Para crear su perfil y poder ayudarle con medicamentos, ¿podría decirme su nombre completo, por favor?`;
          break;
        case 'age':
          defaultReply = `Perfecto, ${session.newUserData?.nombre_usuario || ''}. Ahora, ¿cuál es su edad?`;
          break;
        case 'city':
          defaultReply = '¿En qué ciudad vive actualmente?';
          break;
        case 'email':
          defaultReply = '¿Tiene correo electrónico? Si no tiene, puede decir "no tengo".';
          break;
        case 'document_type':
          defaultReply = '¿Qué tipo de documento de identidad tiene? ¿Cédula de Ciudadanía (CC), Cédula de Extranjería (CE) o Tarjeta de Identidad (TI)?';
          break;
        case 'complete':
          defaultReply = `¡Perfecto! He creado su perfil exitosamente, ${session.newUserData?.nombre_usuario || ''}. Ahora puedo ayudarle con consultas sobre medicamentos y sedes médicas. ¿En qué puedo asistirle?`;
          break;
        default:
          defaultReply = 'Por favor, responda la pregunta anterior para completar su registro.';
      }
    } else if (session.state === 'user_verified') {
      defaultReply = `¡Hola ${userData ? userData.nombre_usuario : ''}! ¿En qué puedo ayudarle con medicamentos o consultas sobre nuestras sedes?`;
    } else if (session.state === 'user_created') {

