import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { sqliteInstance, memoryStore } from './data/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/barbearia', express.static(path.join(__dirname, 'barbearia')));

// --- REST API UNIVERSAL (SQLITE + SERVERLESS FALLBACK) ---

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'barbearia-saas', mode: sqliteInstance ? 'sqlite-native' : 'serverless-memory' });
});

// 1. SERVIÇOS
app.get('/api/servicos', (req, res) => {
  if (sqliteInstance) {
    sqliteInstance.all('SELECT * FROM services WHERE ativo = "Sim" ORDER BY id ASC', [], (err, rows) => {
      if (err) return res.json(memoryStore.services);
      res.json(rows);
    });
  } else {
    res.json(memoryStore.services);
  }
});

app.post('/api/servicos', (req, res) => {
  const { nome, categoria, valor, comissao, tempo } = req.body;
  const newSrv = {
    id: Date.now(),
    nome,
    categoria,
    valor: parseFloat(valor),
    comissao: parseFloat(comissao),
    tempo: tempo || '30 min',
    ativo: 'Sim'
  };

  if (sqliteInstance) {
    sqliteInstance.run(
      'INSERT INTO services (nome, categoria, valor, comissao, tempo, ativo) VALUES (?, ?, ?, ?, ?, "Sim")',
      [nome, categoria, parseFloat(valor), parseFloat(comissao), tempo || '30 min'],
      function (err) {
        if (!err) newSrv.id = this.lastID;
        memoryStore.services.push(newSrv);
        res.status(201).json(newSrv);
      }
    );
  } else {
    memoryStore.services.push(newSrv);
    res.status(201).json(newSrv);
  }
});

// 2. BARBEIROS / FUNCIONÁRIOS
app.get('/api/barbeiros', (req, res) => {
  if (sqliteInstance) {
    sqliteInstance.all('SELECT * FROM barbers WHERE ativo = "Sim" ORDER BY id ASC', [], (err, rows) => {
      if (err) return res.json(memoryStore.barbers);
      res.json(rows);
    });
  } else {
    res.json(memoryStore.barbers);
  }
});

app.post('/api/barbeiros', (req, res) => {
  const { nome, cargo, telefone, chave_pix } = req.body;
  const newBarber = { id: Date.now(), nome, cargo, telefone, chave_pix, ativo: 'Sim' };

  if (sqliteInstance) {
    sqliteInstance.run(
      'INSERT INTO barbers (nome, cargo, telefone, chave_pix, ativo) VALUES (?, ?, ?, ?, "Sim")',
      [nome, cargo, telefone, chave_pix],
      function (err) {
        if (!err) newBarber.id = this.lastID;
        memoryStore.barbers.push(newBarber);
        res.status(201).json(newBarber);
      }
    );
  } else {
    memoryStore.barbers.push(newBarber);
    res.status(201).json(newBarber);
  }
});

// 3. CLIENTES & CRM
app.get('/api/clientes', (req, res) => {
  if (sqliteInstance) {
    sqliteInstance.all('SELECT * FROM clients ORDER BY id DESC', [], (err, rows) => {
      if (err) return res.json(memoryStore.clients);
      res.json(rows);
    });
  } else {
    res.json(memoryStore.clients);
  }
});

app.post('/api/clientes', (req, res) => {
  const { nome, telefone, retorno } = req.body;
  const newClient = { id: Date.now(), nome, telefone, cartoes: 1, retorno: retorno || '2026-08-30' };

  if (sqliteInstance) {
    sqliteInstance.run(
      'INSERT INTO clients (nome, telefone, cartoes, retorno) VALUES (?, ?, 1, ?)',
      [nome, telefone, retorno || '2026-08-30'],
      function (err) {
        if (!err) newClient.id = this.lastID;
        memoryStore.clients.unshift(newClient);
        res.status(201).json(newClient);
      }
    );
  } else {
    memoryStore.clients.unshift(newClient);
    res.status(201).json(newClient);
  }
});

// 4. AGENDAMENTOS COMPLETO
app.get('/api/agendamentos', (req, res) => {
  if (sqliteInstance) {
    sqliteInstance.all('SELECT * FROM appointments ORDER BY id DESC', [], (err, rows) => {
      if (err) return res.json(memoryStore.appointments);
      res.json(rows);
    });
  } else {
    res.json(memoryStore.appointments);
  }
});

app.post('/api/agendamentos', (req, res) => {
  const { cliente, cliente_telefone, barbeiro, servico, data, hora, valor } = req.body;
  const newAppt = {
    id: Date.now(),
    cliente: cliente || 'Cliente Agendado',
    cliente_telefone: cliente_telefone || '(31) 99999-0000',
    barbeiro: barbeiro || 'Márcio Top Barber',
    servico: servico || 'Corte Tradicional / Moderno',
    data: data || new Date().toISOString().split('T')[0],
    hora: hora || '14:00',
    status: 'Agendado',
    valor: parseFloat(valor) || 25.00
  };

  if (sqliteInstance) {
    sqliteInstance.run(
      'INSERT INTO appointments (cliente, cliente_telefone, barbeiro, servico, data, hora, status, valor) VALUES (?, ?, ?, ?, ?, ?, "Agendado", ?)',
      [newAppt.cliente, newAppt.cliente_telefone, newAppt.barbeiro, newAppt.servico, newAppt.data, newAppt.hora, newAppt.valor],
      function (err) {
        if (!err) newAppt.id = this.lastID;
        memoryStore.appointments.unshift(newAppt);
        res.status(201).json({ success: true, appointment: newAppt });
      }
    );
  } else {
    memoryStore.appointments.unshift(newAppt);
    res.status(201).json({ success: true, appointment: newAppt });
  }
});

app.patch('/api/agendamentos/:id/status', (req, res) => {
  const { status } = req.body;
  const apptId = parseInt(req.params.id);

  const appt = memoryStore.appointments.find(a => a.id === apptId);
  if (appt) appt.status = status;

  if (sqliteInstance) {
    sqliteInstance.run('UPDATE appointments SET status = ? WHERE id = ?', [status, apptId]);
  }

  if (status === 'Concluído' && appt) {
    const today = new Date().toISOString().split('T')[0];
    const newSale = { id: Date.now(), item: `Serviço: ${appt.servico} (${appt.cliente})`, tipo: 'servico', quantidade: 1, valor_total: appt.valor, forma_pgto: 'Pix', data: today };
    memoryStore.sales.unshift(newSale);

    const srv = memoryStore.services.find(s => s.nome === appt.servico);
    const valorComissao = srv ? srv.comissao : (appt.valor * 0.4);
    const newComm = { id: Date.now(), barbeiro: appt.barbeiro, servico: appt.servico, comissao: valorComissao, data: today, pago: 'Não' };
    memoryStore.commissions.unshift(newComm);
  }

  res.json({ success: true, id: apptId, status });
});

// 5. PRODUTOS & ESTOQUE
app.get('/api/produtos', (req, res) => {
  if (sqliteInstance) {
    sqliteInstance.all('SELECT * FROM products ORDER BY id ASC', [], (err, rows) => {
      if (err) return res.json(memoryStore.products);
      res.json(rows);
    });
  } else {
    res.json(memoryStore.products);
  }
});

app.post('/api/produtos', (req, res) => {
  const { nome, categoria, estoque, valor_compra, valor_venda } = req.body;
  const newProd = {
    id: Date.now(),
    nome,
    categoria,
    estoque: parseInt(estoque),
    valor_compra: parseFloat(valor_compra),
    valor_venda: parseFloat(valor_venda)
  };

  if (sqliteInstance) {
    sqliteInstance.run(
      'INSERT INTO products (nome, categoria, estoque, valor_compra, valor_venda) VALUES (?, ?, ?, ?, ?)',
      [nome, categoria, parseInt(estoque), parseFloat(valor_compra), parseFloat(valor_venda)],
      function (err) {
        if (!err) newProd.id = this.lastID;
        memoryStore.products.push(newProd);
        res.status(201).json(newProd);
      }
    );
  } else {
    memoryStore.products.push(newProd);
    res.status(201).json(newProd);
  }
});

// 6. FRENTE DE CAIXA (POS CHECKOUT)
app.post('/api/pos/checkout', (req, res) => {
  const { item, quantidade, valor_total, forma_pgto, product_id } = req.body;
  const today = new Date().toISOString().split('T')[0];

  const newSale = {
    id: Date.now(),
    item,
    tipo: 'produto',
    quantidade: parseInt(quantidade) || 1,
    valor_total: parseFloat(valor_total),
    forma_pgto: forma_pgto || 'Pix',
    data: today
  };

  memoryStore.sales.unshift(newSale);

  if (product_id) {
    const prod = memoryStore.products.find(p => p.id === parseInt(product_id));
    if (prod) prod.estoque = Math.max(0, prod.estoque - (parseInt(quantidade) || 1));
  }

  if (sqliteInstance) {
    sqliteInstance.run(
      'INSERT INTO sales (item, tipo, quantidade, valor_total, forma_pgto, data) VALUES (?, "produto", ?, ?, ?, ?)',
      [item, parseInt(quantidade) || 1, parseFloat(valor_total), forma_pgto || 'Pix', today]
    );
    if (product_id) {
      sqliteInstance.run('UPDATE products SET estoque = estoque - ? WHERE id = ?', [parseInt(quantidade) || 1, product_id]);
    }
  }

  res.status(201).json({ success: true, sale: newSale });
});

app.get('/api/vendas', (req, res) => {
  if (sqliteInstance) {
    sqliteInstance.all('SELECT * FROM sales ORDER BY id DESC', [], (err, rows) => {
      if (err) return res.json(memoryStore.sales);
      res.json(rows);
    });
  } else {
    res.json(memoryStore.sales);
  }
});

app.get('/api/comissoes', (req, res) => {
  if (sqliteInstance) {
    sqliteInstance.all('SELECT * FROM commissions ORDER BY id DESC', [], (err, rows) => {
      if (err) return res.json(memoryStore.commissions);
      res.json(rows);
    });
  } else {
    res.json(memoryStore.commissions);
  }
});

app.patch('/api/comissoes/:id/pagar', (req, res) => {
  const commId = parseInt(req.params.id);
  const comm = memoryStore.commissions.find(c => c.id === commId);
  if (comm) comm.pago = 'Sim';

  if (sqliteInstance) {
    sqliteInstance.run('UPDATE commissions SET pago = "Sim" WHERE id = ?', [commId]);
  }
  res.json({ success: true });
});

// 7. AUTENTICAÇÃO
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  const validEmails = ['admin@admin.com', 'admin@admin', 'helpus.ecommerce@gmail.com'];
  const validPasswords = ['123', 'admin123', '@dmLocal1993'];

  if (validEmails.includes(normalizedEmail) && validPasswords.includes(password)) {
    return res.json({
      success: true,
      access_token: 'token_barbearia_saas_' + Date.now(),
      user: { id: 1, name: 'Administrador Barbearia', email: normalizedEmail, role: 'admin' }
    });
  }

  return res.status(401).json({ success: false, detail: 'E-mail ou senha inválidos.' });
});

// Rota Fallback SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Servidor Barbearia SaaS rodando universalmente na porta ${PORT}`);
});
