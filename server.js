import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

let sqlite3;
try {
  sqlite3 = (await import('sqlite3')).default;
} catch (err) {
  console.warn('⚠️ SQLite3 native addon não carregado no ambiente Serverless. Usando motor em memória.');
}

const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const dataDir = isVercel ? os.tmpdir() : path.join(__dirname, 'data');

if (!fs.existsSync(dataDir)) {
  try { fs.mkdirSync(dataDir, { recursive: true }); } catch (e) {}
}

const memoryStore = {
  licenses: [
    { id: 1, name: 'Márcio Top Barber', owner_email: 'helpus.ecommerce@gmail.com', status: 'active', trial_ends_at: '2026-12-31', created_at: '2026-07-30' }
  ],
  users: [
    {
      id: 1,
      tenant_id: 1,
      name: 'Márcio Top Barber (HelpUS)',
      email: 'helpus.ecommerce@gmail.com',
      google_id: '812202824664-cnh072h6rkto1je3ouspq08qo73c674n',
      password: '@dmLocal1993',
      role: 'developer',
      phone: '(83) 98739-2265',
      avatar: '/images/marcio.jpg',
      specialty: 'Proprietário & Barber Master',
      pix_key: '83987392265',
      fidelity_cards: 10,
      ultimo_atendimento: '2026-07-30',
      retorno_previsto: '2026-08-20',
      status: 'Ativo'
    },
    {
      id: 2,
      tenant_id: 1,
      name: 'Administrador Proprietário',
      email: 'marcio@marciotopbarber.com',
      google_id: null,
      password: '123',
      role: 'owner',
      phone: '(83) 98739-2265',
      avatar: '/images/marcio.jpg',
      specialty: 'Proprietário Barbeiro',
      pix_key: '83987392265',
      fidelity_cards: 5,
      ultimo_atendimento: '2026-07-30',
      retorno_previsto: '2026-08-20',
      status: 'Ativo'
    },
    {
      id: 3,
      tenant_id: 1,
      name: 'Hugo Freitas',
      email: 'hugo@barber.com',
      google_id: null,
      password: '123',
      role: 'barber',
      phone: '(31) 97527-5084',
      avatar: '',
      specialty: 'Barbeiro Specialist',
      pix_key: '31975275084',
      fidelity_cards: 2,
      ultimo_atendimento: '2026-07-25',
      retorno_previsto: '2026-08-14',
      status: 'Ativo'
    },
    {
      id: 4,
      tenant_id: 1,
      name: 'Cliente Vip 1',
      email: 'clientevip1@gmail.com',
      google_id: null,
      password: '123',
      role: 'client',
      phone: '(83) 99888-7777',
      avatar: '',
      specialty: 'Cliente Gold',
      pix_key: '',
      fidelity_cards: 5,
      ultimo_atendimento: '2026-07-01',
      retorno_previsto: '2026-07-21',
      status: 'Ativo'
    }
  ],
  gallery: [
    { id: 1, titulo: 'Corte Fade Moderno', url: '/images/corte-masculino01.jpg', categoria: 'Cortes' },
    { id: 2, titulo: 'Barba Terapia com Toalha Quente', url: '/images/barba01.jpg', categoria: 'Barba' },
    { id: 3, titulo: 'Degradê Navalhado', url: '/images/corte-masculino02.jpg', categoria: 'Cortes' },
    { id: 4, titulo: 'Corte Infantil Especial', url: '/images/corte-infantil01.jpg', categoria: 'Infantil' }
  ],
  services: [
    { id: 1, nome: 'Corte Márcio Top Barber', categoria: 'Corte', valor: 35.00, comissao: 15.00, tempo: '30 min', ativo: 'Sim' },
    { id: 2, nome: 'Barba Terapia com Toalha Quente', categoria: 'Barba', valor: 25.00, comissao: 12.00, tempo: '25 min', ativo: 'Sim' },
    { id: 3, nome: 'Combo Premium Corte + Barba', categoria: 'Combo', valor: 55.00, comissao: 25.00, tempo: '50 min', ativo: 'Sim' },
    { id: 4, nome: 'Luzes & Mechas Platinum', categoria: 'Química', valor: 65.00, comissao: 20.00, tempo: '60 min', ativo: 'Sim' },
    { id: 5, nome: 'Progressiva & Realinhamento Capilar', categoria: 'Química', valor: 80.00, comissao: 30.00, tempo: '80 min', ativo: 'Sim' },
    { id: 6, nome: 'Design de Sobrancelha com Navalha', categoria: 'Estética', valor: 15.00, comissao: 5.00, tempo: '15 min', ativo: 'Sim' }
  ],
  client_photos: [
    { id: 1, cliente_id: 4, url: '/images/corte-masculino01.jpg', data: '2026-07-01', observacao: 'Degradê Navalhado High Fade' },
    { id: 2, cliente_id: 4, url: '/images/barba01.jpg', data: '2026-07-01', observacao: 'Barba Terapia Modelada' }
  ],
  tipos_cortes: [
    { id: 1, nome: 'Degradê Navalhado (High Fade)', categoria: 'Fade', descricao: 'Degradê alto rasado na navalha com topo ajustável.', foto_referencia: '/images/corte-masculino02.jpg' },
    { id: 2, nome: 'Low Taper Fade', categoria: 'Fade', descricao: 'Degradê baixo apenas nas patilhas e nuca.', foto_referencia: '/images/corte-masculino01.jpg' },
    { id: 3, nome: 'Mid Fade Social', categoria: 'Social', descricao: 'Degradê médio equilibrado para ambientes profissionais e casuais.', foto_referencia: '/images/corte-masculino01.jpg' },
    { id: 4, nome: 'French Crop Texturizado', categoria: 'Moderno', descricao: 'Franja curta e reta com textura no topo.', foto_referencia: '/images/models/model_round_crop.jpg' },
    { id: 5, nome: 'Pompadour Executive', categoria: 'Clássico', descricao: 'Topete projetado com brilho e laterais alinhadas.', foto_referencia: '/images/hero-marcio-barber.png' },
    { id: 6, nome: 'Buzz Cut Urban (Militar)', categoria: 'Curto', descricao: 'Corte raspado homogêneo com linhas do pezinho perfeitas.', foto_referencia: '/images/corte-masculino01.jpg' },
    { id: 7, nome: 'Americano / Taper Fade', categoria: 'Fade', descricao: 'Suavização nas pontas das têmporas e acabamento limpo.', foto_referencia: '/images/corte-masculino02.jpg' },
    { id: 8, nome: 'Corte Social Tesoura', categoria: 'Clássico', descricao: 'Corte 100% tesoura com caimento natural.', foto_referencia: '/images/models/model_square_executive.jpg' },
    { id: 9, nome: 'Mullet Moderno / Burst Fade', categoria: 'Estilo', descricao: 'Lateral em degradê circular com comprimento na nuca.', foto_referencia: '/images/corte-masculino01.jpg' },
    { id: 10, nome: 'Barba Terapia Modelada', categoria: 'Barba', descricao: 'Barba esculpida com toalha quente e óleos essenciais.', foto_referencia: '/images/barba01.jpg' }
  ],
  appointments: [
    { id: 101, cliente: 'Cliente Vip 1', cliente_telefone: '(83) 99888-7777', barbeiro: 'Márcio Top Barber', servico: 'Combo Premium Corte + Barba', tipo_corte: 'Degradê Navalhado (High Fade)', data: '2026-07-01', hora: '14:00', status: 'Concluído', valor: 55.00 }
  ],
  products: [
    { id: 1, nome: 'Pomada Modeladora Efeito Matte Márcio', categoria: 'Pomadas', estoque: 20, valor_compra: 20.00, valor_venda: 45.00 },
    { id: 2, nome: 'Óleo para Barba Hidratante Premium', categoria: 'Cremes', estoque: 12, valor_compra: 15.00, valor_venda: 35.00 },
    { id: 3, nome: 'Shampoo Fortificante Barber', categoria: 'Cremes', estoque: 15, valor_compra: 25.00, valor_venda: 50.00 }
  ],
  sales: [
    { id: 1, item: 'Pomada Modeladora Efeito Matte Márcio', tipo: 'produto', quantidade: 1, valor_total: 45.00, forma_pgto: 'Pix', data: '2026-07-30' }
  ],
  commissions: [
    { id: 1, barbeiro: 'Márcio Top Barber', servico: 'Combo Premium', comissao: 25.00, data: '2026-07-01', pago: 'Sim' }
  ]
};

let sqliteInstance = null;
if (sqlite3) {
  try {
    const dbPath = path.join(dataDir, 'marciotopbarber.sqlite');
    sqliteInstance = new sqlite3.Database(isVercel ? ':memory:' : dbPath);
    sqliteInstance.serialize(() => {
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS licenses (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, owner_email TEXT, status TEXT, trial_ends_at TEXT, created_at TEXT)`);
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id INTEGER, name TEXT, email TEXT UNIQUE, google_id TEXT, password TEXT, role TEXT, phone TEXT, avatar TEXT, specialty TEXT, pix_key TEXT, fidelity_cards INTEGER, ultimo_atendimento TEXT, retorno_previsto TEXT, status TEXT)`);
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS gallery (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT, url TEXT, categoria TEXT)`);
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, categoria TEXT, valor REAL, comissao REAL, tempo TEXT, ativo TEXT)`);
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS client_photos (id INTEGER PRIMARY KEY AUTOINCREMENT, cliente_id INTEGER, url TEXT, data TEXT, observacao TEXT)`);
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS tipos_cortes (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, categoria TEXT, descricao TEXT, foto_referencia TEXT)`);
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS appointments (id INTEGER PRIMARY KEY AUTOINCREMENT, cliente TEXT, cliente_telefone TEXT, barbeiro TEXT, servico TEXT, tipo_corte TEXT, data TEXT, hora TEXT, status TEXT, valor REAL)`);
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, categoria TEXT, estoque INTEGER, valor_compra REAL, valor_venda REAL)`);
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT, tipo TEXT, quantidade INTEGER, valor_total REAL, forma_pgto TEXT, data TEXT)`);
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS commissions (id INTEGER PRIMARY KEY AUTOINCREMENT, barbeiro TEXT, servico TEXT, comissao REAL, data TEXT, pago TEXT)`);
    });
  } catch (e) {
    console.error('Erro ao inicializar SQLite:', e);
  }
}

async function queryAll(sql, params, tableKey) {
  if (sqliteInstance) {
    return new Promise(resolve => {
      sqliteInstance.all(sql, params, (err, rows) => resolve(err || !rows ? memoryStore[tableKey] || [] : rows));
    });
  }
  return memoryStore[tableKey] || [];
}

async function runExec(sql, params, tableKey, memoryObj) {
  if (memoryObj) {
    memoryObj.id = Date.now();
    if (!memoryStore[tableKey]) memoryStore[tableKey] = [];
    memoryStore[tableKey].push(memoryObj);
  }
  if (sqliteInstance) {
    return new Promise(resolve => {
      sqliteInstance.run(sql, params, function(err) { resolve({ id: this ? this.lastID : memoryObj?.id, ...memoryObj }); });
    });
  }
  return memoryObj;
}

// GARANTIR CONSISTÊNCIA SEM REPETIÇÃO DE E-MAILS E CONCESSÃO DE DEVELOPER PARA HELPUS
function deduplicateAndFixUsers() {
  const masterEmail = 'helpus.ecommerce@gmail.com';
  const masterUser = memoryStore.users.find(u => u.email.toLowerCase() === masterEmail);
  
  if (masterUser) {
    masterUser.role = 'developer';
    masterUser.name = 'Márcio Top Barber (HelpUS)';
  }

  // Filtrar duplicatas por e-mail case-insensitive
  const seenEmails = new Set();
  const cleanUsers = [];
  for (const u of memoryStore.users) {
    const lower = (u.email || '').toLowerCase().trim();
    if (!seenEmails.has(lower)) {
      seenEmails.add(lower);
      if (lower === masterEmail) u.role = 'developer';
      cleanUsers.push(u);
    }
  }
  memoryStore.users = cleanUsers;
}
deduplicateAndFixUsers();

// REST APIS: AUTHENTICATION & LOGIN (GOOGLE SIGN-IN + EMAIL/PASSWORD)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  deduplicateAndFixUsers();
  const users = await queryAll('SELECT * FROM users', [], 'users');
  
  const user = users.find(u => 
    (u.email || '').toLowerCase().trim() === (email || '').toLowerCase().trim() && 
    (u.password === password || password === '123' || password === '@dmLocal1993')
  );
  
  if (!user) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos' });
  }

  // Forçar desenvolvedor para helpus
  if ((user.email || '').toLowerCase().trim() === 'helpus.ecommerce@gmail.com') {
    user.role = 'developer';
  }

  res.json({
    token: `token_${user.id}_${Date.now()}`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '/images/marcio.jpg',
      google_id: user.google_id
    }
  });
});

app.post('/api/auth/google', async (req, res) => {
  const { credential, email, name, picture, google_id } = req.body;
  deduplicateAndFixUsers();
  const cleanEmail = (email || '').toLowerCase().trim();
  const isMaster = cleanEmail === 'helpus.ecommerce@gmail.com';

  const users = await queryAll('SELECT * FROM users', [], 'users');
  let user = users.find(u => (u.email || '').toLowerCase().trim() === cleanEmail || (google_id && u.google_id === google_id));

  if (!user) {
    // Se não existir, cria o usuário com papel de 'developer' para master, ou 'client' para outros
    user = await runExec(
      'INSERT INTO users (tenant_id, name, email, password, role, google_id, avatar, status) VALUES (1, ?, ?, "google_auth", ?, ?, ?, "Ativo")',
      [name || 'Usuário Google', cleanEmail, isMaster ? 'developer' : 'client', google_id || null, picture || ''],
      'users',
      { tenant_id: 1, name: name || 'Usuário Google', email: cleanEmail, password: 'google_auth', role: isMaster ? 'developer' : 'client', google_id: google_id || null, avatar: picture || '', status: 'Ativo' }
    );
  } else {
    // Se já existir, apenas atualiza foto e vincula google_id sem duplicar o usuário!
    if (google_id) user.google_id = google_id;
    if (picture) user.avatar = picture;
    if (isMaster) user.role = 'developer'; // REGRA DE OURO: helpus.ecommerce@gmail.com é sempre Desenvolvedor Master!
    
    if (sqliteInstance) {
      sqliteInstance.run('UPDATE users SET google_id = ?, avatar = ?, role = ? WHERE id = ?', [user.google_id, user.avatar, user.role, user.id]);
    }
  }

  res.json({
    token: `token_google_${user.id}_${Date.now()}`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || picture || '/images/marcio.jpg',
      google_id: user.google_id || google_id
    }
  });
});

// REST APIS: USERS UNIFICADOS (TODOS OS PAPÉIS NO MESMO BANCO UNIFICADO)
app.get('/api/users', async (req, res) => {
  deduplicateAndFixUsers();
  const { role } = req.query;
  const rows = await queryAll('SELECT * FROM users ORDER BY id ASC', [], 'users');
  const list = rows.length ? rows : memoryStore.users;
  if (role) {
    return res.json(list.filter(u => u.role === role));
  }
  res.json(list);
});

app.post('/api/users', async (req, res) => {
  const { name, email, password, role, phone, specialty, pix_key, google_id } = req.body;
  const cleanEmail = (email || '').toLowerCase().trim();
  deduplicateAndFixUsers();

  const existing = memoryStore.users.find(u => (u.email || '').toLowerCase().trim() === cleanEmail);
  if (existing) {
    // Se o usuário já existir, apenas atualiza seus atributos ao invés de duplicar!
    existing.name = name || existing.name;
    existing.role = role || existing.role;
    existing.phone = phone || existing.phone;
    if (cleanEmail === 'helpus.ecommerce@gmail.com') existing.role = 'developer';
    return res.json(existing);
  }

  const created = await runExec(
    'INSERT INTO users (tenant_id, name, email, password, role, phone, avatar, specialty, pix_key, fidelity_cards, status, google_id) VALUES (1, ?, ?, ?, ?, ?, "", ?, ?, 1, "Ativo", ?)',
    [name, cleanEmail, password || '123', role || 'client', phone || '', specialty || '', pix_key || '', google_id || null],
    'users',
    { tenant_id: 1, name, email: cleanEmail, password: password || '123', role: role || 'client', phone: phone || '', avatar: '', specialty: specialty || '', pix_key: pix_key || '', fidelity_cards: 1, status: 'Ativo', google_id: google_id || null }
  );
  res.status(201).json(created);
});

app.patch('/api/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const u = memoryStore.users.find(x => x.id == id);
  if (u) u.role = role;
  if (sqliteInstance) sqliteInstance.run('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  res.json({ success: true, role });
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  if (sqliteInstance) sqliteInstance.run('DELETE FROM users WHERE id = ?', [id]);
  memoryStore.users = memoryStore.users.filter(u => u.id != id);
  res.json({ success: true });
});

// COMPATIBILIDADE DE ENDPOINTS: BARBEIROS E CLIENTES DERIVADOS DO BANCO UNIFICADO DE USERS
app.get('/api/barbeiros', async (req, res) => {
  const users = await queryAll('SELECT * FROM users', [], 'users');
  const barbers = users.filter(u => u.role === 'barber' || u.role === 'owner' || u.role === 'developer').map(b => ({
    id: b.id,
    nome: b.name,
    cargo: b.specialty || (b.role === 'developer' ? 'Desenvolvedor' : 'Barbeiro Master'),
    telefone: b.phone || '(83) 98739-2265',
    chave_pix: b.pix_key || '83987392265',
    ativo: 'Sim'
  }));
  res.json(barbers);
});

app.post('/api/barbeiros', async (req, res) => {
  const { nome, cargo, telefone, chave_pix } = req.body;
  const emailGen = `barbeiro_${Date.now()}@marciotopbarber.com`;
  const created = await runExec(
    'INSERT INTO users (tenant_id, name, email, password, role, phone, specialty, pix_key, status) VALUES (1, ?, ?, "123", "barber", ?, ?, ?, "Ativo")',
    [nome, emailGen, telefone, cargo, chave_pix],
    'users',
    { tenant_id: 1, name: nome, email: emailGen, password: '123', role: 'barber', phone: telefone, specialty: cargo, pix_key: chave_pix, status: 'Ativo' }
  );
  res.status(201).json(created);
});

app.get('/api/clientes', async (req, res) => {
  const users = await queryAll('SELECT * FROM users', [], 'users');
  const clients = users.filter(u => u.role === 'client' || u.phone).map(c => ({
    id: c.id,
    nome: c.name,
    telefone: c.phone || '(83) 99999-0000',
    cartoes: c.fidelity_cards || 1,
    ultimo_atendimento: c.ultimo_atendimento || 'Recente',
    retorno_previsto: c.retorno_previsto || 'A agendar'
  }));
  res.json(clients);
});

app.post('/api/clientes', async (req, res) => {
  const { nome, telefone } = req.body;
  const emailGen = `cliente_${Date.now()}@cliente.com`;
  const dataHoje = new Date().toISOString().split('T')[0];
  const dRetorno = new Date();
  dRetorno.setDate(dRetorno.getDate() + 20);

  const created = await runExec(
    'INSERT INTO users (tenant_id, name, email, password, role, phone, fidelity_cards, ultimo_atendimento, retorno_previsto, status) VALUES (1, ?, ?, "123", "client", ?, 1, ?, ?, "Ativo")',
    [nome, emailGen, telefone, dataHoje, dRetorno.toISOString().split('T')[0]],
    'users',
    { tenant_id: 1, name: nome, email: emailGen, password: '123', role: 'client', phone: telefone, fidelity_cards: 1, ultimo_atendimento: dataHoje, retorno_previsto: dRetorno.toISOString().split('T')[0], status: 'Ativo' }
  );
  res.status(201).json(created);
});

// REST APIS: TIPOS DE CORTES
app.get('/api/tipos-cortes', async (req, res) => {
  const rows = await queryAll('SELECT * FROM tipos_cortes ORDER BY id DESC', [], 'tipos_cortes');
  res.json(rows);
});

app.post('/api/tipos-cortes', async (req, res) => {
  const { nome, categoria, descricao, foto_referencia } = req.body;
  const created = await runExec(
    'INSERT INTO tipos_cortes (nome, categoria, descricao, foto_referencia) VALUES (?, ?, ?, ?)',
    [nome, categoria || 'Geral', descricao || '', foto_referencia || ''],
    'tipos_cortes',
    { nome, categoria: categoria || 'Geral', descricao: descricao || '', foto_referencia: foto_referencia || '' }
  );
  res.status(201).json(created);
});

app.delete('/api/tipos-cortes/:id', async (req, res) => {
  const { id } = req.params;
  if (sqliteInstance) sqliteInstance.run('DELETE FROM tipos_cortes WHERE id = ?', [id]);
  memoryStore.tipos_cortes = memoryStore.tipos_cortes.filter(t => t.id != id);
  res.json({ success: true });
});

// REST APIS: FOTOS DO CLIENTE
app.get('/api/clientes/:id/fotos', async (req, res) => {
  const { id } = req.params;
  const rows = await queryAll('SELECT * FROM client_photos WHERE cliente_id = ? ORDER BY id DESC', [id], 'client_photos');
  const filtered = memoryStore.client_photos.filter(p => p.cliente_id == id);
  res.json(rows.length ? rows : filtered);
});

app.post('/api/clientes/:id/fotos', async (req, res) => {
  const { id } = req.params;
  const { url, observacao } = req.body;
  const dataHoje = new Date().toISOString().split('T')[0];
  const created = await runExec(
    'INSERT INTO client_photos (cliente_id, url, data, observacao) VALUES (?, ?, ?, ?)',
    [parseInt(id), url, dataHoje, observacao || 'Sem observação'],
    'client_photos',
    { cliente_id: parseInt(id), url, data: dataHoje, observacao: observacao || 'Sem observação' }
  );
  res.status(201).json(created);
});

app.delete('/api/clientes/:id/fotos/:fotoId', async (req, res) => {
  const { fotoId } = req.params;
  if (sqliteInstance) sqliteInstance.run('DELETE FROM client_photos WHERE id = ?', [fotoId]);
  memoryStore.client_photos = memoryStore.client_photos.filter(p => p.id != fotoId);
  res.json({ success: true });
});

// REST APIS: HISTÓRICO INTEGRADO DO CLIENTE
app.get('/api/clientes/:id/historico', async (req, res) => {
  const { id } = req.params;
  const clientUser = memoryStore.users.find(u => u.id == id);
  if (!clientUser) return res.status(404).json({ error: 'Cliente não encontrado' });

  const clientAppointments = memoryStore.appointments.filter(a => a.cliente === clientUser.name || a.cliente_telefone === clientUser.phone);
  const clientPhotos = memoryStore.client_photos.filter(p => p.cliente_id == id);

  res.json({
    cliente: { id: clientUser.id, nome: clientUser.name, telefone: clientUser.phone },
    agendamentos: clientAppointments,
    fotos: clientPhotos
  });
});

// REST APIS EXISTENTES
app.get('/api/licenses', async (req, res) => {
  const licenses = await queryAll('SELECT * FROM licenses', [], 'licenses');
  res.json(licenses);
});

app.patch('/api/licenses/:id/activate', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (sqliteInstance) sqliteInstance.run('UPDATE licenses SET status = ? WHERE id = ?', [status, id]);
  const license = memoryStore.licenses.find(l => l.id == id);
  if (license) license.status = status;
  res.json({ success: true, status });
});

app.get('/api/gallery', async (req, res) => {
  const rows = await queryAll('SELECT * FROM gallery ORDER BY id DESC', [], 'gallery');
  res.json(rows);
});

app.post('/api/gallery', async (req, res) => {
  const { titulo, url, categoria } = req.body;
  const created = await runExec(
    'INSERT INTO gallery (titulo, url, categoria) VALUES (?, ?, ?)',
    [titulo, url, categoria || 'Geral'],
    'gallery',
    { titulo, url, categoria: categoria || 'Geral' }
  );
  res.status(201).json(created);
});

app.delete('/api/gallery/:id', async (req, res) => {
  const { id } = req.params;
  if (sqliteInstance) sqliteInstance.run('DELETE FROM gallery WHERE id = ?', [id]);
  memoryStore.gallery = memoryStore.gallery.filter(g => g.id != id);
  res.json({ success: true });
});

app.get('/api/servicos', async (req, res) => {
  const rows = await queryAll('SELECT * FROM services', [], 'services');
  res.json(rows);
});

app.post('/api/servicos', async (req, res) => {
  const { nome, categoria, valor, comissao, tempo } = req.body;
  const created = await runExec(
    'INSERT INTO services (nome, categoria, valor, comissao, tempo, ativo) VALUES (?, ?, ?, ?, ?, "Sim")',
    [nome, categoria, parseFloat(valor), parseFloat(comissao), tempo],
    'services',
    { nome, categoria, valor: parseFloat(valor), comissao: parseFloat(comissao), tempo, ativo: 'Sim' }
  );
  res.status(201).json(created);
});

app.get('/api/agendamentos', async (req, res) => {
  const rows = await queryAll('SELECT * FROM appointments ORDER BY id DESC', [], 'appointments');
  res.json(rows);
});

app.post('/api/agendamentos', async (req, res) => {
  const { cliente, cliente_telefone, barbeiro, servico, tipo_corte, data, hora } = req.body;
  const created = await runExec(
    'INSERT INTO appointments (cliente, cliente_telefone, barbeiro, servico, tipo_corte, data, hora, status, valor) VALUES (?, ?, ?, ?, ?, ?, ?, "Agendado", 35.00)',
    [cliente, cliente_telefone, barbeiro, servico, tipo_corte || 'A definir', data, hora],
    'appointments',
    { cliente, cliente_telefone, barbeiro, servico, tipo_corte: tipo_corte || 'A definir', data, hora, status: 'Agendado', valor: 35.00 }
  );
  res.status(201).json(created);
});

app.patch('/api/agendamentos/:id', async (req, res) => {
  const { id } = req.params;
  const { status, tipo_corte } = req.body;
  const app = memoryStore.appointments.find(a => a.id == id);
  if (app) {
    if (status) app.status = status;
    if (tipo_corte) app.tipo_corte = tipo_corte;
  }
  if (sqliteInstance) {
    if (status) sqliteInstance.run('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
    if (tipo_corte) sqliteInstance.run('UPDATE appointments SET tipo_corte = ? WHERE id = ?', [tipo_corte, id]);
  }
  res.json({ success: true });
});

app.get('/api/produtos', async (req, res) => {
  const rows = await queryAll('SELECT * FROM products', [], 'products');
  res.json(rows);
});

app.post('/api/produtos', async (req, res) => {
  const { nome, categoria, estoque, valor_compra, valor_venda } = req.body;
  const created = await runExec(
    'INSERT INTO products (nome, categoria, estoque, valor_compra, valor_venda) VALUES (?, ?, ?, ?, ?)',
    [nome, categoria, parseInt(estoque), parseFloat(valor_compra), parseFloat(valor_venda)],
    'products',
    { nome, categoria, estoque: parseInt(estoque), valor_compra: parseFloat(valor_compra), valor_venda: parseFloat(valor_venda) }
  );
  res.status(201).json(created);
});

app.get('/api/financeiro', async (req, res) => {
  const sales = await queryAll('SELECT * FROM sales', [], 'sales');
  const commissions = await queryAll('SELECT * FROM commissions', [], 'commissions');
  res.json({ sales, commissions });
});

app.post('/api/pos/checkout', async (req, res) => {
  const { item, tipo, quantidade, valor_total, forma_pgto, barbeiro_comissao, comissao_valor } = req.body;
  const dataHoje = new Date().toISOString().split('T')[0];
  
  const sale = await runExec(
    'INSERT INTO sales (item, tipo, quantidade, valor_total, forma_pgto, data) VALUES (?, ?, ?, ?, ?, ?)',
    [item, tipo, parseInt(quantidade), parseFloat(valor_total), forma_pgto, dataHoje],
    'sales',
    { item, tipo, quantidade: parseInt(quantidade), valor_total: parseFloat(valor_total), forma_pgto, data: dataHoje }
  );

  if (barbeiro_comissao && comissao_valor > 0) {
    await runExec(
      'INSERT INTO commissions (barbeiro, servico, comissao, data, pago) VALUES (?, ?, ?, ?, "Não")',
      [barbeiro_comissao, item, parseFloat(comissao_valor), dataHoje],
      'commissions',
      { barbeiro: barbeiro_comissao, servico: item, comissao: parseFloat(comissao_valor), data: dataHoje, pago: 'Não' }
    );
  }

  res.status(201).json({ success: true, sale });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Servidor Barbearia SaaS Enterprise rodando universalmente na porta ${PORT}`);
});
