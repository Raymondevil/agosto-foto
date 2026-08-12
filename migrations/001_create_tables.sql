-- Tabla para galería de fotos y videos
CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  video_url TEXT,
  description TEXT,
  price INTEGER NOT NULL,
  dorsal TEXT,
  high_res_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para pedidos
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  video_pass INTEGER NOT NULL,
  photo_count INTEGER NOT NULL,
  selected_photo_ids TEXT,
  selected_events TEXT,
  notes TEXT,
  total INTEGER NOT NULL,
  status TEXT NOT NULL,
  payment_method TEXT,
  payment_status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para mensajes de contacto
CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category);
CREATE INDEX IF NOT EXISTS idx_gallery_dorsal ON gallery(dorsal);
CREATE INDEX IF NOT EXISTS idx_gallery_date ON gallery(date);
CREATE INDEX IF NOT EXISTS idx_gallery_type ON gallery(type);
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_name);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
