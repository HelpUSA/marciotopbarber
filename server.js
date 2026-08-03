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
    { id: 1, name: 'Márcio Top Barber (HelpUS)', email: 'helpus.ecommerce@gmail.com', google_id: '812202824664', password: '@dmLocal1993', role: 'developer', tenant_id: 1, avatar: '/images/marcio.jpg' },
    { id: 2, name: 'Administrador Proprietário', email: 'marcio@marciotopbarber.com', google_id: null, password: '123', role: 'owner', tenant_id: 1, avatar: '' },
    { id: 3, name: 'Hugo Freitas', email: 'hugo@barber.com', google_id: null, password: '123', role: 'barber', tenant_id: 1, avatar: '' },
    { id: 4, name: 'Cliente Vip Exemplo', email: 'cliente@vip.com', google_id: null, password: '123', role: 'client', tenant_id: 1, avatar: '' }
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
  barbers: [
    { id: 1, nome: 'Márcio Top Barber', cargo: 'Proprietário & Barber Master', telefone: '(83) 98739-2265', chave_pix: '83987392265', ativo: 'Sim' },
    { id: 2, nome: 'Hugo Freitas', cargo: 'Barbeiro Specialist', telefone: '(31) 97527-5084', chave_pix: '31975275084', ativo: 'Sim' },
    { id: 3, nome: 'Marcos Silva', cargo: 'Barbeiro Visagista', telefone: '(31) 98888-1111', chave_pix: '31988881111', ativo: 'Sim' }
  ],
  clients: [
    { id: 1, nome: 'Cliente Vip 1', telefone: '(83) 99888-7777', cartoes: 5, ultimo_atendimento: '2026-07-01', retorno_previsto: '2026-07-21' },
    { id: 2, nome: 'Cliente Vip 2', telefone: '(83) 98777-6666', cartoes: 8, ultimo_atendimento: '2026-07-10', retorno_previsto: '2026-07-30' },
    { id: 3, nome: 'Hugo Freitas', telefone: '(31) 97527-5084', cartoes: 2, ultimo_atendimento: '2026-07-25', retorno_previsto: '2026-08-14' }
  ],
  client_photos: [
    { id: 1, cliente_id: 1, url: '/images/corte-masculino01.jpg', data: '2026-07-01', observacao: 'Degradê Navalhado High Fade' },
    { id: 2, cliente_id: 1, url: '/images/barba01.jpg', data: '2026-07-01', observacao: 'Barba Terapia Modelada' },
    { id: 3, cliente_id: 2, url: '/images/corte-masculino02.jpg', data: '2026-07-10', observacao: 'Low Taper Fade' }
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
    { id: 101, cliente: 'Cliente Vip 1', cliente_telefone: '(83) 99888-7777', barbeiro: 'Márcio Top Barber', servico: 'Combo Premium Corte + Barba', tipo_corte: 'Degradê Navalhado (High Fade)', data: '2026-07-01', hora: '14:00', status: 'Concluído', valor: 55.00 },
    { id: 102, cliente: 'Cliente Vip 2', cliente_telefone: '(83) 98777-6666', barbeiro: 'Márcio Top Barber', servico: 'Corte Márcio Top Barber', tipo_corte: 'Low Taper Fade', data: '2026-07-10', hora: '15:30', status: 'Concluído', valor: 35.00 }
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
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, google_id TEXT, password TEXT, role TEXT, tenant_id INTEGER, avatar TEXT)`);
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS gallery (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT, url TEXT, categoria TEXT)`);
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, categoria TEXT, valor REAL, comissao REAL, tempo TEXT, ativo TEXT)`);
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS barbers (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, cargo TEXT, telefone TEXT, chave_pix TEXT, ativo TEXT)`);
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, telefone TEXT, cartoes INTEGER, ultimo_atendimento TEXT, retorno_previsto TEXT)`);
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

// REST APIS: USERS & ROLES (DEVELOPER, OWNER, BARBER, CLIENT)
app.get('/api/users', async (req, res) => {
  const rows = await queryAll('SELECT id, name, email, google_id, role, tenant_id, avatar FROM users ORDER BY id ASC', [], 'users');
  res.json(rows);
});

app.post('/api/users', async (req, res) => {
  const { name, email, password, role, google_id } = req.body;
  const created = await runExec(
    'INSERT INTO users (name, email, password, role, google_id, tenant_id, avatar) VALUES (?, ?, ?, ?, ?, 1, "")',
    [name, email, password || '123', role || 'client', google_id || null],
    'users',
    { name, email, password: password || '123', role: role || 'client', google_id: google_id || null, tenant_id: 1, avatar: '' }
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

// REST APIS: TIPOS DE CORTES (CATÁLOGO DE CORTES DA INTERNET)
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

// REST APIS: HISTÓRICO INTEGRADO DO CLIENTE (AGENDAMENTOS + CORTES + FOTOS)
app.get('/api/clientes/:id/historico', async (req, res) => {
  const { id } = req.params;
  const client = memoryStore.clients.find(c => c.id == id);
  if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

  const clientAppointments = memoryStore.appointments.filter(a => a.cliente === client.nome || a.cliente_telefone === client.telefone);
  const clientPhotos = memoryStore.client_photos.filter(p => p.cliente_id == id);

  res.json({
    cliente: client,
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

app.get('/api/barbeiros', async (req, res) => {
  const rows = await queryAll('SELECT * FROM barbers', [], 'barbers');
  res.json(rows);
});

app.post('/api/barbeiros', async (req, res) => {
  const { nome, cargo, telefone, chave_pix } = req.body;
  const created = await runExec(
    'INSERT INTO barbers (nome, cargo, telefone, chave_pix, ativo) VALUES (?, ?, ?, ?, "Sim")',
    [nome, cargo, telefone, chave_pix],
    'barbers',
    { nome, cargo, telefone, chave_pix, ativo: 'Sim' }
  );
  res.status(201).json(created);
});

app.get('/api/clientes', async (req, res) => {
  const rows = await queryAll('SELECT * FROM clients', [], 'clients');
  res.json(rows);
});

app.post('/api/clientes', async (req, res) => {
  const { nome, telefone } = req.body;
  const dataHoje = new Date().toISOString().split('T')[0];
  const dRetorno = new Date();
  dRetorno.setDate(dRetorno.getDate() + 20);

  const created = await runExec(
    'INSERT INTO clients (nome, telefone, cartoes, ultimo_atendimento, retorno_previsto) VALUES (?, ?, 1, ?, ?)',
    [nome, telefone, dataHoje, dRetorno.toISOString().split('T')[0]],
    'clients',
    { nome, telefone, cartoes: 1, ultimo_atendimento: dataHoje, retorno_previsto: dRetorno.toISOString().split('T')[0] }
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
