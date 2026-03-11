# SEGELI

Sistema de gestión de inventario desarrollado con Electron, Node.js y MySQL.

# Tecnologias usadas

- Electron
- Node.js
- MySQL
- HTML
- CSS
- JavaScript

## Requisitos

- Node.js
- MySQL

## Instalación

1. Clonar el repositorio

git clone https://github.com/usuario/segeli

2. Entrar al proyecto

cd segeli

3. Instalar dependencias

npm install

4. Crear la base de datos

Ejecutar el script ubicado en:

database/script/dbSegeli.sql

5. Configurar conexión a la base de datos

Abrir el archivo:

src/db/conexion.js

y configurar los datos de conexión a MySQL:

host: localhost  
user: root  
password: tu_contraseña  
database: inventario

6. Iniciar la aplicación

npm start

## Usuario de prueba

Administrador  
usuario: admin  
contraseña: admin123

Vendedor  
usuario: vendedor  
contraseña: admin123
