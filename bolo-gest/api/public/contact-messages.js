/**
 * Vercel serverless — grava reclamações/contacto na base PostgreSQL.
 * Necessita DATABASE_URL (mesma base do backend Railway).
 */
const { Pool } = require('pg');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function normalizeDatabaseUrl(raw) {
  if (!raw) return '';
  let url = String(raw).trim().replace(/\r?\n/g, '');
  if (url.startsWith('jdbc:postgresql://')) {
    url = url.replace('jdbc:postgresql://', 'postgresql://');
  }
  return url;
}

/** Supabase + node-pg: sslmode na URL pode ignorar rejectUnauthorized. */
function createPool(connectionString) {
  if (!connectionString || connectionString.includes('localhost')) {
    return new Pool({ connectionString, max: 1 });
  }

  const parsed = new URL(connectionString.replace(/^postgresql:/, 'postgres:'));
  parsed.searchParams.delete('sslmode');
  const cleaned = parsed.toString().replace(/^postgres:/, 'postgresql:');

  return new Pool({
    connectionString: cleaned,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 15000,
  });
}

function trimOrNull(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

module.exports = async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido.' });
  }

  const connectionString = normalizeDatabaseUrl(
    process.env.DATABASE_URL || process.env.DATABASE_JDBC_URL || process.env.DATABASE_PUBLIC_URL,
  );

  if (!connectionString) {
    return res.status(503).json({
      message: 'Serviço de contacto temporariamente indisponível. Tente mais tarde.',
    });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const fullName = trimOrNull(body.fullName);
  const email = trimOrNull(body.email);
  const phone = trimOrNull(body.phone);
  const message = trimOrNull(body.message);
  const pageUrl = trimOrNull(body.pageUrl);

  if (!fullName) {
    return res.status(400).json({ message: 'Indique o seu nome.' });
  }
  if (!message || message.length < 15) {
    return res.status(400).json({ message: 'A mensagem deve ter pelo menos 15 caracteres.' });
  }
  if (!email && !phone) {
    return res.status(400).json({ message: 'Indique o seu e-mail ou telefone para podermos responder.' });
  }

  const ipAddress = trimOrNull(req.headers['x-forwarded-for']?.split(',')[0]) || trimOrNull(req.socket?.remoteAddress);
  const userAgent = trimOrNull(req.headers['user-agent']);

  const pool = createPool(connectionString);

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(120) NOT NULL,
        email VARCHAR(200),
        phone VARCHAR(30),
        message VARCHAR(4000) NOT NULL,
        page_url VARCHAR(500),
        ip_address VARCHAR(64),
        user_agent VARCHAR(500),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const result = await pool.query(
      `INSERT INTO contact_messages (full_name, email, phone, message, page_url, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [fullName, email, phone, message, pageUrl, ipAddress, userAgent],
    );

    return res.status(201).json({
      id: result.rows[0]?.id,
      message: 'A sua reclamação ou pedido de contacto foi enviado com sucesso.',
    });
  } catch (error) {
    console.error('contact-messages insert failed:', error);
    return res.status(500).json({
      message: 'Não foi possível enviar a mensagem agora. Tente novamente em alguns instantes.',
    });
  } finally {
    await pool.end().catch(() => undefined);
  }
};
