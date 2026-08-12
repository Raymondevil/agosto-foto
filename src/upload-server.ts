import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import { serve } from '@hono/node-server'

const app = new Hono()

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/srv'
const PORT = parseInt(process.env.PORT || '3000')

// Asegurarse de que la carpeta /srv exista
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true })
  console.log(`✅ Carpeta ${UPLOAD_DIR} creada`)
}

// 1. SERVIR FOTOS ESTÁTICAS PARA DESCARGAR O MOSTRAR
// Peticiones a /fotos/foto1.jpg buscarán en /srv/foto1.jpg
app.use('/fotos/*', serveStatic({
  root: UPLOAD_DIR,
  rewriteRequestPath: (path) => path.replace(/^\/fotos/, '')
}))

// 1b. Listar todas las fotos (para admin)
app.get('/api/fotos', (c) => {
  try {
    const files = readdirSync(UPLOAD_DIR)
      .filter(file => !file.startsWith('.'))
      .map(file => ({
        name: file,
        url: `/fotos/${file}`,
        size: existsSync(join(UPLOAD_DIR, file)) ? 'OK' : 'ERROR'
      }))
    return c.json({ success: true, files, count: files.length })
  } catch (err) {
    return c.json({ success: false, error: 'Error al listar archivos' }, 500)
  }
})

// Configuration for D1 integration
const D1_REGISTER_URL = process.env.D1_REGISTER_URL || 'http://localhost:3000/api/gallery/register'
const D1_UPLOAD_PASSWORD = process.env.D1_UPLOAD_PASSWORD || 'tigre2026'

// 2. ENDPOINT PARA SUBIR FOTOS (Multipart Form Data)
// Tambien puede registrar en D1 automaticamente
app.post('/api/upload', async (c) => {
  try {
    // Usar el parseBody de Hono para multipart
    const body = await c.req.parseBody()
    const file = body['photo'] as { 
      name: string;
      type: string;
      arrayBuffer: () => Promise<ArrayBuffer>
    } | undefined

    // Parametros opcionales para registro en D1
    const title = (body['title'] as string) || ''
    const category = (body['category'] as string) || 'general'
    const date = (body['date'] as string) || 'Fiestas Patrias 2026'
    const description = (body['description'] as string) || ''
    const price = parseInt(body['price'] as string) || 50
    const dorsal = (body['dorsal'] as string) || ''
    const type = (body['type'] as string) || 'photo'
    const registerInD1 = (body['registerInD1'] as string) === 'true' || false

    if (!file) {
      return c.json({ error: 'No se subió ninguna imagen (campo: photo)' }, 400)
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Validar tamaño (máximo 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      return c.json({ error: 'Archivo demasiado grande (máx 10MB)' }, 400)
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF' }, 400)
    }

    // Guardamos el archivo en /srv
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`
    const filePath = join(UPLOAD_DIR, fileName)
    
    writeFileSync(filePath, buffer)
    
    console.log(`✅ Foto guardada: ${fileName}`)

    // URL donde se puede acceder a la foto
    const photoUrl = `/fotos/${fileName}`
    const fullPhotoUrl = `${process.env.PUBLIC_URL || `http://localhost:${PORT}`}${photoUrl}`

    // Opcionalmente registrar en D1
    let d1Registration: any = null
    if (registerInD1) {
      try {
        // Intentar registrar en D1 a traves del endpoint de la aplicacion principal
        const response = await fetch(D1_REGISTER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileName,
            url: fullPhotoUrl,
            title: title || fileName,
            category,
            date,
            type,
            description,
            price,
            dorsal,
            uploadPassword: D1_UPLOAD_PASSWORD
          })
        })
        
        if (response.ok) {
          d1Registration = await response.json()
          console.log(`✅ Foto registrada en D1: ${fileName}`)
        } else {
          console.warn(`⚠️  No se pudo registrar en D1, pero la foto se guardó correctamente`)
        }
      } catch (d1Err: any) {
        console.warn(`⚠️  Error al registrar en D1: ${d1Err.message}, pero la foto se guardó`)
      }
    }

    return c.json({
      success: true,
      message: 'Foto guardada correctamente en /srv',
      url: photoUrl,
      fullUrl: fullPhotoUrl,
      fileName,
      registeredInD1: registerInD1,
      d1Registration
    })
  } catch (err: any) {
    console.error('Error al subir foto:', err)
    return c.json({ 
      success: false, 
      error: 'Error al procesar la imagen: ' + err.message 
    }, 500)
  }
})

// 3. ENDPOINT PARA ELIMINAR FOTOS (Admin)
app.post('/api/fotos/delete', async (c) => {
  try {
    const body = await c.req.json()
    const { fileName, password } = body
    
    // Autenticación básica
    if (password !== process.env.ADMIN_PASSWORD && password !== 'tigre2026') {
      return c.json({ success: false, error: 'Contraseña incorrecta' }, 401)
    }
    
    if (!fileName) {
      return c.json({ success: false, error: 'Nombre de archivo requerido' }, 400)
    }
    
    const filePath = join(UPLOAD_DIR, fileName)
    
    if (!existsSync(filePath)) {
      return c.json({ success: false, error: 'Archivo no encontrado' }, 404)
    }
    
    unlinkSync(filePath)
    console.log(`🗑️  Foto eliminada: ${fileName}`)
    
    return c.json({
      success: true,
      message: 'Foto eliminada correctamente',
      fileName
    })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

// 4. Servir archivos estáticos desde /public si existen
app.use('/static/*', serveStatic({
  root: './public',
  rewriteRequestPath: (path) => path.replace(/^\/static/, '')
}))

// 5. Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uploadDir: UPLOAD_DIR,
    uploadDirExists: existsSync(UPLOAD_DIR)
  })
})

// Iniciar servidor Node.js usando el adaptador de Hono
console.log(`🚀 Servidor de subidas escuchando en http://localhost:${PORT}`)
console.log(`📁 Directorio de subidas: ${UPLOAD_DIR}`)
console.log(`📤 Endpoint para subir: POST http://localhost:${PORT}/api/upload`)
console.log(`📥 Endpoint para listar: GET http://localhost:${PORT}/api/fotos`)
console.log(`🖼️  Endpoint para ver: GET http://localhost:${PORT}/fotos/{nombre}`)

serve({
  fetch: app.fetch,
  port: PORT
})

export default app
