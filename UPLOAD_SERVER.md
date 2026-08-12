# 📤 Servidor de Subidas de Fotos

Este servidor permite **subir, listar, servir y eliminar fotos** desde el directorio `/srv` de tu máquina, accesibles a través de Cloudflare Tunnel.

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Compilar el servidor de subidas
```bash
npm run build:upload
```

### 3. Iniciar con Docker Compose
```bash
# Para desarrollo local
docker compose -f docker-compose.upload.yml up -d

# Para producción
npm run deploy:upload
```

## 📁 Estructura

```
webfotos/
├── src/
│   └── upload-server.ts      # Código fuente del servidor
├── dist/
│   └── upload-server.js      # Código compilado
├── Dockerfile.upload          # Dockerfile para el uploader
├── docker-compose.upload.yml # Configuración Docker Compose
└── srv/                     # 📁 Directorios de fotos (volumen persistente)
```

## 🔧 Endpoints Disponibles

| Método | Ruta | Descripción | Parámetros |
|--------|------|-------------|------------|
| GET | `/health` | Health check del servidor | - |
| GET | `/api/fotos` | Listar todas las fotos subidas | - |
| GET | `/fotos/{nombre}` | Descargar/ver una foto | nombre (string) |
| POST | `/api/upload` | Subir una nueva foto | photo (File) |
| POST | `/api/fotos/delete` | Eliminar una foto | fileName, password |

## 📤 Subir una Foto (POST /api/upload)

### Request (Multipart Form Data)
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "photo=@/ruta/a/mi-foto.jpg"
```

### Response
```json
{
  "success": true,
  "message": "Foto guardada correctamente en /srv",
  "url": "/fotos/1712345678901-abc123.jpg",
  "fileName": "1712345678901-abc123.jpg"
}
```

### Validaciones
- ✅ **Tamaño máximo**: 10MB
- ✅ **Tipos permitidos**: JPG, PNG, WebP, GIF
- ✅ **Nombre único**: Timestamp + random string

## 📥 Listar Fotos (GET /api/fotos)

```bash
curl http://localhost:3000/api/fotos
```

### Response
```json
{
  "success": true,
  "files": [
    {
      "name": "1712345678901-abc123.jpg",
      "url": "/fotos/1712345678901-abc123.jpg",
      "size": "OK"
    }
  ],
  "count": 1
}
```

## 🖼️ Ver/Descargar Foto (GET /fotos/{nombre})

```bash
# Ver en navegador
curl http://localhost:3000/fotos/1712345678901-abc123.jpg

# Descargar
curl -OJ http://localhost:3000/fotos/1712345678901-abc123.jpg
```

## 🗑️ Eliminar Foto (POST /api/fotos/delete)

```bash
curl -X POST http://localhost:3000/api/fotos/delete \
  -H "Content-Type: application/json" \
  -d '{"fileName": "1712345678901-abc123.jpg", "password": "tigre2026"}'
```

### Response
```json
{
  "success": true,
  "message": "Foto eliminada correctamente",
  "fileName": "1712345678901-abc123.jpg"
}
```

## 🔐 Autenticación

- **Contraseña admin**: `tigre2026` (configurable en `.env`)
- **Variable de entorno**: `ADMIN_PASSWORD`

## 🐳 Docker

### Build manual
```bash
docker build -t eltigre-upload -f Dockerfile.upload .
```

### Run manual
```bash
docker run -d \
  --name eltigre-uploader \
  -p 3000:3000 \
  -v $(pwd)/srv:/srv \
  -e UPLOAD_DIR=/srv \
  -e ADMIN_PASSWORD=tigre2026 \
  eltigre-upload
```

## 🌐 Cloudflare Tunnel

El `docker-compose.upload.yml` incluye un servicio `cloudflared-uploader` que crea un túnel público a tu servidor local.

### Acceso remoto
- El túnel se conecta a `http://uploader:3000` (nombre del servicio en Docker)
- URL pública generada automáticamente por Cloudflare

## 📊 Variables de Entorno

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| PORT | 3000 | Puerto del servidor |
| UPLOAD_DIR | /srv | Directorio para guardar fotos |
| ADMIN_PASSWORD | tigre2026 | Contraseña para eliminar fotos |
| NODE_ENV | production | Modo de ejecución |

## 🔧 Configuración de Docker Compose

### docker-compose.upload.yml
```yaml
services:
  uploader:
    build:
      context: .
      dockerfile: Dockerfile.upload
    ports:
      - "3001:3000"
    volumes:
      - ./srv:/srv
    environment:
      - UPLOAD_DIR=/srv
      - ADMIN_PASSWORD=tigre2026

  cloudflared-uploader:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run --url http://uploader:3000
    depends_on:
      - uploader
```

## 💡 Tips

### 1. Optimizar imágenes antes de subir
```bash
# Usando ImageMagick
convert foto.jpg -quality 80 -resize 1200x1200 foto-optimizada.jpg

# Usando Sharp CLI
sharp -i foto.jpg -o foto-optimizada.webp -w 1200 -q 75
```

### 2. Subir múltiples fotos
```bash
# Linux/Mac
for f in *.jpg; do
  curl -X POST http://localhost:3000/api/upload -F "photo=@$f"
done

# Windows (PowerShell)
Get-ChildItem *.jpg | ForEach-Object {
  curl -X POST http://localhost:3000/api/upload -F "photo=@$($_.FullName)"
}
```

### 3. Sincronizar con tu galería D1
Puedes usar el endpoint `/api/admin/upload` de tu aplicación principal para registrar las fotos subidas en la base de datos D1.

## 🚨 Seguridad

1. **Cambiar la contraseña admin**: Modifica `ADMIN_PASSWORD` en docker-compose.upload.yml
2. **Proteger el túnel**: Usa Cloudflare Access para restringir el acceso
3. **Backup regular**: El directorio `./srv` contiene todas tus fotos, haz backup
4. **Límites**: Configura límites de almacenamiento en tu host

## 📖 Integración con la Aplicación Principal

Tu aplicación principal (Cloudflare Pages) puede usar este servidor de subidas:

```typescript
// Para subir una foto
const response = await fetch('https://tu-dominio.com/api/upload', {
  method: 'POST',
  body: formData  // FormData con el archivo
})

// Para mostrar una foto
<img src="https://tu-dominio.com/fotos/nombre-de-la-foto.jpg" />
```

## 🔄 Actualizaciones

Para actualizar el servidor:
```bash
# Recompilar
npm run build:upload

# Rebuild Docker
docker compose -f docker-compose.upload.yml build --no-cache

# Reiniciar
docker compose -f docker-compose.upload.yml down && \
docker compose -f docker-compose.upload.yml up -d
```

## 🎯 Resumen

✅ **Subir fotos** desde cualquier dispositivo
✅ **Descargar fotos** directamente
✅ **Listar fotos** disponibles
✅ **Eliminar fotos** (con autenticación)
✅ **Persistencia** en el host con Docker Volumes
✅ **Acceso público** a través de Cloudflare Tunnel
✅ **100% compatible** con tu proyecto actual
