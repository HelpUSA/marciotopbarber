import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sqlite3;
try {
  sqlite3 = (await import('sqlite3')).default;
} catch (err) {
  console.warn('⚠️ SQLite3 native addon não carregado no ambiente Serverless. Usando motor em memória.');
}

const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const dataDir = isVercel ? os.tmpdir() : path.join(__dirname);

if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (e) {}
}

// Memory Store Enterprise (Galeria Dinâmica, CRM e Licenças)
const memoryStore = {
  licenses: [
    { id: 1, name: 'Márcio Top Barber', owner_email: 'helpus.ecommerce@gmail.com', status: 'active', trial_ends_at: '2026-12-31', created_at: '2026-07-30' },
    { id: 2, name: 'Barbearia Unidade Demo', owner_email: 'demo@barber.com', status: 'trial', trial_ends_at: '2026-08-15', created_at: '2026-07-30' }
  ],
  users: [
    { id: 1, name: 'Márcio Top Barber', email: 'helpus.ecommerce@gmail.com', google_id: '812202824664', password: '@dmLocal1993', role: 'developer', tenant_id: 1, avatar: '/images/marcio.jpg' },
    { id: 2, name: 'Administrador Local', email: 'admin@admin', google_id: null, password: '123', role: 'owner', tenant_id: 1, avatar: '' },
    { id: 3, name: 'Hugo Freitas', email: 'hugo@barber.com', google_id: null, password: '123', role: 'barber', tenant_id: 1, avatar: '' }
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
  appointments: [
    { id: 101, cliente: 'Cliente Vip 1', cliente_telefone: '(83) 99888-7777', barbeiro: 'Márcio Top Barber', servico: 'Combo Premium Corte + Barba', data: '2026-07-01', hora: '14:00', status: 'Concluído', valor: 55.00 },
    { id: 102, cliente: 'Cliente Vip 2', cliente_telefone: '(83) 98777-6666', barbeiro: 'Márcio Top Barber', servico: 'Corte Márcio Top Barber', data: '2026-07-10', hora: '15:30', status: 'Concluído', valor: 35.00 }
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
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS appointments (id INTEGER PRIMARY KEY AUTOINCREMENT, cliente TEXT, cliente_telefone TEXT, barbeiro TEXT, servico TEXT, data TEXT, hora TEXT, status TEXT, valor REAL)`);
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, categoria TEXT, estoque INTEGER, valor_compra REAL, valor_venda REAL)`);
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT, tipo TEXT, quantidade INTEGER, valor_total REAL, forma_pgto TEXT, data TEXT)`);
      sqliteInstance.run(`CREATE TABLE IF NOT EXISTS commissions (id INTEGER PRIMARY KEY AUTOINCREMENT, barbeiro TEXT, servico TEXT, comissao REAL, data TEXT, pago TEXT)`);

      sqliteInstance.get('SELECT COUNT(*) as count FROM gallery', (err, row) => {
        if (row && row.count === 0) {
          memoryStore.gallery.forEach(g => sqliteInstance.run(`INSERT INTO gallery (titulo, url, categoria) VALUES (?, ?, ?)`, [g.titulo, g.url, g.categoria]));
        }
      });
    });
  } catch (e) {
    sqliteInstance = null;
  }
}

export { sqliteInstance, memoryStore };
