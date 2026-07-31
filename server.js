import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sqliteInstance, memoryStore } from './data/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'marciotopbarber-saas-enterprise', mode: sqliteInstance ? 'sqlite' : 'serverless-memory' });
});

const queryAll = (sql, params, memoryKey) => {
  return new Promise((resolve) => {
    if (sqliteInstance) {
      sqliteInstance.all(sql, params, (err, rows) => {
        if (err || !rows) resolve(memoryStore[memoryKey] || []);
        else resolve(rows);
      });
    } else {
      resolve(memoryStore[memoryKey] || []);
    }
  });
};

const runExec = (sql, params, memoryKey, newObj) => {
  return new Promise((resolve) => {
    if (sqliteInstance) {
      sqliteInstance.run(sql, params, function (err) {
        if (err) resolve({ id: Date.now(), ...newObj });
        else resolve({ id: this.lastID || Date.now(), ...newObj });
      });
    } else {
      const list = memoryStore[memoryKey] || [];
      const item = { id: Date.now(), ...newObj };
      list.push(item);
      resolve(item);
    }
  });
};

// ----------------------------------------------------
// ROTAS DE AUTENTICAÇÃO E GOOGLE OAUTH
// ----------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (email === 'helpus.ecommerce@gmail.com' && (password === '@dmLocal1993' || password === '123')) {
    return res.json({ success: true, user: { id: 1, name: 'Márcio Top Barber (Super Admin)', email, role: 'developer', tenant_id: 1 } });
  }
  if ((email === 'admin@admin' || email === 'admin@admin.com') && (password === '123' || password === '@dmLocal1993')) {
    return res.json({ success: true, user: { id: 2, name: 'Administrador Local', email, role: 'owner', tenant_id: 1 } });
  }
  const users = await queryAll('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], 'users');
  if (users.length > 0) res.json({ success: true, user: users[0] });
  else res.status(401).json({ success: false, message: 'Credenciais inválidas' });
});

app.post('/api/auth/google', async (req, res) => {
  const { credential, email, name, picture } = req.body;
  const targetEmail = email || 'helpus.ecommerce@gmail.com';
  const role = (targetEmail === 'helpus.ecommerce@gmail.com') ? 'developer' : 'owner';
  res.json({ success: true, user: { id: Date.now(), name: name || 'Usuário Google', email: targetEmail, role, tenant_id: 1, avatar: picture || '/images/marcio.jpg' } });
});

// ----------------------------------------------------
// ROTAS DE LICENCIAMENTO & GALERIA DE MÍDIA
// ----------------------------------------------------
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

// API GALERIA DO SITE
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

// ----------------------------------------------------
// REST APIS (SERVIÇOS, BARBEIROS, CLIENTES & HISTÓRICO CRM)
// ----------------------------------------------------
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
  const retornoPrevisto = new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0];
  const created = await runExec(
    'INSERT INTO clients (nome, telefone, cartoes, ultimo_atendimento, retorno_previsto) VALUES (?, ?, 1, ?, ?)',
    [nome, telefone, dataHoje, retornoPrevisto],
    'clients',
    { nome, telefone, cartoes: 1, ultimo_atendimento: dataHoje, retorno_previsto: retornoPrevisto }
  );
  res.status(201).json(created);
});

// HISTÓRICO DE VISITAS DO CLIENTE
app.get('/api/clientes/:nome/historico', async (req, res) => {
  const { nome } = req.params;
  const appts = await queryAll('SELECT * FROM appointments WHERE cliente = ? ORDER BY id DESC', [nome], 'appointments');
  res.json(appts);
});

app.get('/api/agendamentos', async (req, res) => {
  const rows = await queryAll('SELECT * FROM appointments ORDER BY id DESC', [], 'appointments');
  res.json(rows);
});

app.post('/api/agendamentos', async (req, res) => {
  const { cliente, cliente_telefone, barbeiro, servico, data, hora } = req.body;
  const srvs = await queryAll('SELECT valor FROM services WHERE nome = ?', [servico], 'services');
  const valor = srvs.length > 0 ? (srvs[0].valor || 35.0) : 35.0;

  const created = await runExec(
    'INSERT INTO appointments (cliente, cliente_telefone, barbeiro, servico, data, hora, status, valor) VALUES (?, ?, ?, ?, ?, ?, "Agendado", ?)',
    [cliente, cliente_telefone, barbeiro, servico, data, hora, valor],
    'appointments',
    { cliente, cliente_telefone, barbeiro, servico, data, hora, status: 'Agendado', valor }
  );
  res.status(201).json(created);
});

app.patch('/api/agendamentos/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (sqliteInstance) {
    sqliteInstance.run('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
  }
  const appt = memoryStore.appointments.find(a => a.id == id);
  if (appt) appt.status = status;

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

app.post('/api/pos/checkout', async (req, res) => {
  const { item, product_id, quantidade, valor_total, forma_pgto } = req.body;
  const dataAtual = new Date().toISOString().split('T')[0];
  const sale = await runExec(
    'INSERT INTO sales (item, tipo, quantidade, valor_total, forma_pgto, data) VALUES (?, "produto", ?, ?, ?, ?)',
    [item, parseInt(quantidade), parseFloat(valor_total), forma_pgto, dataAtual],
    'sales',
    { item, tipo: 'produto', quantidade: parseInt(quantidade), valor_total: parseFloat(valor_total), forma_pgto, data: dataAtual }
  );
  res.json({ success: true, sale });
});

app.get('/api/vendas', async (req, res) => {
  const rows = await queryAll('SELECT * FROM sales ORDER BY id DESC', [], 'sales');
  res.json(rows);
});

app.get('/api/comissoes', async (req, res) => {
  const rows = await queryAll('SELECT * FROM commissions ORDER BY id DESC', [], 'commissions');
  res.json(rows);
});

app.get('/sistema*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sistema', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Servidor Barbearia SaaS Enterprise rodando universalmente na porta ${PORT}`);
});
