const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// AUTENTICACIÓN MEDIANTE SQL
app.post('/api/auth/register', (req, res) => {
  const { nombre, apellido, correo, telefono, password } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO Usuarios (nombre, apellido, correo, telefono, password) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(nombre, apellido, correo, telefono, password);
    res.json({ mensaje: 'Usuario registrado', usuario: { id: info.lastInsertRowid, nombre, correo } });
  } catch (error) {
    res.status(400).json({ error: 'El correo ya está registrado o faltan datos' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { correo, password } = req.body;
  const user = db.prepare('SELECT id, nombre, correo FROM Usuarios WHERE correo = ? AND password = ?').get(correo, password);
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
  res.json({ usuario: user });
});

// VEHÍCULOS / CATÁLOGO MEDIANTE SQL
app.get('/api/vehiculos', (req, res) => {
  const vehiculos = db.prepare('SELECT * FROM Vehiculos ORDER BY id DESC').all();
  const respuesta = vehiculos.map(v => ({
    ...v,
    fotos: JSON.parse(v.fotos),
    historialPujas: db.prepare('SELECT postorAnonimo as postor, monto, hora FROM HistorialPujas WHERE vehiculoId = ? ORDER BY id DESC').all(v.id)
  }));
  res.json(respuesta);
});

app.post('/api/vehiculos', (req, res) => {
  const d = req.body;
  const fotosJson = JSON.stringify(d.fotos && d.fotos.length >= 5 ? d.fotos : [
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600',
    'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600',
    'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600',
    'https://images.unsplash.com/photo-1606016159991-dff191060931?w=600'
  ]);

  const stmt = db.prepare(`
    INSERT INTO Vehiculos (publicadorId, articulo, anio, marca, modelo, motor, transmision, combustible, traccion, cilindros, estadoDanio, montoBase, ofertaActual, fechaInicio, fechaCierre, fotos)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(d.usuarioId, d.articulo, d.anio, d.marca, d.modelo, d.motor, d.transmision, d.combustible, d.traccion, d.cilindros, d.estadoDanio, d.montoBase, d.montoBase, d.fechaInicio, d.fechaCierre, fotosJson);

  const nuevo = { ...d, id: info.lastInsertRowid, ofertaActual: d.montoBase, fotos: JSON.parse(fotosJson), historialPujas: [] };
  io.emit('nuevoVehiculo', nuevo);
  res.status(201).json(nuevo);
});

// WEBSOCKETS CON PERSISTENCIA EN BASE DE DATOS
io.on('connection', (socket) => {
  socket.on('realizarPuja', ({ vehiculoId, monto, usuarioId }) => {
    const v = db.prepare('SELECT * FROM Vehiculos WHERE id = ?').get(vehiculoId);
    if (!v) return socket.emit('errorPuja', 'Vehículo no encontrado');

    const ahora = new Date();
    if (ahora > new Date(v.fechaCierre) || ahora < new Date(v.fechaInicio)) {
      return socket.emit('errorPuja', 'Subasta no disponible');
    }

    const minPermitido = v.ofertaActual * 1.10;
    if (monto < v.montoBase || monto < minPermitido) {
      return socket.emit('errorPuja', `La puja mínima es de Q. ${minPermitido.toFixed(2)} (+10%)`);
    }

    const postorAnonimo = `Postor #${String(usuarioId).slice(-4)}`;
    const hora = new Date().toLocaleTimeString();

    // Actualizar vehículo e insertar puja en base de datos
    db.prepare('UPDATE Vehiculos SET ofertaActual = ?, ganadorActualId = ? WHERE id = ?').run(monto, usuarioId, vehiculoId);
    db.prepare('INSERT INTO HistorialPujas (vehiculoId, usuarioId, postorAnonimo, monto, hora) VALUES (?, ?, ?, ?, ?)').run(vehiculoId, usuarioId, postorAnonimo, monto, hora);

    const historial = db.prepare('SELECT postorAnonimo as postor, monto, hora FROM HistorialPujas WHERE vehiculoId = ? ORDER BY id DESC').all(vehiculoId);

    io.emit('pujaActualizada', {
      vehiculoId: v.id,
      nuevaOferta: monto,
      ganadorActualId: usuarioId,
      anteriorGanadorId: v.ganadorActualId,
      historial
    });
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Servidor activo con Base de Datos SQL en puerto ${PORT}`));