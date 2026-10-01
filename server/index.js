const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const SESSION_COOKIE = 'farmacia_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const AUTH_SECRET = process.env.AUTH_SECRET;

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function assinar(payload) {
  return crypto.createHmac('sha256', AUTH_SECRET || '').update(payload).digest('base64url');
}

function criarSessao(login) {
  const payload = base64url(JSON.stringify({
    login,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  }));
  return `${payload}.${assinar(payload)}`;
}

function lerCookies(header = '') {
  return header.split(';').reduce((cookies, item) => {
    const separator = item.indexOf('=');
    if (separator === -1) return cookies;
    const key = item.slice(0, separator).trim();
    cookies[key] = decodeURIComponent(item.slice(separator + 1).trim());
    return cookies;
  }, {});
}

function validarSessao(token) {
  if (!AUTH_SECRET || !token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(assinar(payload));
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!session.login || !session.exp || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

function cookieDeSessao(token, maxAge = SESSION_TTL_SECONDS) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

app.post('/api/auth/login', (req, res) => {
  const { login, senha } = req.body || {};
  const adminLogin = process.env.ADMIN_LOGIN;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminLogin || !adminPassword || !AUTH_SECRET) {
    return res.status(500).json({ error: 'As credenciais administrativas ainda não foram configuradas no servidor.' });
  }

  if (login !== adminLogin || senha !== adminPassword) {
    return res.status(401).json({ error: 'Login ou senha inválidos.' });
  }

  res.setHeader('Set-Cookie', cookieDeSessao(criarSessao(adminLogin)));
  return res.json({ user: { login: adminLogin } });
});

app.get('/api/auth/me', (req, res) => {
  const session = validarSessao(lerCookies(req.headers.cookie)[SESSION_COOKIE]);
  if (!session) return res.status(401).json({ error: 'Sessão não encontrada.' });
  return res.json({ user: { login: session.login } });
});

app.post('/api/auth/logout', (req, res) => {
  res.setHeader('Set-Cookie', cookieDeSessao('', 0));
  return res.json({ message: 'Sessão encerrada.' });
});

function requireAuth(req, res, next) {
  const session = validarSessao(lerCookies(req.headers.cookie)[SESSION_COOKIE]);
  if (!session) return res.status(401).json({ error: 'Não autorizado.' });
  req.user = { login: session.login };
  next();
}

// Todas as rotas de dados abaixo exigem uma sessão válida.
app.use('/api', requireAuth);

// ──────────────────────────────────────────
// MEDICAMENTOS
// ──────────────────────────────────────────

app.get('/api/medicamentos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM medicamentos');
    res.json(rows);
  } catch (err) {
    console.error("🔴 Erro ao buscar medicamentos:", err.message);
    res.status(500).json({ error: 'Erro ao buscar medicamentos' });
  }
});

app.post('/api/medicamentos', async (req, res) => {
  const { nome_comercial, cod_barra, qtd_caixa, dosagem, fabricante } = req.body;

  if (!nome_comercial || !cod_barra) {
    return res.status(400).json({ error: 'nome_comercial e cod_barra são obrigatórios' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO medicamentos (nome_comercial, cod_barra, qtd_caixa, dosagem, fabricante, ativo) VALUES (?, ?, ?, ?, ?, 1)',
      [nome_comercial, cod_barra, qtd_caixa || '', dosagem || '', fabricante || '']
    );

    res.status(201).json({ 
      id_medicamento: result.insertId,
      message: 'Medicamento cadastrado com sucesso!' 
    });
  } catch (err) {
    console.error("🔴 Erro ao cadastrar medicamento:", err.message);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Este código de barras já está cadastrado.' });
    }
    
    res.status(500).json({ error: 'Erro ao cadastrar medicamento' });
  }
});

app.delete('/api/medicamentos/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM medicamentos WHERE id_medicamento = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Medicamento não encontrado' });
    res.json({ message: 'Medicamento removido' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir. Verifique se existem lotes vinculados.' });
  }
});


// ──────────────────────────────────────────
// CLIENTES
// ──────────────────────────────────────────

app.get('/api/clientes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clientes');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

app.post('/api/clientes', async (req, res) => {
  const { nome, cpf, telefone, email, endereco } = req.body;
  if (!nome || !cpf) return res.status(400).json({ error: 'nome e cpf são obrigatórios' });
  try {
    const [result] = await pool.query(
      'INSERT INTO clientes (nome, cpf, telefone, email, endereco, ativo, data_cadastro) VALUES (?, ?, ?, ?, ?, 1, NOW())',
      [nome, cpf, telefone || '', email || '', endereco || '']
    );
    res.status(201).json({ id_cliente: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar cliente' });
  }
});

app.put('/api/clientes/:id', async (req, res) => {
  const { nome, cpf, telefone, email, endereco, ativo } = req.body;
  try {
    await pool.query(
      'UPDATE clientes SET nome=?, cpf=?, telefone=?, email=?, endereco=?, ativo=? WHERE id_cliente=?',
      [nome, cpf, telefone || '', email || '', endereco || '', ativo ? 1 : 0, req.params.id]
    );
    res.json({ message: 'Cliente atualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

app.delete('/api/clientes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM clientes WHERE id_cliente = ?', [req.params.id]);
    res.json({ message: 'Cliente removido' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover cliente' });
  }
});

// ──────────────────────────────────────────
// LOTES
// ──────────────────────────────────────────

app.get('/api/lotes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM lotes');
    res.json(rows);
  } catch (err) {
    console.error("🔴 Erro ao buscar lotes:", err.message);
    res.status(500).json({ error: 'Erro ao buscar lotes' });
  }
});

app.post('/api/lotes', async (req, res) => {
  const { id_medicamento, numero_lote, data_fabri, data_venci, quantidade, preco_compra, preco_venda, status } = req.body;

  if (!id_medicamento || !numero_lote || !data_venci) {
    return res.status(400).json({ error: 'id_medicamento, numero_lote e data_venci são obrigatórios' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO lotes (id_medicamento, numero_lote, data_fabri, data_venci, quantidade, preco_compra, preco_venda, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id_medicamento, numero_lote, data_fabri || null, data_venci, quantidade || 0, preco_compra || 0, preco_venda || 0, status || 'ATIVO']
    );

    res.status(201).json({
      id_lote: result.insertId,
      message: 'Lote cadastrado com sucesso!'
    });
  } catch (err) {
    console.error("🔴 Erro ao cadastrar lote:", err.message);
    res.status(500).json({ error: 'Erro ao cadastrar lote' });
  }
});

app.put('/api/lotes/:id', async (req, res) => {
  const { id_medicamento, numero_lote, data_fabri, data_venci, quantidade, preco_compra, preco_venda, status } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE lotes SET id_medicamento=?, numero_lote=?, data_fabri=?, data_venci=?, quantidade=?, preco_compra=?, preco_venda=?, status=? WHERE id_lote=?',
      [id_medicamento, numero_lote, data_fabri || null, data_venci, quantidade || 0, preco_compra || 0, preco_venda || 0, status || 'ATIVO', req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Lote não encontrado' });
    res.json({ message: 'Lote atualizado' });
  } catch (err) {
    console.error("🔴 Erro ao atualizar lote:", err.message);
    res.status(500).json({ error: 'Erro ao atualizar lote' });
  }
});

app.delete('/api/lotes/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM lotes WHERE id_lote = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Lote não encontrado' });
    res.json({ message: 'Lote removido' });
  } catch (err) {
    console.error("🔴 Erro ao excluir lote:", err.message);
    res.status(500).json({ error: 'Erro ao excluir. Verifique se existem vendas vinculadas.' });
  }
});

// ──────────────────────────────────────────
// VENDAS
// ──────────────────────────────────────────

app.get('/api/vendas', async (req, res) => {
  try {
    const [vendasRows] = await pool.query(
      'SELECT id_venda, id_cliente AS cliente_id, valor_total, data_venda FROM vendas ORDER BY data_venda DESC'
    );
    const [itensRows] = await pool.query(
      'SELECT id_item, id_venda AS venda_id, id_lote AS lote_id, quantidade, preco_unitario FROM itens_venda'
    );
 
    const vendas = vendasRows.map(v => ({
      ...v,
      itens: itensRows.filter(i => i.venda_id === v.id_venda),
    }));
 
    res.json(vendas);
  } catch (err) {
    console.error("🔴 Erro ao buscar vendas:", err.message);
    res.status(500).json({ error: 'Erro ao buscar vendas' });
  }
});
 
app.post('/api/vendas', async (req, res) => {
  const { itens, cliente_id, valor_total } = req.body;
 
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ error: 'A venda precisa ter ao menos um item.' });
  }
 
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
 
    // valida cada lote (estoque suficiente e não vencido) travando a linha
    for (const item of itens) {
      const [[lote]] = await conn.query('SELECT * FROM lotes WHERE id_lote = ? FOR UPDATE', [item.lote_id]);
 
      if (!lote) throw new Error(`Lote ${item.lote_id} não encontrado.`);
      if (lote.status !== 'ATIVO') throw new Error(`Lote ${lote.numero_lote} não está ativo.`);
      if (new Date(lote.data_venci) < new Date()) throw new Error(`Lote ${lote.numero_lote} está vencido e não pode ser vendido.`);
      if (lote.quantidade < item.quantidade) throw new Error(`Estoque insuficiente para o lote ${lote.numero_lote}.`);
    }
 
    const [vendaResult] = await conn.query(
      'INSERT INTO vendas (id_cliente, valor_total, data_venda) VALUES (?, ?, NOW())',
      [cliente_id || null, valor_total || 0]
    );
    const id_venda = vendaResult.insertId;
 
    for (const item of itens) {
      await conn.query(
        'INSERT INTO itens_venda (id_venda, id_lote, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
        [id_venda, item.lote_id, item.quantidade, item.preco_unitario]
      );
      await conn.query(
        'UPDATE lotes SET quantidade = quantidade - ? WHERE id_lote = ?',
        [item.quantidade, item.lote_id]
      );
    }
 
    await conn.commit();
    res.status(201).json({ id_venda, message: 'Venda registrada com sucesso!' });
  } catch (err) {
    await conn.rollback();
    console.error("🔴 Erro ao registrar venda:", err.message);
    res.status(400).json({ error: err.message || 'Erro ao processar venda.' });
  } finally {
    conn.release();
  }
});


// ──────────────────────────────────────────
// START
// ──────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});