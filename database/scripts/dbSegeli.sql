DROP DATABASE IF EXISTS inventario;
CREATE DATABASE inventario CHARACTER SET utf8mb4;
USE inventario;

/* ===== ROLES ===== */
CREATE TABLE roles (
  idRol INT AUTO_INCREMENT,
  tipo VARCHAR(45) NOT NULL,
  descripcion VARCHAR(500),
  PRIMARY KEY (idRol),
  UNIQUE KEY uk_roles_tipo (tipo)
) ENGINE=InnoDB;

/* ===== CATEGORÍAS ===== */
CREATE TABLE categoria (
  idCategoria INT AUTO_INCREMENT,
  nombreCategoria VARCHAR(45) NOT NULL,
  descripcion VARCHAR(500),
  PRIMARY KEY (idCategoria),
  UNIQUE KEY uk_categoria_nombre (nombreCategoria)
) ENGINE=InnoDB;

/* ===== USUARIOS ===== */
CREATE TABLE usuarios (
  idUsuario INT AUTO_INCREMENT,
  usuario VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  cedula VARCHAR(20) NOT NULL,
  nombres VARCHAR(45) NOT NULL,
  apellidos VARCHAR(45) NOT NULL,
  correo VARCHAR(100), 
  telefono VARCHAR(15),
  idRol INT NOT NULL,
  PRIMARY KEY (idUsuario),
  UNIQUE KEY uk_usuario_usuario (usuario),
  UNIQUE KEY uk_usuario_cedula (cedula),
  KEY idx_usuario_rol (idRol),
  CONSTRAINT fk_usuario_rol
    FOREIGN KEY (idRol) REFERENCES roles(idRol)
) ENGINE=InnoDB;

/* ===== PRODUCTOS ===== */
CREATE TABLE productos (
  idProducto INT AUTO_INCREMENT,
  codigoProducto VARCHAR(50) NOT NULL, -- SKU o código de barras
  nombreProducto VARCHAR(100) NOT NULL,
  idCategoria INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 0,
  stockMinimo INT NOT NULL DEFAULT 0, 
  precioFactura DECIMAL(10,2) NOT NULL,
  precioDetal DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (idProducto),
  UNIQUE KEY uk_producto_codigo (codigoProducto),
  UNIQUE KEY uk_producto_nombre (nombreProducto),
  KEY idx_producto_categoria (idCategoria),
  CONSTRAINT fk_producto_categoria
    FOREIGN KEY (idCategoria) REFERENCES categoria(idCategoria)
) ENGINE=InnoDB;

/* ===== RECEPCIÓN ===== */
CREATE TABLE recepcion (
  idRecepcion INT AUTO_INCREMENT,
  fechaRecepcion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  idUsuario INT NOT NULL,
  observacion VARCHAR(150),
  PRIMARY KEY (idRecepcion),
  KEY idx_recepcion_usuario (idUsuario),
  CONSTRAINT fk_recepcion_usuario
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario)
) ENGINE=InnoDB;

/* ===== RECEPCIÓN DETALLE ===== */
CREATE TABLE recepcion_detalle (
  idRecepcionDetalle INT AUTO_INCREMENT,
  idRecepcion INT NOT NULL,
  idProducto INT NOT NULL,
  cantidad INT NOT NULL,
  precioFactura DECIMAL(10,2) NOT NULL,
  precioDetal DECIMAL(10,2) NOT NULL,
  fechaVencimiento DATE,
  PRIMARY KEY (idRecepcionDetalle),
  KEY idx_rd_recepcion (idRecepcion),
  KEY idx_rd_producto (idProducto),
  CONSTRAINT fk_rd_recepcion
    FOREIGN KEY (idRecepcion) REFERENCES recepcion(idRecepcion),
  CONSTRAINT fk_rd_producto
    FOREIGN KEY (idProducto) REFERENCES productos(idProducto)
) ENGINE=InnoDB;

/* ===== VENTAS (CABECERA) ===== */
CREATE TABLE ventas (
  idVenta INT AUTO_INCREMENT,
  fechaVenta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  idUsuario INT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  observacion VARCHAR(150),
  PRIMARY KEY (idVenta),
  KEY idx_venta_usuario (idUsuario),
  CONSTRAINT fk_venta_usuario
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario)
) ENGINE=InnoDB;

/* ===== VENTA DETALLE ===== */
CREATE TABLE venta_detalle (
  idVentaDetalle INT AUTO_INCREMENT,
  idVenta INT NOT NULL,
  idProducto INT NOT NULL,
  cantidadVendida INT NOT NULL,
  precioUnitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (idVentaDetalle),
  KEY idx_vd_venta (idVenta),
  KEY idx_vd_producto (idProducto),
  CONSTRAINT fk_vd_venta
    FOREIGN KEY (idVenta) REFERENCES ventas(idVenta),
  CONSTRAINT fk_vd_producto
    FOREIGN KEY (idProducto) REFERENCES productos(idProducto)
) ENGINE=InnoDB;

/* ===== ANOTACIONES ===== */
CREATE TABLE anotaciones (
  idAnotaciones INT AUTO_INCREMENT,
  idProducto INT NOT NULL,
  idUsuario INT NOT NULL,
  cantidad INT NOT NULL,
  observacion VARCHAR(100) NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idAnotaciones),
  KEY idx_anot_producto (idProducto),
  KEY idx_anot_usuario (idUsuario),
  CONSTRAINT fk_anot_producto
    FOREIGN KEY (idProducto) REFERENCES productos(idProducto),
  CONSTRAINT fk_anot_usuario
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario)
) ENGINE=InnoDB;

-- Tabla de devoluciones
CREATE TABLE IF NOT EXISTS devoluciones (
    idDevolucion INT AUTO_INCREMENT PRIMARY KEY,
    fechaDevolucion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    idUsuario INT NOT NULL,
    idVenta INT NOT NULL,
    motivo TEXT,
    FOREIGN KEY (idUsuario) REFERENCES usuarios(idUsuario),
    FOREIGN KEY (idVenta) REFERENCES ventas(idVenta)
);

-- Tabla de devolucion_detalle
CREATE TABLE IF NOT EXISTS devolucion_detalle (
    idDevolucionDetalle INT AUTO_INCREMENT PRIMARY KEY,
    idDevolucion INT NOT NULL,
    idProducto INT NOT NULL,
    cantidad INT NOT NULL,
    precioUnitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (idDevolucion) REFERENCES devoluciones(idDevolucion),
    FOREIGN KEY (idProducto) REFERENCES productos(idProducto)
);

-- USUARIO PRUEBA
INSERT INTO roles (tipo, descripcion)
VALUES ("Administrador", "Usuario con acceso completo al sistema");

INSERT INTO categoria (nombreCategoria, descripcion)
VALUES ("General", "Categoría inicial del sistema");

INSERT INTO usuarios (usuario, password, cedula, nombres, apellidos, idRol)
VALUES ("admin", "$10$ImfC0HEZZivRBQFYxUjtaOiltehZFx4tkRFP3NuBIpQmXDRb7ero2", "1234567891", "Administrador", "Sistema", 1);

