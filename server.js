const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// USUARIOS PRE-CREADOS PARA LA EVALUACIÓN
let usuarios = [
  { id: 1, nombre: 'Carlos', apellido: 'Pérez', correo: 'carlos@test.com', telefono: '5551234', password: '123' },
  { id: 2, nombre: 'Ana', apellido: 'Gómez', correo: 'ana@test.com', telefono: '5555678', password: '123' },
  { id: 3, nombre: 'Luis', apellido: 'Martínez', correo: 'luis@test.com', telefono: '5559012', password: '123' }
];

// INVENTARIO INICIAL CON CARROUSEL DE FOTOS Y PARÁMETROS
let vehiculos = [
  {
    id: 1,
    publicadorId: 1,
    articulo: 'Sedán Deportivo',
    anio: 2021,
    marca: 'Honda',
    modelo: 'Civic',
    motor: '1.5L Turbo',
    transmision: 'Automática',
    combustible: 'Gasolina',
    traccion: 'FWD',
    cilindros: 4,
    estadoDanio: 'Verde', // Verde: Daño menor / Limpio
    montoBase: 20000,
    ofertaActual: 20000,
    ganadorActualId: null,
    historialPujas: [],
    fechaInicio: new Date(Date.now() - 3600000).toISOString(),
    fechaCierre: new Date(Date.now() + 86400000).toISOString(),
    fotos: [
      'https://images.unsplash.com/photo-1606016159991-dff191060931?w=600',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600'
    ]
  },
  {
    id: 2,
    publicadorId: 2,
    articulo: 'Camioneta Familiar',
    anio: 2019,
    marca: 'Toyota',
    modelo: 'RAV4',
    motor: '2.5L',
    transmision: 'Automática',
    combustible: 'Híbrido',
    traccion: 'AWD',
    cilindros: 4,
    estadoDanio: 'Amarillo', // Amarillo: Daño medio / Reparable
    montoBase: 35000,
    ofertaActual: 35000,
    ganadorActualId: null,
    historialPujas: [],
    fechaInicio: new Date(Date.now() - 3600000).toISOString(),
    fechaCierre: new Date(Date.now() + 7200000).toISOString(),
    fotos: [
      'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?w=600',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600',
      'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=600'
    ]
  },
  {
    id: 3,
    publicadorId: 3,
    articulo: 'Camioneta Pesada',
    anio: 2018,
    marca: 'Ford',
    modelo: 'F-150',
    motor: '5.0L V8',
    transmision: 'Automática',
    combustible: 'Gasolina',
    traccion: '4WD',
    cilindros: 8,
    estadoDanio: 'Rojo', // Rojo: Daño severo / Salvamento
    montoBase: 45000,
    ofertaActual: 45000,
    ganadorActualId: null,
    historialPujas: [],
    fechaInicio: new Date(Date.now() - 3600000).toISOString(),
    fechaCierre: new Date(Date.now() + 10800000).toISOString(),
    fotos: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600'
    ]
  }
];

// ENDPOINTS DE AUTENTICACIÓN
app.post('/api/auth/register', (req, res) => {
  const { nombre, apellido, correo, telefono, password } = req.body;
  if (!nombre || !correo || !password) return res.status(400).json({ error: 'Faltan campos obligatorios' });
  if (usuarios.find(u => u.correo === correo)) return res.status(400).json({ error: 'El correo ya está registrado' });

  const nuevoUsuario = { id: Date.now(), nombre, apellido, correo, telefono, password };
  usuarios.push(nuevoUsuario);
  res.json({ mensaje: 'Registro exitoso', usuario: nuevoUsuario });
});

app.post('/api/auth/login', (req, res) => {
  const { correo, password } = req.body;
  const user = usuarios.find(u => u.correo === correo && u.password === password);
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
  res.json({ usuario: { id: user.id, nombre: user.nombre, correo: user.correo } });
});

// ENDPOINTS DE VEHÍCULOS
app.get('/api/vehiculos', (req, res) => {
  res.json(vehiculos);
});

app.post('/api/vehiculos', (req, res) => {
  const data = req.body;
  const nuevo = {
    id: Date.now(),
    publicadorId: data.usuarioId,
    articulo: data.articulo,
    anio: parseInt(data.anio),
    marca: data.marca,
    modelo: data.modelo,
    motor: data.motor,
    transmision: data.transmision,
    combustible: data.combustible,
    traccion: data.traccion,
    cilindros: parseInt(data.cilindros),
    estadoDanio: data.estadoDanio,
    montoBase: parseFloat(data.montoBase),
    ofertaActual: parseFloat(data.montoBase),
    ganadorActualId: null,
    historialPujas: [],
    fechaInicio: data.fechaInicio,
    fechaCierre: data.fechaCierre,
    fotos: data.fotos && data.fotos.length >= 5 ? data.fotos : [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600',
      'https://images.unsplash.com/photo-1606016159991-dff191060931?w=600'
    ]
  };
  vehiculos.unshift(nuevo);
  io.emit('nuevoVehiculo', nuevo);
  res.status(201).json(nuevo);
});

app.put('/api/vehiculos/:id', (req, res) => {
  const { id } = req.params;
  const index = vehiculos.findIndex(v => v.id == id);
  if (index === -1) return res.status(404).json({ error: 'Vehículo no encontrado' });
  vehiculos[index] = { ...vehiculos[index], ...req.body };
  io.emit('actualizacionVehiculo', vehiculos[index]);
  res.json(vehiculos[index]);
});

// WEBSOCKETS: MOTOR DE PUJAS EN TIEMPO REAL
io.on('connection', (socket) => {
  socket.on('realizarPuja', ({ vehiculoId, monto, usuarioId }) => {
    const v = vehiculos.find(item => item.id == vehiculoId);
    if (!v) return socket.emit('errorPuja', 'Vehículo no encontrado');

    const ahora = new Date();
    if (ahora > new Date(v.fechaCierre) || ahora < new Date(v.fechaInicio)) {
      return socket.emit('errorPuja', 'La subasta no está disponible en este momento');
    }

    const incrementoMinimo = v.ofertaActual * 1.10;
    if (monto < v.montoBase || monto < incrementoMinimo) {
      return socket.emit('errorPuja', `La puja debe superar la actual por al menos 10% (Mínimo: Q. ${incrementoMinimo.toFixed(2)})`);
    }

    const anteriorGanadorId = v.ganadorActualId;
    v.ofertaActual = parseFloat(monto);
    v.ganadorActualId = usuarioId;

    const postorAnonimo = `Postor #${String(usuarioId).slice(-4)}`;
    v.historialPujas.unshift({ postor: postorAnonimo, monto: v.ofertaActual, hora: new Date().toLocaleTimeString() });

    io.emit('pujaActualizada', {
      vehiculoId: v.id,
      nuevaOferta: v.ofertaActual,
      ganadorActualId: v.ganadorActualId,
      anteriorGanadorId,
      historial: v.historialPujas
    });
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Servidor activo en el puerto ${PORT}`));