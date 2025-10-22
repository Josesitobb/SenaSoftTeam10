import prisma from '../models/prismaClient.js';
import { OpenAI } from 'openai';

// Almacenar las sesiones de conversación en memoria
const sessions = new Map();

// Función auxiliar para generar un sessionId único
function genSessionId() {
  return 'mh2' + Math.random().toString(36).substring(2, 15);
}

// Función para crear un nuevo usuario en la base de datos
async function crearNuevoUsuario(datosUsuario) {
  try {
    console.log('=== INICIANDO CREACIÓN DE USUARIO ===');
    console.log('Datos recibidos:', JSON.stringify(datosUsuario, null, 2));
    
    if (!datosUsuario.documento || !datosUsuario.nombre_usuario) {
      console.error('❌ ERROR: Faltan datos requeridos - documento y nombre son obligatorios');
      throw new Error('Faltan datos requeridos: documento y nombre');
    }

    // Verificar que el documento no exista ya
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
        // Mostrar las sedes disponibles
        const sedes = await obtenerSedesParaRegistro();
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
        const sedes = await obtenerSedesParaRegistro();
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

    // Consultar datos completos de la base de datos con nombres y relaciones
    console.log('=== CONSULTANDO BASE DE DATOS COMPLETA PARA ChatGPT ===');
    
    // 1. Obtener todos los medicamentos básicos
    const todosMedicamentos = await obtenerTodosMedicamentosFromDB();
    
    // 2. Obtener inventario completo con nombres de sedes y medicamentos
    const inventarioCompleto = await obtenerInventarioCompletoConNombres();
    
    // 3. Obtener sedes con información completa de EPS
    const sedesConEps = await obtenerSedesConEpsCompletas();
    
    // 4. Obtener todas las EPS
    const todasEps = await obtenerTodasEpsFromDB();
    
    // 5. Si el usuario menciona un medicamento específico, buscarlo con ubicaciones
    let medicamentoEspecifico = null;
    const palabrasClave = userInput.toLowerCase().match(/\b\w+\b/g) || [];
    
    for (const palabra of palabrasClave) {
      if (palabra.length >= 4) { // Solo buscar palabras de 4+ caracteres
        const resultados = await buscarMedicamentoConUbicaciones(palabra);
        if (resultados.length > 0) {
          medicamentoEspecifico = { medicamento: palabra, ubicaciones: resultados };
          console.log(`🎯 Medicamento específico encontrado: ${palabra} en ${resultados.length} ubicaciones`);
          break;
        }
      }
    }
    
    console.log(`✅ Datos consultados: ${todosMedicamentos.length} medicamentos, ${inventarioCompleto.length} en inventario, ${sedesConEps.length} sedes, ${todasEps.length} EPS`);

    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

    // Crear contexto optimizado para la IA (limitado para evitar exceso de tokens)
    let systemPrompt = `Eres Sally, asistente especializada en medicamentos para adultos mayores (50-80 años).

USUARIO VERIFICADO: ${session.userData.nombre_usuario} (Documento: ${session.userData.documento})

REGLAS ESTRICTAS PARA MEDICAMENTOS:
1. SOLO puedes hablar de medicamentos que EXISTEN en la base de datos
2. Si un medicamento NO está en la lista, di claramente "No tenemos ese medicamento disponible"
3. Si un medicamento SÍ está disponible, indica EXACTAMENTE en qué sedes se encuentra
4. Usa lenguaje claro y simple para adultos mayores
5. Siempre recomienda consultar con un médico
6. Mantén respuestas cortas y directas

RESUMEN DE DATOS DISPONIBLES:
- ${todosMedicamentos.length} medicamentos en catálogo
- ${inventarioCompleto.length} ubicaciones de medicamentos en ${sedesConEps.length} sedes
- ${todasEps.length} EPS disponibles

PRINCIPALES MEDICAMENTOS DISPONIBLES (muestra):
${JSON.stringify(todosMedicamentos.slice(0, 30).map(m => ({
  nombre: m.nombre_comercial,
  principio: m.principio_activo
})), null, 2)}`;

    // Si encontramos un medicamento específico, agregarlo al contexto
    if (medicamentoEspecifico) {
      systemPrompt += `

🎯 MEDICAMENTO ESPECÍFICO CONSULTADO: "${medicamentoEspecifico.medicamento}"
UBICACIONES EXACTAS:
${JSON.stringify(medicamentoEspecifico.ubicaciones, null, 2)}

IMPORTANTE: El usuario preguntó específicamente por "${medicamentoEspecifico.medicamento}". 
${medicamentoEspecifico.ubicaciones.length > 0 
  ? `SÍ tenemos este medicamento disponible en ${medicamentoEspecifico.ubicaciones.length} ubicación(es). Proporciona información detallada de dónde encontrarlo.`
  : `NO tenemos este medicamento en nuestro inventario. Informa claramente que no está disponible.`
}`;
    } else {
      // Si no encontramos medicamento específico, agregar información general limitada
      systemPrompt += `

INFORMACIÓN GENERAL DE INVENTARIO (limitada):
${JSON.stringify(inventarioCompleto.slice(0, 10), null, 2)}

SEDES PRINCIPALES:
${JSON.stringify(sedesConEps.slice(0, 10), null, 2)}`;
    }

    systemPrompt += `

INSTRUCCIONES FINALES:
- Si preguntan por un medicamento que NO aparece en la lista, responde: "No tenemos [nombre del medicamento] disponible en nuestras farmacias"
- Si preguntan por un medicamento que SÍ aparece, indica las sedes exactas donde está disponible
- Para consultas sobre EPS, usa solo las EPS de la lista
- Para consultas sobre sedes, proporciona información completa incluyendo la EPS asociada
- Siempre termina recomendando consultar con un médico`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...session.messages
    ];

    console.log('🤖 Enviando consulta a OpenAI con información completa de base de datos...');
    const response = await client.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: 500,
      temperature: 0.2 // Más determinístico para información médica
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
      user: session.userData.nombre_usuario,
      ...(medicamentoEspecifico && { 
        medicamento_consultado: medicamentoEspecifico.medicamento,
        ubicaciones_encontradas: medicamentoEspecifico.ubicaciones.length 
      })
    });

  } catch (error) {
    console.error('❌ Error en consulta médica:', error);
    return res.status(500).json({ error: 'Error procesando la consulta médica.' });
  }
}

// Funciones auxiliares de base de datos
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

async function obtenerTodasSedesFromDB() {
  try {
    console.log('Consultando TODAS las sedes en la base de datos...');
    const sedes = await prisma.sedes.findMany({
      include: {
        eps: true
      }
    });
    console.log(`Se encontraron ${sedes.length} sedes en la base de datos`);
    return sedes;
  } catch (error) {
    console.error('Error obteniendo sedes:', error);
    return [];
  }
}

// Función nueva para usar en el registro - obtener sedes básicas
async function obtenerSedesParaRegistro() {
  try {
    const sedes = await prisma.sedes.findMany({
      select: {
        id_sede: true,
        nombre_sede: true,
        ciudad: true
      }
    });
    return sedes;
  } catch (error) {
    console.error('Error obteniendo sedes para registro:', error);
    return [];
  }
}

// Función para obtener inventario completo con nombres de medicamentos y sedes
async function obtenerInventarioCompletoConNombres() {
  try {
    console.log('🔍 Consultando inventario completo con nombres de medicamentos y sedes...');
    
    const inventarioCompleto = await prisma.inventario_sede.findMany({
      select: {
        id_inventario: true,
        stock: true,
        stock_minimo: true,
        estado_disponibilidad: true,
        medicamento: {
          select: {
            id_medicamento: true,
            nombre_comercial: true,
            principio_activo: true,
            concentracion: true,
            presentacion: true,
            via_administracion: true
          }
        },
        sedes: {
          select: {
            id_sede: true,
            nombre_sede: true,
            ciudad: true,
            departamento: true,
            direccion: true,
            telefono: true,
            eps: {
              select: {
                id_eps: true,
                nombre_eps: true,
                regimen: true
              }
            }
          }
        }
      }
    });

    // Organizar la información de forma más clara para la IA
    const inventarioOrganizado = inventarioCompleto.map(item => ({
      medicamento: {
        nombre_comercial: item.medicamento.nombre_comercial,
        principio_activo: item.medicamento.principio_activo,
        concentracion: item.medicamento.concentracion,
        presentacion: item.medicamento.presentacion,
        presentacion: item.medicamento.presentacion,
        via: item.medicamento.via_administracion
      },
      ubicacion: {
        sede: item.sedes.nombre_sede,
        ciudad: item.sedes.ciudad,
        departamento: item.sedes.departamento,
        direccion: item.sedes.direccion,
        telefono: item.sedes.telefono,
        eps: item.sedes.eps ? item.sedes.eps.nombre_eps : 'Sin EPS',
        regimen: item.sedes.eps ? item.sedes.eps.regimen : 'Sin información'
      },
      disponibilidad: {
        stock_actual: item.stock,
        stock_minimo: item.stock_minimo,
        estado: item.estado_disponibilidad,
        disponible: item.stock > 0
      }
    }));

    console.log(`✅ Se encontraron ${inventarioOrganizado.length} medicamentos en inventario con ubicaciones completas`);
    return inventarioOrganizado;

  } catch (error) {
    console.error('❌ Error obteniendo inventario completo:', error);
    return [];
  }
}

// Función para obtener todas las sedes con sus EPS relacionadas (nombres completos)
async function obtenerSedesConEpsCompletas() {
  try {
    console.log('🏥 Consultando sedes con información completa de EPS...');
    
    const sedes = await prisma.sedes.findMany({
      select: {
        id_sede: true,
        nombre_sede: true,
        ciudad: true,
        departamento: true,
        direccion: true,
        barrio: true,
        telefono: true,
        horario: true,
        eps: {
          select: {
            id_eps: true,
            nombre_eps: true,
            regimen: true,
            telefono: true,
            email: true,
            sitio_web: true
          }
        }
      }
    });

    // Organizar información para la IA
    const sedesOrganizadas = sedes.map(sede => ({
      sede: {
        nombre: sede.nombre_sede,
        ciudad: sede.ciudad,
        departamento: sede.departamento,
        direccion: sede.direccion,
        barrio: sede.barrio,
        telefono: sede.telefono,
        horario: sede.horario
      },
      eps: sede.eps ? {
        nombre: sede.eps.nombre_eps,
        regimen: sede.eps.regimen,
        contacto: {
          telefono: sede.eps.telefono,
          email: sede.eps.email,
          sitio_web: sede.eps.sitio_web
        }
      } : null
    }));

    console.log(`✅ Se encontraron ${sedesOrganizadas.length} sedes con información completa de EPS`);
    return sedesOrganizadas;

  } catch (error) {
    console.error('❌ Error obteniendo sedes con EPS:', error);
    return [];
  }
}

// Función para buscar medicamentos específicos por nombre con sus ubicaciones
async function buscarMedicamentoConUbicaciones(nombreMedicamento) {
  try {
    console.log(`🔍 Buscando medicamento "${nombreMedicamento}" con ubicaciones...`);
    
    const medicamentosEncontrados = await prisma.inventario_sede.findMany({
      where: {
        medicamento: {
          OR: [
            { nombre_comercial: { contains: nombreMedicamento } },
            { principio_activo: { contains: nombreMedicamento } }
          ]
        }
      },
      select: {
        stock: true,
        stock_minimo: true,
        estado_disponibilidad: true,
        medicamento: {
          select: {
            nombre_comercial: true,
            principio_activo: true,
            concentracion: true,
            presentacion: true
          }
        },
        sedes: {
          select: {
            nombre_sede: true,
            ciudad: true,
            direccion: true,
            telefono: true,
            eps: {
              select: {
                nombre_eps: true
              }
            }
          }
        }
      }
    });

    const resultadoOrganizado = medicamentosEncontrados.map(item => ({
      medicamento: item.medicamento.nombre_comercial,
      principio_activo: item.medicamento.principio_activo,
      concentracion: item.medicamento.concentracion,
      presentacion: item.medicamento.presentacion,
      sede: item.sedes.nombre_sede,
      ciudad: item.sedes.ciudad,
      direccion: item.sedes.direccion,
      telefono: item.sedes.telefono,
      eps: item.sedes.eps ? item.sedes.eps.nombre_eps : 'Sin EPS',
      stock: item.stock,
      disponible: item.stock > 0,
      estado: item.estado_disponibilidad
    }));

    console.log(`✅ Encontrados ${resultadoOrganizado.length} registros para "${nombreMedicamento}"`);
    return resultadoOrganizado;

  } catch (error) {
    console.error('❌ Error buscando medicamento:', error);
    return [];
  }
}

async function agregarConsulta(consulta, sessionId, userData) {
  try {
    console.log(`Agregando consulta para la sesión ${sessionId}:`, consulta);

    // Verificar que tenemos un usuario válido
    if (!userData || !userData.id_usuario) {
      console.log('❌ No se puede agregar consulta sin datos de usuario válidos');
      return null;
    }

    const data = {
      id_usuario: userData.id_usuario,
      fecha_hora: new Date(),
      canal: 'web', // Canal por defecto para web
      termino_buscado: typeof consulta === 'string' ? consulta.substring(0, 120) : JSON.stringify(consulta).substring(0, 120),
      respuesta: 'Procesando...', // Respuesta temporal
      tiempo_respuesta_ms: 0, // Será actualizado después
      disponible: true // Por defecto true
    };

    const created = await prisma.consultas.create({ data });
    console.log('✅ Consulta creada exitosamente:', created.id_consulta);
    return created;
  } catch (error) {
    console.error('❌ Error agregando consulta:', error);
    return null;
  }
}

// Controladores principales
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

export const postMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, documento } = req.body;

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
        session.newUserData = { documento: documentoUsuario };
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

    return res.status(400).json({ error: 'Estado de sesión no válido.' });

  } catch (error) {
    console.error('❌ Error en postMessage:', error);
    return res.status(500).json({ error: 'Error interno en el sistema' });
  }
};