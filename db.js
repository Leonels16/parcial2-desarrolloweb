const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'subastas.db'));

// Crear tablas automáticamente si no existen
db.exec(`
  CREATE TABLE IF NOT EXISTS Usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    correo TEXT NOT NULL UNIQUE,
    telefono TEXT,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Vehiculos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    publicadorId INTEGER,
    articulo TEXT NOT NULL,
    anio INTEGER NOT NULL,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    motor TEXT NOT NULL,
    transmision TEXT NOT NULL,
    combustible TEXT NOT NULL,
    traccion TEXT NOT NULL,
    cilindros INTEGER NOT NULL,
    estadoDanio TEXT NOT NULL,
    montoBase REAL NOT NULL,
    ofertaActual REAL NOT NULL,
    ganadorActualId INTEGER,
    fechaInicio TEXT NOT NULL,
    fechaCierre TEXT NOT NULL,
    fotos TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS HistorialPujas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehiculoId INTEGER NOT NULL,
    usuarioId INTEGER NOT NULL,
    postorAnonimo TEXT NOT NULL,
    monto REAL NOT NULL,
    hora TEXT NOT NULL
  );
`);

// Insertar los 3 usuarios de prueba requeridos por la rúbrica si la tabla está vacía
const countUsers = db.prepare('SELECT COUNT(*) as total FROM Usuarios').get();
if (countUsers.total === 0) {
  const insertUser = db.prepare('INSERT INTO Usuarios (nombre, apellido, correo, telefono, password) VALUES (?, ?, ?, ?, ?)');
  insertUser.run('Carlos', 'Pérez', 'carlos@test.com', '5551234', '123');
  insertUser.run('Ana', 'Gómez', 'ana@test.com', '5555678', '123');
  insertUser.run('Luis', 'Martínez', 'luis@test.com', '5559012', '123');
}

// Insertar vehículos iniciales con carrusel de 5 fotos si no existen
const countVehiculos = db.prepare('SELECT COUNT(*) as total FROM Vehiculos').get();
if (countVehiculos.total === 0) {
  const insertV = db.prepare(`
    INSERT INTO Vehiculos (publicadorId, articulo, anio, marca, modelo, motor, transmision, combustible, traccion, cilindros, estadoDanio, montoBase, ofertaActual, fechaInicio, fechaCierre, fotos)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const fotosCivic = JSON.stringify([
    'https://images.unsplash.com/photo-1606016159991-dff191060931?w=600',
    'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600',
    'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600'
  ]);

  const fotosRav4 = JSON.stringify([
    'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?w=600',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600',
    'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=600'
  ]);

  insertV.run(1, 'Sedán Deportivo', 2021, 'Honda', 'Civic', '1.5L Turbo', 'Automática', 'Gasolina', 'FWD', 4, 'Verde', 20000, 20000, new Date().toISOString(), new Date(Date.now() + 86400000).toISOString(), fotosCivic);
  insertV.run(2, 'Camioneta Familiar', 2019, 'Toyota', 'RAV4', '2.5L', 'Automática', 'Híbrido', 'AWD', 4, 'Amarillo', 35000, 35000, new Date().toISOString(), new Date(Date.now() + 7200000).toISOString(), fotosRav4);
}

module.exports = db;