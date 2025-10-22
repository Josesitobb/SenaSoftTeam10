-- =============================================
-- DDL para Agente de Consulta Inteligente de Medicamentos (AIM)
-- Versión adaptada a MariaDB / MySQL
-- =============================================
-- Codificación recomendada: UTF-8

DROP DATABASE IF EXISTS `sallydb`;
CREATE DATABASE `sallydb`;
use `sallydb`;

-- Limpieza previa (orden para respetar FKs)
DROP TABLE IF EXISTS consultas;
DROP TABLE IF EXISTS eventos_abastecimiento;
DROP TABLE IF EXISTS equivalencias;
DROP TABLE IF EXISTS inventario_sede;
DROP TABLE IF EXISTS medicamentos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS sedes;
DROP TABLE IF EXISTS eps;

-- =============================================
-- 1) EPS
-- =============================================
CREATE TABLE eps (
  id_eps INT AUTO_INCREMENT PRIMARY KEY,
  nombre_eps VARCHAR(120) NOT NULL,
  nit VARCHAR(20) NOT NULL UNIQUE,
  regimen ENUM('Contributivo','Subsidiado','Mixto') NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  sitio_web VARCHAR(200)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_eps_nombre ON eps(nombre_eps);

-- =============================================
-- 2) SEDES
-- =============================================
CREATE TABLE sedes (
  id_sede INT AUTO_INCREMENT PRIMARY KEY,
  id_eps INT NOT NULL,
  nombre_sede VARCHAR(160) NOT NULL,
  ciudad VARCHAR(80) NOT NULL,
  departamento VARCHAR(80) NOT NULL,
  direccion VARCHAR(160) NOT NULL,
  barrio VARCHAR(100),
  latitud DECIMAL(9,6),
  longitud DECIMAL(9,6),
  horario VARCHAR(80),
  telefono VARCHAR(20) NOT NULL,
  FOREIGN KEY (id_eps) REFERENCES eps(id_eps)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_sedes_eps ON sedes(id_eps);
CREATE INDEX idx_sedes_ciudad ON sedes(ciudad);

-- =============================================
-- 3) ROLES
-- =============================================
CREATE TABLE roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre_rol VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_roles_nombre ON roles(nombre_rol);

-- =============================================
-- 4) USUARIOS
-- =============================================
CREATE TABLE usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  tipo_documento ENUM('CC','CE','TI') NOT NULL,
  documento VARCHAR(20) NOT NULL UNIQUE,
  nombre_usuario VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE,
  password_hash VARCHAR(255),
  edad INT CHECK (edad BETWEEN 0 AND 120),
  ciudad VARCHAR(80),
  canal_preferido ENUM('web','whatsapp','telefono'),
  id_sede_preferida INT,
  id_rol INT NOT NULL,
  estado ENUM('activo','inactivo','bloqueado') DEFAULT 'activo',
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso DATETIME,
  FOREIGN KEY (id_sede_preferida) REFERENCES sedes(id_sede),
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_usuarios_documento ON usuarios(documento);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_ciudad ON usuarios(ciudad);

-- =============================================
-- 5) MEDICAMENTOS
-- =============================================
CREATE TABLE medicamentos (
  id_medicamento INT AUTO_INCREMENT PRIMARY KEY,
  principio_activo VARCHAR(120) NOT NULL,
  nombre_comercial VARCHAR(120) NOT NULL,
  concentracion VARCHAR(30) NOT NULL,
  presentacion VARCHAR(60) NOT NULL,
  atc_code VARCHAR(10),
  via_administracion VARCHAR(40) NOT NULL,
  unidad_medida VARCHAR(10) NOT NULL,
  requiere_formula BOOLEAN NOT NULL DEFAULT TRUE,
  control_especial BOOLEAN NOT NULL DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_med_pa ON medicamentos(principio_activo);
CREATE INDEX idx_med_nombre ON medicamentos(nombre_comercial);

-- =============================================
-- 6) INVENTARIO_SEDE
-- =============================================
CREATE TABLE inventario_sede (
  id_inventario INT AUTO_INCREMENT PRIMARY KEY,
  id_sede INT NOT NULL,
  id_medicamento INT NOT NULL,
  stock INT NOT NULL CHECK (stock >= 0),
  stock_minimo INT NOT NULL CHECK (stock_minimo >= 0),
  fecha_actualizacion DATE NOT NULL,
  estado_disponibilidad ENUM('disponible','bajo_stock','agotado') NOT NULL,
  causa_no_disponibilidad VARCHAR(40),
  fecha_estimada_reabastecimiento DATE,
  lote VARCHAR(20),
  fecha_vencimiento DATE,
  UNIQUE KEY uq_inv_sede_medic (id_sede, id_medicamento),
  FOREIGN KEY (id_sede) REFERENCES sedes(id_sede),
  FOREIGN KEY (id_medicamento) REFERENCES medicamentos(id_medicamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_inv_sede ON inventario_sede(id_sede);
CREATE INDEX idx_inv_medicamento ON inventario_sede(id_medicamento);
CREATE INDEX idx_inv_estado ON inventario_sede(estado_disponibilidad);

-- =============================================
-- 7) EQUIVALENCIAS
-- =============================================
CREATE TABLE equivalencias (
  id_equivalencia INT AUTO_INCREMENT PRIMARY KEY,
  id_medicamento_base INT NOT NULL,
  id_medicamento_alternativo INT NOT NULL,
  tipo ENUM('generico','equivalente_terapeutico') NOT NULL,
  CHECK (id_medicamento_base <> id_medicamento_alternativo),
  FOREIGN KEY (id_medicamento_base) REFERENCES medicamentos(id_medicamento),
  FOREIGN KEY (id_medicamento_alternativo) REFERENCES medicamentos(id_medicamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_eq_base ON equivalencias(id_medicamento_base);
CREATE INDEX idx_eq_alt ON equivalencias(id_medicamento_alternativo);

-- =============================================
-- 8) EVENTOS_ABASTECIMIENTO
-- =============================================
CREATE TABLE eventos_abastecimiento (
  id_evento INT AUTO_INCREMENT PRIMARY KEY,
  id_sede INT NOT NULL,
  id_medicamento INT NOT NULL,
  tipo_evento ENUM('reabastecimiento','retiro_temporal','ajuste_stock','desabastecimiento_nacional') NOT NULL,
  fecha_evento DATE NOT NULL,
  cantidad_ajustada INT NOT NULL,
  observaciones VARCHAR(200),
  FOREIGN KEY (id_sede) REFERENCES sedes(id_sede),
  FOREIGN KEY (id_medicamento) REFERENCES medicamentos(id_medicamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_evt_sede ON eventos_abastecimiento(id_sede);
CREATE INDEX idx_evt_medicamento ON eventos_abastecimiento(id_medicamento);
CREATE INDEX idx_evt_tipo ON eventos_abastecimiento(tipo_evento);

-- =============================================
-- 9) CONSULTAS
-- =============================================
CREATE TABLE consultas (
  id_consulta INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  fecha_hora DATETIME NOT NULL,
  canal ENUM('web','whatsapp','telefono') NOT NULL,
  termino_buscado VARCHAR(120) NOT NULL,
  id_medicamento_encontrado INT,
  respuesta TEXT NOT NULL,
  tiempo_respuesta_ms INT NOT NULL CHECK (tiempo_respuesta_ms >= 0),
  disponible BOOLEAN NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_medicamento_encontrado) REFERENCES medicamentos(id_medicamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_consulta_fecha ON consultas(fecha_hora);
CREATE INDEX idx_consulta_canal ON consultas(canal);
CREATE INDEX idx_consulta_termino ON consultas(termino_buscado);
CREATE INDEX idx_consulta_usuario ON consultas(id_usuario);