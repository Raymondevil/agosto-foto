# 🗃️ Integración Directa con Cloudflare D1 Database

Este documento explica cómo el **servidor de subidas de fotos** y la **aplicación principal** trabajan juntos para registrar automáticamente las fotos en la base de datos D1.

## 🔄 Flujo de Integración

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│                     │    │                     │    │                     │
│   Navegador/Client  │───▶│  Upload Server      │───▶│   App Principal     │
│                     │    │  (Node.js:3001)     │    │  (Workers:3000)    │
└──────────┬─────────┘    └──────────┬─────────┘    └──────────┬─────────┘
           │                          │                          │
           │ POST /api/upload          │                          │
           │ (photo file)              │                          │
           ▼                          │                          ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Foto guardada en   │    │  Llamada a:         │    │  Registra en D1:   │
│   /srv/NOMBRE.jpg   │    │  POST /api/gallery/  │    │  INSERT INTO       │
└─────────────────────┘    │  register           │    │  gallery(...)      │
                           └──────────┬─────────┘    └─────────────────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │   Respuesta:        │
                           │   { success, url,   │
                           │     d1Registration }│
                           └─────────────────────┘
```

## 🔧 Configuración

### 1. Variables de Entorno (docker-compose.upload.yml)

```yaml
uploader:
  environment:
    - D1_REGISTER_URL=http://webapp:3000/api/gallery/register
    - D1_UPLOAD_PASSWORD=tigre2026
```

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `D1_REGISTER_URL` | URL del endpoint para registrar en D1 | `http://webapp:3000/api/gallery/register` |
| `D1_UPLOAD_PASSWORD` | Contraseña para autorizar el registro | `tigre2026` |

### 2. Endpoint de Registro en App Principal (index.tsx)

Nuevo endpoint creado en `src/index.tsx`:

```typescript
// POST /api/gallery/register
app.post('/api/gallery/register', async (c) => {
  const body = await c.req.json()
  const { 
    fileName, url, title, category, date, type, 
    description, price, dorsal, videoUrl, highResUrl, 
    uploadPassword 
  } = body

  // Validar contraseña
  if (uploadPassword && uploadPassword !== 'tigre2026' && uploadPassword !== 'eltigre2026') {
    return c.json({ success: false, error: 'Contraseña incorrecta' }, 401)
  }

  // Crear nuevo item
  const newItem: GalleryItem = {
    id: fileName,
    title: title || fileName,
    category: category || 'general',
    date: date || 'Fiestas Patrias 2026',
    type: type || 'photo',
    url: url,
    videoUrl: videoUrl || '',
    description: description || '',
    price: price || 50,
    dorsal: dorsal || '',
    highResUrl: highResUrl || url
  }

  // Guardar en D1
  if (c.env.DB) {
    await c.env.DB.prepare(`
      INSERT INTO gallery (...) VALUES (...)
    `).bind(...).run()
  }

  return c.json({ success: true, message: 'Foto registrada en D1', item: newItem })
})
```

### 3. Endpoint Mejorado en Upload Server (upload-server.ts)

```typescript
// POST /api/upload
app.post('/api/upload', async (c) => {
  const body = await c.req.parseBody()
  const file = body['photo']
  
  // Parámetros opcionales para D1
  const title = body['title'] as string
  const category = body['category'] as string
  const date = body['date'] as string
  const description = body['description'] as string
  const price = parseInt(body['price'] as string)
  const dorsal = body['dorsal'] as string
  const type = body['type'] as string
  const registerInD1 = (body['registerInD1'] as string) === 'true'

  // Guardar archivo en /srv
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`
  writeFileSync(join(UPLOAD_DIR, fileName), buffer)

  // Si registerInD1 es true, registrar en D1
  if (registerInD1) {
    const response = await fetch(D1_REGISTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName,
        url: `http://localhost:3001/fotos/${fileName}`,
        title, category, date, type, description, price, dorsal,
        uploadPassword: D1_UPLOAD_PASSWORD
      })
    })
    
    if (response.ok) {
      d1Registration = await response.json()
    }
  }

  return c.json({
    success: true,
    url: `/fotos/${fileName}`,
    registeredInD1: registerInD1,
    d1Registration
  })
})
```

## 📤 Cómo Subir y Registrar una Foto

### Opción 1: Desde cURL (con registro en D1)

```bash
# Subir y registrar en D1 automáticamente
curl -X POST http://localhost:3001/api/upload \
  -F "photo=@mi-foto.jpg" \
  -F "title=Foto de la Topadera" \
  -F "category=topaderas" \
  -F "date=16 de Septiembre" \
  -F "price=50" \
  -F "dorsal=12" \
  -F "registerInD1=true"
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Foto guardada correctamente en /srv",
  "url": "/fotos/1712345678901-abc123.jpg",
  "fullUrl": "http://localhost:3001/fotos/1712345678901-abc123.jpg",
  "fileName": "1712345678901-abc123.jpg",
  "registeredInD1": true,
  "d1Registration": {
    "success": true,
    "message": "Foto registrada correctamente en la base de datos",
    "item": {
      "id": "1712345678901-abc123.jpg",
      "title": "Foto de la Topadera",
      "category": "topaderas",
      ...
    }
  }
}
```

### Opción 2: Desde JavaScript (Frontend)

```javascript
const formData = new FormData()
formData.append('photo', fileInput.files[0])
formData.append('title', 'Foto de la Topadera')
formData.append('category', 'topaderas')
formData.append('price', '50')
formData.append('dorsal', '12')
formData.append('registerInD1', 'true')

const response = await fetch('http://localhost:3001/api/upload', {
  method: 'POST',
  body: formData
})

const result = await response.json()
if (result.success) {
  console.log('Foto registrada en D1:', result.d1Registration)
}
```

### Opción 3: Dos pasos (subir primero, luego registrar)

```bash
# Paso 1: Subir la foto (sin registrar en D1)
curl -X POST http://localhost:3001/api/upload \
  -F "photo=@mi-foto.jpg"

# Paso 2: Registrar manualmente en D1
curl -X POST http://localhost:3000/api/gallery/register \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "1712345678901-abc123.jpg",
    "url": "http://localhost:3001/fotos/1712345678901-abc123.jpg",
    "title": "Foto de la Topadera",
    "category": "topaderas",
    "price": 50,
    "uploadPassword": "tigre2026"
  }'
```

## 🔍 Endpoints Adicionales Creados

### GET /api/gallery/:id

Obtener una foto específica de la galería:

```bash
curl http://localhost:3000/api/gallery/1712345678901-abc123.jpg
```

**Respuesta:**
```json
{
  "success": true,
  "photo": {
    "id": "1712345678901-abc123.jpg",
    "title": "Foto de la Topadera",
    "category": "topaderas",
    "date": "16 de Septiembre",
    "type": "photo",
    "url": "http://localhost:3001/fotos/1712345678901-abc123.jpg",
    "price": 50,
    "dorsal": "12"
  }
}
```

## 📊 Datos Guardados en D1

### Tabla `gallery`

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| id | TEXT | Identificador único | `1712345678901-abc123.jpg` |
| title | TEXT | Título de la foto | `Foto de la Topadera` |
| category | TEXT | Categoría | `topaderas`, `cabalgatas`, etc. |
| date | TEXT | Fecha del evento | `16 de Septiembre` |
| type | TEXT | Tipo | `photo`, `video` |
| url | TEXT | URL de la foto | `http://localhost:3001/fotos/...` |
| video_url | TEXT | URL del video (opcional) | - |
| description | TEXT | Descripción | `Captura en el ruedo` |
| price | INTEGER | Precio | `50` |
| dorsal | TEXT | Número de dorsal | `12` |
| high_res_url | TEXT | URL alta resolución | - |
| created_at | DATETIME | Fecha de creación | `2026-08-12 10:00:00` |

### Índices

- `idx_gallery_category` - Para filtrar por categoría
- `idx_gallery_dorsal` - Para buscar por dorsal
- `idx_gallery_date` - Para filtrar por fecha
- `idx_gallery_type` - Para filtrar por tipo

## 🎯 Flujo Recomendado para Producción

1. **Subir foto al Upload Server** → Obtener URL
2. **Upload Server registra en D1** → Guardar metadatos
3. **Frontend muestra la foto** → Desde D1 o directamente

```
Cliente ─────▶ Upload Server (guarda archivo en /srv)
              │
              ▼
Upload Server ─────▶ App Principal (/api/gallery/register)
                    │
                    ▼
               D1 Database (guarda metadatos)
                    │
                    ▼
               Frontend (lee de D1)
```

## 💡 Consejos para Producción

### 1. Usar URLs absolutas

Configura `PUBLIC_URL` en el entorno del uploader:

```yaml
uploader:
  environment:
    - PUBLIC_URL=https://fotos.tudominio.com
```

### 2. Cambiar la contraseña

Modifica `D1_UPLOAD_PASSWORD` y `ADMIN_PASSWORD`:

```yaml
uploader:
  environment:
    - D1_UPLOAD_PASSWORD=contraseña-segura-2026
    - ADMIN_PASSWORD=contraseña-segura-2026
```

### 3. Validar que el webapp esté disponible

El uploader depende del webapp. Usa health checks:

```yaml
uploader:
  depends_on:
    webapp:
      condition: service_healthy
  
webapp:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### 4. Retry automático

Si el webapp no está disponible, el uploader intentará registrar más tarde:

```typescript
// En upload-server.ts
if (registerInD1) {
  let retries = 3
  let success = false
  
  while (retries > 0 && !success) {
    try {
      const response = await fetch(D1_REGISTER_URL, {...})
      if (response.ok) {
        d1Registration = await response.json()
        success = true
      }
    } catch (err) {
      retries--
      if (retries === 0) {
        console.warn('No se pudo registrar en D1 después de 3 intentos')
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }
}
```

## 📝 Ejemplo Completo: Panel de Administración

### Frontend (HTML + JavaScript)

```html
<form id="uploadForm" enctype="multipart/form-data">
  <h2>Subir Nueva Foto</h2>
  
  <div>
    <label>Foto:</label>
    <input type="file" name="photo" accept="image/*" required>
  </div>
  
  <div>
    <label>Título:</label>
    <input type="text" name="title" required>
  </div>
  
  <div>
    <label>Categoría:</label>
    <select name="category">
      <option value="topaderas">Topaderas y Jaripeos</option>
      <option value="cabalgatas">Cabalgatas</option>
      <option value="grito">Noche del Grito</option>
      <option value="desfiles">Desfiles</option>
      <option value="bailes">Bailes</option>
      <option value="videos">Videos</option>
    </select>
  </div>
  
  <div>
    <label>Fecha:</label>
    <input type="text" name="date" value="Fiestas Patrias 2026">
  </div>
  
  <div>
    <label>Precio ($):</label>
    <input type="number" name="price" value="50">
  </div>
  
  <div>
    <label>Dorsal:</label>
    <input type="text" name="dorsal">
  </div>
  
  <div>
    <label>Descripción:</label>
    <textarea name="description"></textarea>
  </div>
  
  <div>
    <label>
      <input type="checkbox" name="registerInD1" value="true" checked> 
      Registrar en D1 automáticamente
    </label>
  </div>
  
  <button type="submit">Subir Foto</button>
</form>

<script>
async function handleSubmit(e) {
  e.preventDefault()
  
  const form = e.target
  const formData = new FormData(form)
  
  const response = await fetch('http://localhost:3001/api/upload', {
    method: 'POST',
    body: formData
  })
  
  const result = await response.json()
  
  if (result.success) {
    alert('✅ Foto subida y registrada en D1')
    form.reset()
    
    // Recargar galería
    location.reload()
  } else {
    alert('❌ Error: ' + (result.error || 'Error desconocido'))
  }
}

document.getElementById('uploadForm').addEventListener('submit', handleSubmit)
</script>
```

### Resultado

1. El usuario sube una foto con todos los metadatos
2. El servidor de subidas guarda el archivo en `/srv/`
3. El servidor de subidas registra los metadatos en D1
4. La foto aparece inmediatamente en la galería de la aplicación principal

## 🔍 Verificar la Integración

### 1. Ver fotos registradas en D1

```bash
# Conectarse a D1 directamente
wrangler d1 execute fotos --remote --command="SELECT * FROM gallery LIMIT 10"
```

### 2. Ver endpoints disponibles

```bash
# App principal (Workers)
curl http://localhost:3000/api/gallery

# Upload server (Node.js)
curl http://localhost:3001/api/fotos
```

### 3. Ver logs de Docker

```bash
docker compose -f docker-compose.upload.yml logs -f uploader
```

## ✅ Resumen de lo que Funciona Ahora

| Función | Estado | Descripción |
|---------|--------|-------------|
| Subir fotos | ✅ | Guarda archivos en `/srv/` |
| Registrar en D1 | ✅ | Automático con `registerInD1=true` |
| Listar fotos | ✅ | Desde `/api/fotos` (upload server) |
| Consultar D1 | ✅ | Desde `/api/gallery` (app principal) |
| Ver foto | ✅ | URL directa desde `/fotos/{nombre}` |
| Eliminar foto | ✅ | Con autenticación |
| Búsqueda por dorsal | ✅ | Usando índices de D1 |
| Filtro por categoría | ✅ | Usando índices de D1 |

## 🚀 Despliegue Completo

1. **Iniciar todos los servicios:**
   ```bash
   docker compose -f docker-compose.upload.yml up -d --build
   ```

2. **Verificar que todo funciona:**
   ```bash
   # Health check
   curl http://localhost:3001/health
   
   # Listar fotos en D1
   curl http://localhost:3000/api/gallery
   
   # Listar fotos en upload server
   curl http://localhost:3001/api/fotos
   ```

3. **Subir una foto de prueba:**
   ```bash
   curl -F "photo=@test.jpg" \
        -F "title=Prueba" \
        -F "category=test" \
        -F "registerInD1=true" \
        http://localhost:3001/api/upload
   ```

4. **Verificar en D1:**
   ```bash
   wrangler d1 execute fotos --remote --command="SELECT * FROM gallery WHERE category = 'test'"
   ```

## 📌 Notas Finales

- **El servidor de subidas y la app principal se comunican** a través de la red Docker interna
- **Las fotos se guardan en `/srv/`** (volumen persistente)
- **Los metadatos se guardan en D1** (Cloudflare)
- **Ambos servicios tienen Cloudflare Tunnel** para acceso público
- **La integración es automática** cuando `registerInD1=true`

---

**¿Necesitas algo más?** Puedo ayudarte con:
- Sincronización automática de fotos existentes
- Panel de administración web
- Notificaciones al registrar fotos
- Backup automático de fotos a R2
- Compresión automática de imágenes antes de subir
