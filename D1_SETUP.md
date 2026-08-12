# 🗃️ Configuración de Cloudflare D1 Database

## 📋 Información General

- **Nombre de la base de datos**: `fotos`
- **Database UUID**: `f573be5e-20fc-486a-b4de-88a61534291d`
- **Tamaño actual**: ~64KB (expandible automáticamente)
- **Versión**: production

## 🏗️ Tablas Creadas

### 1. `gallery` - Galería de fotos y videos
```sql
CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,      -- topaderas, cabalgatas, gritos, desfiles, bailes, videos
  date TEXT NOT NULL,
  type TEXT NOT NULL,           -- photo, video
  url TEXT NOT NULL,
  video_url TEXT,
  description TEXT,
  price INTEGER NOT NULL,
  dorsal TEXT,                 -- Número de dorsal del participante
  high_res_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 2. `orders` - Pedidos de clientes
```sql
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  video_pass INTEGER NOT NULL,    -- 1 = sí, 0 = no
  photo_count INTEGER NOT NULL,
  selected_photo_ids TEXT,       -- JSON array
  selected_events TEXT,          -- JSON array
  notes TEXT,
  total INTEGER NOT NULL,
  status TEXT NOT NULL,
  payment_method TEXT,
  payment_status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 3. `contact_messages` - Mensajes de contacto
```sql
CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## 📊 Índices de Optimización

| Índice | Tabla | Campo | Propósito |
|--------|-------|-------|----------|
| idx_gallery_category | gallery | category | Filtro por categoría |
| idx_gallery_dorsal | gallery | dorsal | Búsqueda por dorsal |
| idx_gallery_date | gallery | date | Filtro por fecha |
| idx_gallery_type | gallery | type | Filtro por tipo (photo/video) |
| idx_orders_status | orders | status | Filtro por estado de pedido |
| idx_orders_created | orders | created_at | Ordenación por fecha |

## 🔧 Configuración en wrangler.jsonc

```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "fotos",
      "database_id": "f573be5e-20fc-486a-b4de-88a61534291d"
    }
  ]
}
```

## 📥 Tipos TypeScript Generados

Los tipos fueron generados automáticamente con:
```bash
npm run cf-typegen
```

Esto creó `worker-configuration.d.ts` con:
```typescript
interface CloudflareBindings {
  DB: D1Database;
  ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
}
```

## 🔄 Migraciones

Las migraciones están en el directorio `/migrations/`:

1. **001_create_tables.sql** - Crea tablas e índices
2. **002_seed_data.sql** - Inserta datos iniciales

Para ejecutar migraciones en la base de datos remota:
```bash
# Crear tablas
wrangler d1 execute fotos --file=migrations/001_create_tables.sql --remote

# Insertar datos
wrangler d1 execute fotos --file=migrations/002_seed_data.sql --remote
```

## 🧪 Consultas Ejemplo

### Listar fotos por categoría
```sql
SELECT * FROM gallery WHERE category = 'topaderas' ORDER BY created_at DESC
```

### Buscar por dorsal
```sql
SELECT * FROM gallery WHERE dorsal LIKE '%12%' ORDER BY created_at DESC
```

### Obtener pedidos recientes
```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10
```

### Obtener mensajes de contacto
```sql
SELECT * FROM contact_messages ORDER BY created_at DESC
```

## 💡 Recomendaciones

### Para producción:
1. **Aumentar el tamaño de D1** (el plan gratuito tiene límite de 5GB)
2. **Configurar backups automáticos** de la base de datos
3. **Usar transacciones** para operaciones críticas
4. **Implementar paginación** en los endpoints de lista

### Para desarrollo:
- Usa `wrangler d1 execute fotos` (sin --remote) para probar localmente
- La base de datos local se crea automáticamente en `.wrangler/state/v3/d1/`

## 🔄 Integración con el Backend (Hono)

El código en `src/index.tsx` ya está configurado para usar D1 cuando está disponible:

```typescript
// Ejemplo de consulta con D1
if (c.env.DB) {
  const { results } = await c.env.DB.prepare('SELECT * FROM gallery').all()
  // Procesar resultados
}
```

Todos los endpoints API ya tienen soporte para D1:
- ✅ GET `/api/gallery` - Lista fotos con filtros
- ✅ GET `/api/orders` - Lista pedidos
- ✅ POST `/api/orders` - Crea pedido
- ✅ POST `/api/contact` - Guarda mensaje
- ✅ POST `/api/admin/upload` - Sube foto a galería

## 🚀 Deploy a Cloudflare Pages

1. Asegúrate que `wrangler.jsonc` tenga la configuración de D1
2. Ejecuta:
   ```bash
   npm run deploy
   ```
3. Cloudflare Pages conectará automáticamente con tu base de datos D1

## 📝 Notas

- La base de datos D1 es **SQLite compatible**
- Soporta **transacciones ACID**
- Tiene **consultas rápidas** gracias a los índices
- **Escalable automáticamente** con el tráfico
- **Sin costo adicional** para el plan gratuito de Cloudflare
