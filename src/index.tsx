import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB?: D1Database
}

// Local Logo URL
const LOCAL_LOGO_URL = '/static/logo.webp'

// Types
interface GalleryItem {
  id: string
  title: string
  category: string
  date: string
  type: string
  url: string
  videoUrl?: string
  description: string
  price: number
  dorsal?: string
  highResUrl?: string
}

interface Order {
  id: string
  clientName: string
  phone: string
  videoPass: boolean
  photoCount: number
  selectedPhotoIds?: string[]
  selectedEvents: string[]
  notes: string
  total: number
  status: string
  paymentMethod?: string
  paymentStatus?: string
  createdAt: string
}

interface ContactMessage {
  id: string
  name: string
  phone: string
  message: string
  createdAt: string
}

// Initial Sample Gallery Items with Photos and Video Previews
const initialGallery: GalleryItem[] = [
  {
    id: 'g-test-2',
    title: 'Desfile y Abanderado con la Bandera del Tigre (Dorsal #15)',
    category: 'desfiles',
    date: '15 de Septiembre',
    type: 'photo',
    url: '/static/photos/sample_foto_2.webp',
    description: 'Jóvenes y participantes ondeando con orgullo la bandera de "El Tigre" durante el recorrido por San Pedro Lagunillas.',
    price: 30,
    dorsal: '15'
  },
  {
    id: 'g-test-3',
    title: 'Contingente con Bandera Roja de El Tigre (Dorsal #22)',
    category: 'desfiles',
    date: '15 de Septiembre',
    type: 'photo',
    url: '/static/photos/sample_foto_3.webp',
    description: 'Entusiasmo y tradición mexicana en el desfile de las Fiestas Patrias con los colores de El Tigre.',
    price: 30,
    dorsal: '22'
  },
  {
    id: 'g-test-4',
    title: 'Fotografía Nocturna - Asistente en Chamarra Negra (Dorsal #50)',
    category: 'bailes',
    date: '16 de Septiembre',
    type: 'photo',
    url: '/static/photos/sample_foto_4.webp',
    description: 'Retrato nocturno capturado durante la ambientación de los eventos y bailes de las Fiestas Patrias.',
    price: 30,
    dorsal: '50'
  },
  {
    id: 'g1',
    title: 'La Gran Topadera - Toro de Remnombre (Dorsal #12)',
    category: 'topaderas',
    date: '16 de Septiembre',
    type: 'photo',
    url: '/static/photos/h17final25.webp',
    description: 'Captura congelada a alta velocidad en el momento de mayor adrenalina en el ruedo. Jinete con dorsal #12.',
    price: 30,
    dorsal: '12'
  },
  {
    id: 'g-test-1',
    title: 'Fotografía de Prueba / Asistente Fiestas Patrias (Dorsal #88)',
    category: 'desfiles',
    date: '15 de Septiembre',
    type: 'photo',
    url: '/static/photos/sample_foto_1.webp',
    description: 'Retrato de prueba capturado durante la cobertura de las Fiestas Patrias en San Pedro Lagunillas, Nayarit.',
    price: 30,
    dorsal: '88'
  },
  {
    id: 'g2',
    title: 'Cabalgata Charra en las Calles (Dorsal #45)',
    category: 'cabalgatas',
    date: '14 de Septiembre',
    type: 'photo',
    url: '/static/photos/h18final249.webp',
    description: 'Jinetes con atuendo tradicional saludando al pueblo de San Pedro Lagunillas. Participante #45.',
    price: 30,
    dorsal: '45'
  },
  {
    id: 'g3',
    title: 'Castillo y Fuegos Artificiales - Noche del Grito',
    category: 'grito',
    date: '15 de Septiembre',
    type: 'photo',
    url: '/static/photos/h18final249.webp',
    description: 'Luces multicolores iluminando el cielo y la plaza cívica en la noche patria.',
    price: 50,
    dorsal: 'Grito2026'
  },
  {
    id: 'g4',
    title: 'Monta Estelar en Jaripeo Ranchero (Dorsal #08)',
    category: 'topaderas',
    date: '17 de Septiembre',
    type: 'photo',
    url: '/static/photos/h18final266.webp',
    description: 'El coraje del jinete cara a cara contra el toro en la plaza de San Pedro. Jinete #08.',
    price: 50,
    dorsal: '08'
  },
  {
    id: 'g5',
    title: 'Desfile de Antorchas Nocturno (Dorsal #101)',
    category: 'desfiles',
    date: '10 de Septiembre',
    type: 'photo',
    url: '/static/photos/v18final194.webp',
    description: 'El brillo del fuego y la algarabía en la noche de apertura de festejos. Contingente #101.',
    price: 50,
    dorsal: '101'
  },
  {
    id: 'g6',
    title: 'Vestidos Típicos y Reinas de la Fiesta',
    category: 'grito',
    date: '15 de Septiembre',
    type: 'photo',
    url: '/static/photos/grito25final616.webp',
    description: 'Elegancia, bordados tradicionales y sonrisas en la velada patria.',
    price: 50,
    dorsal: 'Reinas'
  },
  {
    id: 'g7',
    title: 'Banda en Vivo y Gran Baile Popular',
    category: 'bailes',
    date: '17 de Septiembre',
    type: 'photo',
    url: '/static/photos/grito25final759.webp',
    description: 'La música retumbando en el baile popular con ambiente festivo inolvidable.',
    price: 50,
    dorsal: 'Baile'
  },
  {
    id: 'v1',
    title: 'Video Vista Previa: Gran Topadera de Cierre',
    category: 'videos',
    date: 'Última Topadera',
    type: 'video',
    url: '/static/video/vueno.mp4',
    videoUrl: '/static/video/vueno.mp4',
    description: 'Fragmento de la toma de acción en el ruedo. Incluido en el Paquete Completo de $600 MXN.',
    price: 600,
    dorsal: 'VideoPass'
  },
  {
    id: 'v2',
    title: 'Video Vista Previa: Noche del Grito y Pirotecnia',
    category: 'videos',
    date: '15 de Septiembre',
    type: 'video',
    url: '/static/photos/h18final249.webp',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fireworks-in-the-sky-4144-large.mp4',
    description: 'Captura aérea en video del castillo y fuegos de la noche mexicana. Incluido en Paquete $600.',
    price: 600,
    dorsal: 'VideoPass'
  },
  {
    id: 'v3',
    title: 'Video Vista Previa: Baile Popular y Celebración',
    category: 'videos',
    date: '17 de Septiembre',
    type: 'video',
    url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    videoUrl: '/static/video/vueno.mp4',
    description: 'Ambiente en vivo del baile popular en la plaza. Incluido en Paquete $600.',
    price: 600,
    dorsal: 'VideoPass'
  }
]

const memoryGallery: GalleryItem[] = [...initialGallery]

const memoryOrders: Order[] = [
  {
    id: 'TIG-1001',
    clientName: 'Don José Ramos',
    phone: '3111234567',
    videoPass: true,
    photoCount: 4,
    selectedEvents: ['Topaderas y Jaripeos', 'Noche del Grito'],
    notes: 'Busco las fotos de la cabalgata del 14 a caballo bayo (Dorsal #45)',
    total: 800,
    status: 'Pagado (Mercado Pago)',
    paymentMethod: 'Mercado Pago',
    paymentStatus: 'Aprobado',
    createdAt: new Date().toISOString()
  }
]

const memoryContacts: ContactMessage[] = []

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './public' }))

// Helper for D1 initialization table if DB available
async function initD1Tables(db: D1Database) {
  try {
    // Tabla para galería de fotos y videos
    await db.prepare(`
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
      )
    `).run();

    // Tabla para pedidos
    await db.prepare(`
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
      )
    `).run();

    // Tabla para mensajes de contacto
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Índices para optimizar consultas
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category)
    `).run();
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_gallery_dorsal ON gallery(dorsal)
    `).run();
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_gallery_date ON gallery(date)
    `).run();
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_gallery_type ON gallery(type)
    `).run();
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)
    `).run();
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)
    `).run();
  } catch (err) {
    console.error('D1 Table Init error:', err);
  }
}

// API Routes

// Get Fiestas Patrias Program / Events
app.get('/api/events', (c) => {
  const events = [
    {
      id: 'e1',
      date: '10 de Septiembre',
      title: 'Entrada de la Música y Desfile de Antorchas',
      description: 'Gran arranque festivo por las principales calles de San Pedro Lagunillas con bandas en vivo y desfile nocturno.',
      tag: 'Apertura',
      badge: 'Cobertura en Foto y Video'
    },
    {
      id: 'e2',
      date: '11 de Septiembre',
      title: 'Inauguración Oficial y Primer Baile',
      description: 'Corte de listón, ambientación folclórica y baile popular en la plaza principal.',
      tag: 'Tradición',
      badge: 'Cobertura Completa'
    },
    {
      id: 'e3',
      date: '12 de Septiembre',
      title: 'Regatas y Eventos en la Laguna de San Pedro',
      description: 'Espectáculo acuático, deportistas locales, puestos gastronómicos e itinerario familiar.',
      tag: 'Laguna',
      badge: 'Fotos HD Disponibles'
    },
    {
      id: 'e4',
      date: '13 de Septiembre',
      title: 'Homenaje a los Niños Héroes y Cabalgata',
      description: 'Acto cívico con autoridades y la tradicional cabalgata de jinetes por el pueblo.',
      tag: 'Cabalgata',
      badge: 'Video y Fotos Personalizadas'
    },
    {
      id: 'e5',
      date: '14 de Septiembre',
      title: 'Día del Charro y Coleadero Tradicional',
      description: 'Destreza charra en el Lienzo Charro, suertes de soga y ambiente 100% Nayarita.',
      tag: 'Charrería',
      badge: 'Captura de Acción HD'
    },
    {
      id: 'e6',
      date: '15 de Septiembre',
      title: 'Coronación de la Reina, Noche Mexicana y Grito',
      description: 'Magna fiesta mexicana, fuegos artificiales, castillo, música de mariachi y la emoción del Grito de Independencia.',
      tag: 'Noche Gala',
      badge: 'Imperdible - Video $600'
    },
    {
      id: 'e7',
      date: '16 de Septiembre',
      title: 'Desfile Cívico y Primera Gran Topadera',
      description: 'Desfile escolar y charro por la mañana; por la tarde, la esperada y brava Topadera con toros de renombre.',
      tag: 'Topadera',
      badge: 'Tomas Clave e Impactantes'
    },
    {
      id: 'e8',
      date: '17 de Septiembre',
      title: 'Jaripeo de Gala y Baile Estelar',
      description: 'Montas de alto riesgo, cuadrillas de jineteo y gran baile nocturno con agrupación estelar.',
      tag: 'Jaripeo',
      badge: 'Acción Lenta y Foto $50'
    },
    {
      id: 'e9',
      date: 'Última Topadera',
      title: 'La Tradicional Gran Topadera de Cierre',
      description: 'El broche de oro de las Fiestas Patrias. Valentía en la maza, torazos y la despedida del pueblo unido.',
      tag: 'Cierre',
      badge: 'Incluido en Paquete $600'
    }
  ]
  return c.json({ success: true, events })
})

// Get Sample Photos/Videos Gallery with D1 / Memory Support + Search by Dorsal or Tag
app.get('/api/gallery', async (c) => {
  const queryDorsal = c.req.query('dorsal')?.toLowerCase().trim()
  const querySearch = c.req.query('search')?.toLowerCase().trim()
  const queryCategory = c.req.query('category')?.toLowerCase().trim()
  const queryType = c.req.query('type')?.toLowerCase().trim()

  let items: GalleryItem[] = []

  // Check Cloudflare D1 Database if available
  if (c.env.DB) {
    try {
      await initD1Tables(c.env.DB)

      // Build SQL query with filters
      let sql = 'SELECT * FROM gallery'
      const conditions: string[] = []
      const params: any[] = []

      if (queryCategory && queryCategory !== 'all') {
        conditions.push('category = ?')
        params.push(queryCategory)
      }
      if (queryType) {
        conditions.push('type = ?')
        params.push(queryType)
      }
      if (queryDorsal) {
        conditions.push('dorsal LIKE ?')
        params.push(`%${queryDorsal}%`)
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ')
      }

      sql += ' ORDER BY created_at DESC'

      const { results } = await c.env.DB.prepare(sql).all<any>(...params)
      if (results && results.length > 0) {
        items = results.map(row => ({
          id: row.id,
          title: row.title,
          category: row.category,
          date: row.date,
          type: row.type,
          url: row.url,
          videoUrl: row.video_url || '',
          description: row.description || '',
          price: Number(row.price),
          dorsal: row.dorsal || '',
          highResUrl: row.high_res_url || ''
        }))
      }
    } catch (e) {
      console.error('D1 query error:', e)
    }
  }

  // Fallback to memory gallery if D1 empty or unavailable
  if (items.length === 0) {
    items = memoryGallery
  }

  // Apply filters if provided
  if (queryDorsal) {
    items = items.filter(item => item.dorsal && item.dorsal.toLowerCase().includes(queryDorsal))
  }

  if (queryCategory && queryCategory !== 'all') {
    items = items.filter(item => item.category.toLowerCase() === queryCategory)
  }

  if (queryType) {
    items = items.filter(item => item.type.toLowerCase() === queryType)
  }

  if (querySearch) {
    items = items.filter(item =>
      item.title.toLowerCase().includes(querySearch) ||
      item.description.toLowerCase().includes(querySearch) ||
      (item.dorsal && item.dorsal.toLowerCase().includes(querySearch)) ||
      item.date.toLowerCase().includes(querySearch)
    )
  }

  return c.json({ success: true, gallery: items, count: items.length })
})

// Admin Login Endpoint
app.post('/api/admin/login', async (c) => {
  const body = await c.req.json()
  const password = body.password

  if (password === 'tigre2026' || password === 'eltigre2026') {
    return c.json({
      success: true,
      token: 'admin-token-eltigre-2026',
      message: '¡Bienvenido al Panel de Administración de Fotografías El Tigre!'
    })
  }

  return c.json({ success: false, error: 'Contraseña de administrador incorrecta.' }, 401)
})

// Photographer Direct Upload Photo/Video Endpoint (Admin Panel)
app.post('/api/admin/upload', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const body = await c.req.json()

    const { password, title, category, date, type, url, videoUrl, description, price, dorsal, highResUrl } = body

    if (password !== 'tigre2026' && password !== 'eltigre2026' && authHeader !== 'Bearer admin-token-eltigre-2026') {
      return c.json({ success: false, error: 'Acceso no autorizado' }, 401)
    }

    if (!title || !url || !price) {
      return c.json({ success: false, error: 'Título, URL y Precio son obligatorios' }, 400)
    }

    const newItem: GalleryItem = {
      id: `g-${Date.now().toString().slice(-6)}`,
      title: String(title).trim(),
      category: String(category || 'general').trim(),
      date: String(date || 'Fiestas Patrias 2026').trim(),
      type: String(type || 'photo').trim(),
      url: String(url).trim(),
      videoUrl: String(videoUrl || '').trim(),
      description: String(description || '').trim(),
      price: Number(price) || 50,
      dorsal: String(dorsal || '').trim(),
      highResUrl: String(highResUrl || url).trim()
    }

    // Save to D1 if available
    if (c.env.DB) {
      try {
        await initD1Tables(c.env.DB)
        await c.env.DB.prepare(`
          INSERT INTO gallery (id, title, category, date, type, url, video_url, description, price, dorsal, high_res_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          newItem.id, newItem.title, newItem.category, newItem.date,
          newItem.type, newItem.url, newItem.videoUrl || '', newItem.description, newItem.price,
          newItem.dorsal, newItem.highResUrl
        ).run()
      } catch (err) {
        console.error('D1 Save error:', err)
      }
    }

    // Always keep in memory gallery
    memoryGallery.unshift(newItem)

    return c.json({
      success: true,
      message: '¡Foto / Video publicado exitosamente en la galería de El Tigre!',
      item: newItem
    })
  } catch (err: any) {
    return c.json({ success: false, error: 'Error procesando subida: ' + err.message }, 500)
  }
})

// Public endpoint to register a photo in D1 database (for upload server integration)
// This allows the Node.js upload server to register photos in D1
app.post('/api/gallery/register', async (c) => {
  try {
    const body = await c.req.json()
    const {
      fileName,
      url,
      title,
      category = 'general',
      date = 'Fiestas Patrias 2026',
      type = 'photo',
      description = '',
      price = 50,
      dorsal = '',
      videoUrl = '',
      highResUrl = '',
      uploadPassword = ''
    } = body

    // Optional authentication for public registration
    // If uploadPassword is provided, check it; otherwise allow public registration
    if (uploadPassword && uploadPassword !== 'tigre2026' && uploadPassword !== 'eltigre2026') {
      return c.json({ success: false, error: 'Contraseña incorrecta' }, 401)
    }

    if (!fileName || !url) {
      return c.json({ success: false, error: 'fileName y url son obligatorios' }, 400)
    }

    const newItem: GalleryItem = {
      id: fileName || `g-${Date.now().toString().slice(-6)}`,
      title: String(title || fileName).trim(),
      category: String(category).trim(),
      date: String(date).trim(),
      type: String(type).trim(),
      url: String(url).trim(),
      videoUrl: String(videoUrl || '').trim(),
      description: String(description || '').trim(),
      price: Number(price) || 50,
      dorsal: String(dorsal || '').trim(),
      highResUrl: String(highResUrl || url).trim()
    }

    // Save to D1 if available
    if (c.env.DB) {
      try {
        await initD1Tables(c.env.DB)
        await c.env.DB.prepare(`
          INSERT INTO gallery (id, title, category, date, type, url, video_url, description, price, dorsal, high_res_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          newItem.id, newItem.title, newItem.category, newItem.date,
          newItem.type, newItem.url, newItem.videoUrl || '', newItem.description, newItem.price,
          newItem.dorsal, newItem.highResUrl
        ).run()

        console.log(`✅ Foto registrada en D1: ${newItem.id}`)
      } catch (err) {
        console.error('D1 gallery register error:', err)
        // Try update if already exists
        try {
          await c.env.DB.prepare(`
            UPDATE gallery
            SET title = ?, category = ?, date = ?, type = ?, url = ?, video_url = ?,
                description = ?, price = ?, dorsal = ?, high_res_url = ?
            WHERE id = ?
          `).bind(
            newItem.title, newItem.category, newItem.date, newItem.type, newItem.url,
            newItem.videoUrl || '', newItem.description, newItem.price, newItem.dorsal,
            newItem.highResUrl, newItem.id
          ).run()
          console.log(`🔄 Foto actualizada en D1: ${newItem.id}`)
        } catch (updateErr) {
          console.error('D1 gallery update error:', updateErr)
        }
      }
    }

    // Also keep in memory for development
    const existingIndex = memoryGallery.findIndex(g => g.id === newItem.id)
    if (existingIndex >= 0) {
      memoryGallery[existingIndex] = newItem
    } else {
      memoryGallery.unshift(newItem)
    }

    return c.json({
      success: true,
      message: 'Foto registrada correctamente en la base de datos',
      item: newItem
    })
  } catch (err: any) {
    return c.json({ success: false, error: 'Error al registrar la foto: ' + err.message }, 500)
  }
})

// Get single photo from gallery by ID
app.get('/api/gallery/:id', async (c) => {
  const id = c.req.param('id')

  let item: GalleryItem | null = null

  if (c.env.DB) {
    try {
      await initD1Tables(c.env.DB)
      const { results } = await c.env.DB.prepare('SELECT * FROM gallery WHERE id = ?').bind(id).all<any>()
      if (results && results.length > 0) {
        const row = results[0]
        item = {
          id: row.id,
          title: row.title,
          category: row.category,
          date: row.date,
          type: row.type,
          url: row.url,
          videoUrl: row.video_url || '',
          description: row.description || '',
          price: Number(row.price),
          dorsal: row.dorsal || '',
          highResUrl: row.high_res_url || ''
        }
      }
    } catch (e) {
      console.error('D1 gallery get error:', e)
    }
  }

  if (!item) {
    item = memoryGallery.find(g => g.id === id) || null
  }

  if (!item) {
    return c.json({ success: false, error: 'Foto no encontrada' }, 404)
  }

  return c.json({ success: true, photo: item })
})

// Mercado Pago Payment Gateway Preference Generator
app.post('/api/payment/mercadopago', async (c) => {
  try {
    const body = await c.req.json()
    const { orderId, clientName, phone, videoPass, photoCount, selectedPhotoIds, total } = body

    if (!total || total <= 0) {
      return c.json({ success: false, error: 'Monto total inválido' }, 400)
    }

    const preferenceId = `MP-TIGRE-${Math.floor(100000 + Math.random() * 900000)}`
    const initPoint = `https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=${preferenceId}`

    return c.json({
      success: true,
      preferenceId,
      initPoint,
      message: 'Checkout de Mercado Pago generado correctamente.'
    })
  } catch (err: any) {
    return c.json({ success: false, error: 'Error al generar pago en Mercado Pago: ' + err.message }, 500)
  }
})

// Orders Endpoint
app.post('/api/orders', async (c) => {
  try {
    const body = await c.req.json()
    const { clientName, phone, videoPass, photoCount, selectedPhotoIds, selectedEvents, notes, paymentMethod } = body

    if (!clientName || !phone) {
      return c.json({ success: false, error: 'Por favor ingrese su nombre y teléfono' }, 400)
    }

    const count = Number(photoCount) || (Array.isArray(selectedPhotoIds) ? selectedPhotoIds.length : 0)
    const calculatedTotal = (videoPass ? 600 : 0) + count * 50

    const newOrder: Order = {
      id: `TIG-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: String(clientName).trim(),
      phone: String(phone).trim(),
      videoPass: Boolean(videoPass),
      photoCount: count,
      selectedPhotoIds: Array.isArray(selectedPhotoIds) ? selectedPhotoIds : [],
      selectedEvents: Array.isArray(selectedEvents) ? selectedEvents : [],
      notes: String(notes || '').trim(),
      total: calculatedTotal,
      status: paymentMethod === 'Mercado Pago' ? 'Pendiente Pago MP' : 'Registrada',
      paymentMethod: paymentMethod || 'Efectivo / WhatsApp',
      paymentStatus: paymentMethod === 'Mercado Pago' ? 'Esperando Pago' : 'Pendiente',
      createdAt: new Date().toISOString()
    }

    // Save to D1 if available
    if (c.env.DB) {
      try {
        await initD1Tables(c.env.DB)
        await c.env.DB.prepare(`
          INSERT INTO orders (id, client_name, phone, video_pass, photo_count, selected_photo_ids, selected_events, notes, total, status, payment_method, payment_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          newOrder.id, newOrder.clientName, newOrder.phone,
          newOrder.videoPass ? 1 : 0, newOrder.photoCount,
          JSON.stringify(newOrder.selectedPhotoIds),
          JSON.stringify(newOrder.selectedEvents), newOrder.notes,
          newOrder.total, newOrder.status, newOrder.paymentMethod, newOrder.paymentStatus
        ).run()
      } catch (err) {
        console.error('D1 Order save error:', err)
      }
    }

    memoryOrders.unshift(newOrder)

    return c.json({
      success: true,
      message: '¡Solicitud registrada con éxito en el sistema de Fotografías El Tigre!',
      order: newOrder
    })
  } catch (err: any) {
    return c.json({ success: false, error: 'Error procesando la solicitud: ' + err.message }, 500)
  }
})

// Get Orders Endpoint
app.get('/api/orders', async (c) => {
  let orders = memoryOrders
  if (c.env.DB) {
    try {
      await initD1Tables(c.env.DB)
      const { results } = await c.env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC').all<any>()
      if (results && results.length > 0) {
        orders = results.map(row => ({
          id: row.id,
          clientName: row.client_name,
          phone: row.phone,
          videoPass: Boolean(row.video_pass),
          photoCount: Number(row.photo_count),
          selectedPhotoIds: row.selected_photo_ids ? JSON.parse(row.selected_photo_ids) : [],
          selectedEvents: row.selected_events ? JSON.parse(row.selected_events) : [],
          notes: row.notes || '',
          total: Number(row.total),
          status: row.status,
          paymentMethod: row.payment_method || 'Efectivo',
          paymentStatus: row.payment_status || 'Pendiente',
          createdAt: row.created_at
        }))
      }
    } catch (e) {
      console.error('D1 orders read error:', e)
    }
  }
  return c.json({ success: true, orders })
})

// Contact Form Endpoint
app.post('/api/contact', async (c) => {
  try {
    const body = await c.req.json()
    const { name, phone, message } = body

    if (!name || !phone || !message) {
      return c.json({ success: false, error: 'Todos los campos son obligatorios' }, 400)
    }

    const msg: ContactMessage = {
      id: `MSG-${Date.now().toString().slice(-4)}`,
      name: String(name).trim(),
      phone: String(phone).trim(),
      message: String(message).trim(),
      createdAt: new Date().toISOString()
    }

    // Save to D1 if available
    if (c.env.DB) {
      try {
        await initD1Tables(c.env.DB)
        await c.env.DB.prepare(`
          INSERT INTO contact_messages (id, name, phone, message)
          VALUES (?, ?, ?, ?)
        `).bind(msg.id, msg.name, msg.phone, msg.message).run()
      } catch (err) {
        console.error('D1 contact save error:', err)
      }
    }

    memoryContacts.unshift(msg)

    return c.json({
      success: true,
      message: 'Mensaje recibido correctamente. Nos pondremos en contacto contigo a la brevedad.'
    })
  } catch (err: any) {
    return c.json({ success: false, error: 'Error procesando mensaje' }, 500)
  }
})

// Dedicated Checkbox Selection Page Render ('/seleccionar')
app.get('/seleccionar', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="es-ES" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Seleccionar Fotos con Checkbox | Fotografías El Tigre</title>
    <meta name="description" content="Página de selección masiva de fotos con checkboxes para las Fiestas Patrias de San Pedro Lagunillas. Elige tus fotos $50 c/u o el paquete de videos $600.">
    <link rel="icon" type="image/jpeg" href="${LOCAL_LOGO_URL}">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="/static/styles.css" rel="stylesheet">
</head>
<body class="bg-slate-950 text-slate-100 font-sans min-h-screen flex flex-col pb-32">

    <!-- NAVBAR -->
    <header class="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-amber-900/40 shadow-xl">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <a href="/" class="flex items-center gap-3 group">
                <img src="${LOCAL_LOGO_URL}" alt="Logo El Tigre" class="w-12 h-12 rounded-full border-2 border-amber-400 object-cover shadow-lg">
                <div>
                    <span class="font-serif font-black text-xl text-amber-400">FOTOGRAFÍAS EL TIGRE</span>
                    <span class="text-xs text-slate-400 block">Selección Masiva de Fotos (Checkbox)</span>
                </div>
            </a>
            <div class="flex items-center gap-3">
                <a href="/" class="text-xs text-amber-400 hover:underline font-bold"><i class="fa-solid fa-arrow-left mr-1"></i> Volver al Inicio</a>
                <a href="https://wa.me/523118470860" target="_blank" class="bg-emerald-600 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1">
                    <i class="fa-brands fa-whatsapp"></i> 311 847 0860
                </a>
            </div>
        </div>
    </header>

    <!-- HEADER TITLE & CONTROLS -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-grow space-y-6">
        <div class="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-4 text-center">
            <span class="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-black px-3 py-1 rounded-full uppercase">
                <i class="fa-solid fa-square-check mr-1"></i> Selección por Casillas (Checkbox)
            </span>
            <h1 class="font-serif font-black text-3xl sm:text-5xl text-white">Elige tus Fotos con Checkbox</h1>
            <p class="text-slate-300 text-sm max-w-2xl mx-auto">
                Marca la casilla de cada foto que desees incluir en tu pedido ($50 MXN c/u). En la barra inferior verás la cotización en tiempo real para enviarla por WhatsApp o pagar por Mercado Pago.
            </p>

            <!-- SEARCH AND FILTER BAR -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
                <div class="w-full sm:w-auto flex items-center gap-2">
                    <input type="text" id="selection-search" oninput="filterSelectionGrid()" placeholder="Buscar por dorsal (#12, #45) o evento..." class="bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-white w-full sm:w-64">
                    <button onclick="filterSelectionGrid()" class="bg-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                </div>

                <div class="flex items-center gap-2 flex-wrap text-xs">
                    <button onclick="selectAllPhotos(true)" class="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-3 py-2 rounded-xl border border-amber-500/30">
                        <i class="fa-solid fa-check-double mr-1"></i> Seleccionar Todas
                    </button>
                    <button onclick="selectAllPhotos(false)" class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl border border-slate-700">
                        <i class="fa-solid fa-xmark mr-1"></i> Desmarcar Todas
                    </button>
                </div>
            </div>
        </div>

        <!-- PHOTO CHECKBOX GRID -->
        <div id="selection-photos-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <!-- Dynamically populated via JS -->
            <div class="col-span-full text-center py-12 text-slate-400">
                <i class="fa-solid fa-spinner fa-spin text-3xl text-amber-400 mb-2"></i>
                <p>Cargando fotos para selección...</p>
            </div>
        </div>
    </main>

    <!-- FLOATING BOTTOM SELECTION BAR -->
    <div class="fixed bottom-0 inset-x-0 z-50 bg-slate-950/95 border-t-2 border-amber-500/60 p-4 backdrop-blur-xl shadow-2xl">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

            <div class="flex items-center gap-6 flex-wrap justify-center md:justify-start">
                <div>
                    <span class="text-xs text-slate-400 uppercase font-bold block">Fotos Seleccionadas:</span>
                    <span id="selected-count-badge" class="text-2xl font-black text-amber-400">0 fotos</span>
                </div>

                <div class="border-l border-slate-800 pl-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" id="selection-video-pass-check" onchange="toggleSelectionVideoPass()" class="w-5 h-5 accent-amber-500 rounded">
                        <div>
                            <span class="font-bold text-white text-xs block">Agregar Paquete de Video ($600)</span>
                            <span class="text-[10px] text-slate-400">Todos los días (10 sep - última topadera)</span>
                        </div>
                    </label>
                </div>

                <div class="border-l border-slate-800 pl-4">
                    <span class="text-xs text-slate-400 uppercase font-bold block">Total a Pagar:</span>
                    <span id="selection-total-price" class="text-3xl font-black text-emerald-400">$0 MXN</span>
                </div>
            </div>

            <!-- ACTION BUTTONS -->
            <div class="flex items-center gap-3 w-full md:w-auto">
                <button onclick="sendBatchWhatsAppOrder()" class="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 text-xs sm:text-sm flex items-center justify-center gap-2">
                    <i class="fa-brands fa-whatsapp text-lg"></i>
                    <span>Enviar Selección a WhatsApp</span>
                </button>

                <button onclick="payBatchMercadoPago()" class="flex-1 md:flex-initial bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-6 py-3.5 rounded-xl shadow-lg shadow-amber-500/20 text-xs sm:text-sm flex items-center justify-center gap-2">
                    <i class="fa-solid fa-credit-card"></i>
                    <span>Pagar con Mercado Pago</span>
                </button>
            </div>
        </div>
    </div>

    <!-- SCRIPT -->
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
</body>
</html>
  `)
})

// Main Page Render ('/')
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="es-ES" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fotografías El Tigre | Fiestas Patrias San Pedro Lagunillas Nayarit</title>
    <meta name="description" content="Venta de videos y fotos personalizadas de las Fiestas Patrias de San Pedro Lagunillas, Nayarit. Paquete de videos completos $600 y fotos HD $50. Informes en Carpintería El Tigre o al 3118470860.">
    <!-- Local Favicon / Logo Icon -->
    <link rel="icon" type="image/jpeg" href="${LOCAL_LOGO_URL}">
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Font Awesome -->
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- Custom CSS -->
    <link href="/static/styles.css" rel="stylesheet">
</head>
<body class="bg-amber-950/20 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-900 min-h-screen flex flex-col">

    <!-- TOP ANNOUNCEMENT BAR -->
    <div class="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-slate-950 font-bold text-xs md:text-sm py-2 px-4 text-center shadow-lg relative z-50 flex items-center justify-center gap-2 flex-wrap">
        <span><img src="${LOCAL_LOGO_URL}" alt="El Tigre Logo" class="w-6 h-6 inline-block rounded-full border border-slate-950 mr-1 object-cover"> <strong>FOTOGRAFÍAS "EL TIGRE"</strong> — Cobertura Oficial Fiestas Patrias San Pedro Lagunillas 2026</span>
        <span class="bg-slate-950 text-amber-400 px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wider font-extrabold ml-2">Del 10 Sep a la Última Topadera</span>
        <a href="#cotizador" class="underline hover:text-slate-900 transition-colors font-extrabold ml-2"><i class="fa-solid fa-ticket mr-1"></i>¡Apártalo Ya!</a>
    </div>

    <!-- MAIN NAVBAR -->
    <header class="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-amber-900/40 transition-all shadow-xl" id="navbar">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

            <!-- BRAND LOGO -->
            <a href="#" class="flex items-center gap-3 group">
                <div class="w-14 h-14 rounded-full p-0.5 bg-gradient-to-br from-amber-400 via-amber-500 to-red-600 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform overflow-hidden">
                    <img src="${LOCAL_LOGO_URL}" alt="Fotografías El Tigre" class="w-full h-full object-cover rounded-full">
                </div>
                <div>
                    <span class="font-serif font-black text-xl md:text-2xl text-amber-400 tracking-wide block leading-tight group-hover:text-amber-300 transition-colors">FOTOGRAFÍAS EL TIGRE</span>
                    <span class="text-xs text-amber-200/80 font-medium tracking-wider uppercase block">Capturing Moments • Professional Photography</span>
                </div>
            </a>

            <!-- DESKTOP NAVIGATION -->
            <nav class="hidden md:flex items-center gap-5 font-medium text-sm text-slate-300">
                <a href="#inicio" class="hover:text-amber-400 transition-colors py-1">Inicio</a>
                <a href="#carrusel" class="hover:text-amber-400 transition-colors py-1">Carrusel</a>
                <a href="#videos-preview" class="hover:text-amber-400 transition-colors py-1">Videos Vistas</a>
                <a href="/seleccionar" class="bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-black px-3 py-1.5 rounded-xl border border-amber-500/40 transition-all flex items-center gap-1.5">
                    <i class="fa-solid fa-square-check"></i> Seleccionar Fotos (Checkbox)
                </a>
                <a href="#programa" class="hover:text-amber-400 transition-colors py-1">Programa</a>
                <a href="#ubicacion" class="hover:text-amber-400 transition-colors py-1">Ubicación</a>
            </nav>

            <!-- CALL TO ACTION & ADMIN PANEL BUTTON -->
            <div class="hidden sm:flex items-center gap-3">
                <button onclick="openAdminModal()" class="bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/40 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all">
                    <i class="fa-solid fa-user-gear"></i> Panel Fotógrafo
                </button>
                <a href="https://wa.me/523118470860?text=Hola%20Fotografías%20El%20Tigre,%20quiero%20informes%20sobre%20el%20paquete%20de%20videos%20y%20fotos" target="_blank" rel="noopener noreferrer" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 hover:scale-105 text-sm">
                    <i class="fa-brands fa-whatsapp text-lg"></i>
                    <span>311 847 0860</span>
                </a>
            </div>

            <!-- MOBILE MENU TOGGLE -->
            <button id="mobile-menu-btn" class="md:hidden text-amber-400 hover:text-amber-300 p-2 text-2xl focus:outline-none" aria-label="Abrir Menú">
                <i class="fa-solid fa-bars"></i>
            </button>
        </div>

        <!-- MOBILE MENU DROPDOWN -->
        <div id="mobile-menu" class="hidden md:hidden bg-slate-950 border-b border-amber-900/50 px-4 py-6 space-y-4">
            <a href="#inicio" class="block text-slate-200 hover:text-amber-400 font-semibold text-lg py-1 border-b border-slate-800">Inicio</a>
            <a href="#carrusel" class="block text-slate-200 hover:text-amber-400 font-semibold text-lg py-1 border-b border-slate-800">Carrusel de Fotos</a>
            <a href="#videos-preview" class="block text-slate-200 hover:text-amber-400 font-semibold text-lg py-1 border-b border-slate-800">Videos Vistas Automáticas</a>
            <a href="/seleccionar" class="block text-amber-400 hover:text-amber-300 font-black text-lg py-1 border-b border-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-square-check"></i> Seleccionar Fotos (Checkbox)
            </a>
            <a href="#programa" class="block text-slate-200 hover:text-amber-400 font-semibold text-lg py-1 border-b border-slate-800">Programa Fiestas Patrias</a>
            <a href="#ubicacion" class="block text-slate-200 hover:text-amber-400 font-semibold text-lg py-1 border-b border-slate-800">Carpintería El Tigre</a>
            <button onclick="openAdminModal()" class="w-full text-left text-amber-400 font-bold text-lg py-1 flex items-center gap-2">
                <i class="fa-solid fa-user-gear"></i> Panel Fotógrafo (Administrador)
            </button>

            <a href="https://wa.me/523118470860?text=Hola%20Fotografías%20El%20Tigre,%20quiero%20informes%20sobre%20el%20paquete%20de%20videos%20y%20fotos" target="_blank" class="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-center flex items-center justify-center gap-2">
                <i class="fa-brands fa-whatsapp text-xl"></i>
                <span>WhatsApp: 311 847 0860</span>
            </a>
        </div>
    </header>

    <!-- HERO SECTION -->
    <section id="inicio" class="relative min-h-[85vh] flex items-center justify-center overflow-hidden py-16 px-4">
        <div class="absolute inset-0 bg-cover bg-center z-0 scale-105 transition-transform duration-10000" style="background-image: url('https://sspark.genspark.ai/cfimages?u1=mBj7Ozk1Ln4xPrJskoVSCCg9yRkcd8Uu%2BZvQE5CvDui0kdEVg7AZuiCW00bZ6LOKrjwa58uW7dv%2BE9k8vdKVOmdYOtbvhAkeCVHGUZaMzYRh5PQSJMFn6I7h5JIKrnuPM6XZFJ48CK%2FMzbergMTN&u2=ncogNsHfvdNPLCB%2B&width=2560');">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/70"></div>
        </div>

        <div class="relative z-10 max-w-5xl mx-auto text-center space-y-8">

            <!-- OFFICIAL BRAND LOGO EMBED -->
            <div class="w-36 h-36 md:w-44 md:h-44 mx-auto rounded-full p-1 bg-gradient-to-br from-amber-400 via-amber-500 to-red-600 shadow-2xl shadow-amber-500/30 transform hover:scale-105 transition-all overflow-hidden">
                <img src="${LOCAL_LOGO_URL}" alt="Fotografías El Tigre Insignia Oficial" class="w-full h-full object-cover rounded-full bg-slate-950 border-2 border-slate-950">
            </div>

            <!-- BADGE -->
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 backdrop-blur-md text-xs sm:text-sm font-bold tracking-wide uppercase shadow-lg">
                <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <span>San Pedro Lagunillas, Nayarit — Cobertura Oficial</span>
            </div>

            <!-- MAIN TITLE -->
            <h1 class="font-serif text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-none">
                ¡Revive la Pasión de las <br class="hidden sm:inline">
                <span class="bg-gradient-to-r from-amber-300 via-amber-400 to-red-500 bg-clip-text text-transparent">Fiestas Patrias!</span>
            </h1>

            <p class="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
                Capturamos la adrenalina de las <strong>Topaderas</strong>, los jaripeos, desfiles, bailes y la emoción de cada día. <br class="hidden md:inline">
                Fotografía profesional y video HD por <strong>Fotografías "El Tigre"</strong>.
            </p>

	            <!-- OFFER PRICING HIGHLIGHT CARDS -->
	            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto pt-4 text-left">
	                <!-- CARD 1: DIGITAL PHOTO -->
	                <div class="bg-slate-900/90 border-2 border-slate-700 rounded-2xl p-4 shadow-2xl relative overflow-hidden group hover:border-amber-400 transition-all hover:-translate-y-1">
	                    <div class="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1"><i class="fa-solid fa-mobile-screen mr-1"></i> Formato Digital HD</div>
	                    <h3 class="font-serif font-black text-xl text-white">FOTO DIGITAL</h3>
	                    <p class="text-xs text-slate-400 mt-1">Archivo digital de alta resolución para celular.</p>
	                    <div class="mt-3 flex items-baseline gap-1">
	                        <span class="text-3xl font-black text-amber-400">$30</span>
	                        <span class="text-xs font-bold text-slate-300">MXN / foto</span>
	                    </div>
	                </div>

	                <!-- CARD 2: PHYSICAL PHOTO -->
	                <div class="bg-slate-900/90 border-2 border-slate-700 rounded-2xl p-4 shadow-2xl relative overflow-hidden group hover:border-amber-400 transition-all hover:-translate-y-1">
	                    <div class="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1"><i class="fa-solid fa-print mr-1"></i> Foto Impresa</div>
	                    <h3 class="font-serif font-black text-xl text-white">FOTO FÍSICA</h3>
	                    <p class="text-xs text-slate-400 mt-1">Impresión fotográfica física de alta calidad.</p>
	                    <div class="mt-3 flex items-baseline gap-1">
	                        <span class="text-3xl font-black text-amber-400">$50</span>
	                        <span class="text-xs font-bold text-slate-300">MXN / foto</span>
	                    </div>
	                </div>

	                <!-- CARD 3: CUSTOM FRAME PHOTO -->
	                <div class="bg-slate-900/90 border-2 border-amber-500/60 rounded-2xl p-4 shadow-2xl relative overflow-hidden group hover:border-amber-400 transition-all hover:-translate-y-1">
	                    <div class="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-bl-lg">
	                        NUEVO
	                    </div>
	                    <div class="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1"><i class="fa-solid fa-frame mr-1"></i> Edición Especial</div>
	                    <h3 class="font-serif font-black text-xl text-white">MARCO PERSONALIZADO</h3>
	                    <p class="text-xs text-slate-400 mt-1">Foto digital o impresa con marco conmemorativo El Tigre.</p>
	                    <div class="mt-3 flex items-baseline gap-1">
	                        <span class="text-3xl font-black text-amber-400">$70</span>
	                        <span class="text-xs font-bold text-slate-300">MXN / foto</span>
	                    </div>
	                </div>
	            </div>

            <!-- ACTION BUTTONS -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                <a href="/seleccionar" class="w-full sm:w-auto bg-gradient-to-r from-amber-500 via-amber-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black text-lg px-8 py-4 rounded-xl shadow-xl shadow-amber-500/25 transition-all transform hover:scale-105 flex items-center justify-center gap-3">
                    <i class="fa-solid fa-square-check text-xl"></i>
                    <span>Seleccionar Fotos con Checkbox ($50 c/u)</span>
                </a>
                <a href="#cotizador" class="w-full sm:w-auto bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-bold text-base px-6 py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                    <i class="fa-solid fa-cart-shopping"></i>
                    <span>Cotizador Rápido</span>
                </a>
            </div>
        </div>
    </section>

    <!-- CARRUSEL INTERACTIVO DE FOTOS -->
    <section id="carrusel" class="py-20 bg-slate-950 border-t border-amber-900/30 relative">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div class="text-center space-y-3">
                <span class="text-amber-400 font-extrabold uppercase text-xs tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                    <i class="fa-solid fa-images mr-1"></i> Galería Destacada
                </span>
                <h2 class="font-serif text-3xl sm:text-5xl font-black text-white">Carrusel Interactivo de Fotos</h2>
                <p class="text-slate-400 text-sm sm:text-base">Desliza para explorar las tomas más espectaculares de San Pedro Lagunillas.</p>
            </div>

            <!-- CAROUSEL WRAPPER -->
            <div class="relative bg-slate-900 border-2 border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl group">
                <!-- CAROUSEL TRACK -->
                <div id="carousel-track" class="flex transition-transform duration-500 ease-in-out">
                    <!-- Carousel Slides injected via JS -->
                </div>

                <!-- PREV / NEXT BUTTONS -->
                <button onclick="prevSlide()" class="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-950/80 hover:bg-amber-500 text-amber-400 hover:text-slate-950 w-12 h-12 rounded-full border border-amber-500/40 flex items-center justify-center text-xl font-bold transition-all shadow-lg z-20">
                    ❮
                </button>
                <button onclick="nextSlide()" class="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-950/80 hover:bg-amber-500 text-amber-400 hover:text-slate-950 w-12 h-12 rounded-full border border-amber-500/40 flex items-center justify-center text-xl font-bold transition-all shadow-lg z-20">
                    ❯
                </button>

                <!-- DOT INDICATORS -->
                <div id="carousel-dots" class="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2 z-20">
                    <!-- Dots injected via JS -->
                </div>
            </div>
        </div>
    </section>

    <!-- SECCIÓN DE VIDEOS CON VISTAS AUTOMÁTICAS (AUTOPLAY / PREVIEW) -->
    <section id="videos-preview" class="py-20 bg-slate-900/60 border-t border-amber-900/30 relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div class="text-center max-w-3xl mx-auto space-y-4">
                <span class="text-amber-400 font-extrabold uppercase text-xs tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                    <i class="fa-solid fa-circle-play mr-1"></i> Cobertura en Video HD
                </span>
                <h2 class="font-serif text-3xl sm:text-5xl font-black text-white">Vistas Automáticas de Video</h2>
                <p class="text-slate-300 text-base">
                    Observa la calidad y fluidez de nuestras filmaciones. Todos estos eventos están incluidos en el **Paquete Completo de Videos de $600 MXN** (del 10 de sep. a la última topadera).
                </p>
            </div>

            <!-- VIDEOS GRID WITH AUTOMATIC PLAYBACK PREVIEWS -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- VIDEO CARD 1 -->
                <div class="bg-slate-950 border-2 border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between group">
                    <div class="relative aspect-video bg-black overflow-hidden">
                        <video autoplay loop muted playsinline preload="auto" class="w-full h-full object-cover">
                            <source src="https://assets.mixkit.co/videos/preview/mixkit-horse-riding-in-a-ranch-41584-large.mp4" type="video/mp4">
                            <p class="text-white text-xs p-2">Video no disponible. <a href="https://assets.mixkit.co/videos/preview/mixkit-horse-riding-in-a-ranch-41584-large.mp4" class="text-amber-400 underline">Descargar video</a>.</p>
                        </video>
                        <div class="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full bg-white animate-ping"></span> Vista Previa HD
                        </div>
                        <div class="absolute bottom-3 right-3 bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-lg">
                            Paquete $600
                        </div>
                    </div>
                    <div class="p-6 space-y-3 flex-grow flex flex-col justify-between">
                        <div>
                            <h3 class="font-serif font-black text-xl text-white">Gran Topadera de Cierre</h3>
                            <p class="text-xs text-slate-400 mt-1">Acción continua en el ruedo, tomas de ángulo bajo y cámara lenta en las mejores montas.</p>
                        </div>
                        <a href="#cotizador" onclick="selectPackage('video')" class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-center text-xs block transition-all">
                            Incluir en Mi Pedido ($600)
                        </a>
                    </div>
                </div>

                <!-- VIDEO CARD 2 -->
                <div class="bg-slate-950 border-2 border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between group">
                    <div class="relative aspect-video bg-black overflow-hidden">
                        <video autoplay loop muted playsinline preload="auto" class="w-full h-full object-cover">
                            <source src="https://assets.mixkit.co/videos/preview/mixkit-fireworks-in-the-sky-4144-large.mp4" type="video/mp4">
                            <p class="text-white text-xs p-2">Video no disponible. <a href="https://assets.mixkit.co/videos/preview/mixkit-fireworks-in-the-sky-4144-large.mp4" class="text-amber-400 underline">Descargar video</a>.</p>
                        </video>
                        <div class="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full bg-white animate-ping"></span> Vista Previa HD
                        </div>
                        <div class="absolute bottom-3 right-3 bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-lg">
                            Paquete $600
                        </div>
                    </div>
                    <div class="p-6 space-y-3 flex-grow flex flex-col justify-between">
                        <div>
                            <h3 class="font-serif font-black text-xl text-white">Noche del Grito y Pirotecnia</h3>
                            <p class="text-xs text-slate-400 mt-1">Filmación nocturna de la plaza principal, fuegos artificiales, castillo y mariachi en vivo.</p>
                        </div>
                        <a href="#cotizador" onclick="selectPackage('video')" class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-center text-xs block transition-all">
                            Incluir en Mi Pedido ($600)
                        </a>
                    </div>
                </div>

                <!-- VIDEO CARD 3 -->
                <div class="bg-slate-950 border-2 border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between group">
                    <div class="relative aspect-video bg-black overflow-hidden">
                        <video autoplay loop muted playsinline preload="auto" class="w-full h-full object-cover">
                            <source src="https://assets.mixkit.co/videos/preview/mixkit-people-dancing-at-a-party-41527-large.mp4" type="video/mp4">
                            <p class="text-white text-xs p-2">Video no disponible. <a href="https://assets.mixkit.co/videos/preview/mixkit-people-dancing-at-a-party-41527-large.mp4" class="text-amber-400 underline">Descargar video</a>.</p>
                        </video>
                        <div class="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full bg-white animate-ping"></span> Vista Previa HD
                        </div>
                        <div class="absolute bottom-3 right-3 bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-lg">
                            Paquete $600
                        </div>
                    </div>
                    <div class="p-6 space-y-3 flex-grow flex flex-col justify-between">
                        <div>
                            <h3 class="font-serif font-black text-xl text-white">Bailes Populares y Alegría</h3>
                            <p class="text-xs text-slate-400 mt-1">El ambiente festivo de la gente de San Pedro Lagunillas celebrando sus tradiciones.</p>
                        </div>
                        <a href="#cotizador" onclick="selectPackage('video')" class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-center text-xs block transition-all">
                            Incluir en Mi Pedido ($600)
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- CALCULADOR Y COTIZADOR INTERACTIVO DE PEDIDOS -->
    <section id="cotizador" class="py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/30 relative">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="bg-slate-900/90 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                <div class="text-center space-y-3 mb-8">
                    <span class="text-amber-400 font-extrabold text-xs uppercase tracking-widest"><i class="fa-solid fa-calculator mr-1"></i> Calculador de Pedido Interactivo</span>
                    <h2 class="font-serif text-3xl sm:text-4xl font-black text-white">Haz Tu Pedido o Cotización en Segundos</h2>
                    <p class="text-slate-300 text-sm sm:text-base">Selecciona los productos de tu interés y elige si deseas pagar en efectivo/WhatsApp o con Mercado Pago.</p>
                </div>

                <form id="order-form" class="space-y-6">
                    <!-- CLIENT DETAILS -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">Tu Nombre Completo *</label>
                            <input type="text" id="client-name" required placeholder="Ej. Juan Pérez González" class="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">Teléfono / WhatsApp *</label>
                            <input type="tel" id="client-phone" required placeholder="Ej. 311 123 4567" class="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors">
                        </div>
                    </div>

                    <!-- PRODUCTS SELECTION -->
                    <div class="space-y-4 pt-4 border-t border-slate-800">
                        <h4 class="font-serif font-bold text-lg text-white flex items-center gap-2">
                            <i class="fa-solid fa-box-open text-amber-400"></i> Selecciona lo que deseas incluir:
                        </h4>

                        <!-- OPTION 1: VIDEO PASS -->
                        <label class="flex items-center justify-between p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all">
                            <div class="flex items-center gap-3">
                                <input type="checkbox" id="check-video-pass" class="w-5 h-5 accent-amber-500 rounded cursor-pointer">
                                <div>
                                    <div class="font-bold text-white text-sm sm:text-base">Paquete de Videos de Todos los Días</div>
                                    <div class="text-xs text-slate-400">Del 10 de sep. a la última topadera (Bailes, jaripeos, desfiles)</div>
                                </div>
                            </div>
                            <span class="font-black text-amber-400 text-lg sm:text-xl">$600 MXN</span>
                        </label>

                        <!-- OPTION 2: PHOTOS COUNT -->
                        <div class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-bold text-white text-sm sm:text-base">Fotos Individuales Personalizadas</div>
                                    <div class="text-xs text-slate-400">$50 MXN cada foto HD</div>
                                </div>
                                <div class="flex items-center gap-3 bg-slate-900 p-1.5 rounded-xl border border-slate-700">
                                    <button type="button" onclick="adjustPhotos(-1)" class="w-8 h-8 rounded-lg bg-slate-800 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-black text-lg transition-colors flex items-center justify-center">-</button>
                                    <span id="photo-count-display" class="font-black text-lg w-8 text-center text-white">0</span>
                                    <button type="button" onclick="adjustPhotos(1)" class="w-8 h-8 rounded-lg bg-slate-800 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-black text-lg transition-colors flex items-center justify-center">+</button>
                                </div>
                            </div>
                            <div class="text-xs text-amber-300/80 flex items-center justify-between">
                                <span>Subtotal Fotos: $<span id="photo-subtotal">0</span> MXN</span>
                                <a href="/seleccionar" class="text-amber-400 hover:underline font-bold"><i class="fa-solid fa-square-check mr-1"></i> O elegir fotos con casilla (checkbox) →</a>
                            </div>
                        </div>
                    </div>

                    <!-- PAYMENT METHOD SELECTION -->
                    <div class="space-y-3 pt-4 border-t border-slate-800">
                        <label class="block text-xs font-bold text-amber-300 uppercase tracking-wider">Método de Pago Preferido:</label>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <label class="flex items-center gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-amber-500/50">
                                <input type="radio" name="payment-method" value="WhatsApp / Efectivo" checked class="accent-amber-500 w-4 h-4">
                                <div>
                                    <div class="font-bold text-white">Efectivo / Carpintería El Tigre</div>
                                    <div class="text-[10px] text-slate-400">Pago en persona o al acordar por WhatsApp</div>
                                </div>
                            </label>
                            <label class="flex items-center gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-emerald-500/50">
                                <input type="radio" name="payment-method" value="Mercado Pago" class="accent-emerald-500 w-4 h-4">
                                <div>
                                    <div class="font-bold text-emerald-400"><i class="fa-solid fa-credit-card mr-1"></i> Mercado Pago (En línea)</div>
                                    <div class="text-[10px] text-slate-400">Tarjeta débito/crédito o transferencia para USA/Foráneos</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- NOTES / SPECIAL REQUEST -->
                    <div>
                        <label class="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">Número de Dorsal / Descripción de Fotos que Buscas:</label>
                        <textarea id="order-notes" rows="3" placeholder="Ej. Dorsal #12 de la topadera del 16, o foto a caballo bayo el día 14..." class="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl p-3 text-white text-sm focus:outline-none transition-colors"></textarea>
                    </div>

                    <!-- TOTAL DISPLAY -->
                    <div class="bg-gradient-to-r from-amber-500/20 via-red-500/20 to-amber-600/20 border border-amber-500/50 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                            <span class="text-xs text-slate-300 uppercase tracking-wider font-bold block">Total Estimado del Pedido:</span>
                            <span class="text-xs text-amber-300">Entregado en San Pedro Lagunillas o Digital</span>
                        </div>
                        <div class="text-right">
                            <span class="text-3xl sm:text-4xl font-black text-amber-400">$<span id="grand-total">0</span></span>
                            <span class="text-sm font-bold text-slate-300"> MXN</span>
                        </div>
                    </div>

                    <!-- ACTION BUTTONS -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button type="button" id="btn-send-whatsapp" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-4 px-6 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-base">
                            <i class="fa-brands fa-whatsapp text-2xl"></i>
                            <span>Enviar por WhatsApp (3118470860)</span>
                        </button>
                        <button type="submit" id="btn-save-online" class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-4 px-6 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-base">
                            <i class="fa-solid fa-credit-card"></i>
                            <span>Procesar Pedido / Mercado Pago</span>
                        </button>
                    </div>

                    <!-- ORDER RESPONSE NOTIFICATION -->
                    <div id="order-status-msg" class="hidden p-4 rounded-xl text-center text-sm font-bold"></div>
                </form>
            </div>
        </div>
    </section>

    <!-- PROGRAMA DE FIESTAS PATRIAS SAN PEDRO LAGUNILLAS -->
    <section id="programa" class="py-20 bg-slate-950 border-t border-amber-900/30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-16 space-y-4">
                <span class="text-amber-400 font-extrabold uppercase text-xs tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">Calendario Oficial de Cobertura</span>
                <h2 class="font-serif text-3xl sm:text-5xl font-black text-white">Programa de Fiestas Patrias</h2>
                <p class="text-slate-400 text-base">Del 10 de Septiembre hasta la última topadera. ¡Fotografías El Tigre estará presente en cada evento!</p>
            </div>

            <div id="events-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Dynamically populated via JS -->
            </div>
        </div>
    </section>

    <!-- MODAL MERCADO PAGO -->
    <div id="mercadopago-modal" class="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md hidden items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl relative text-center space-y-5">
            <button onclick="closeMpModal()" class="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold">✕</button>
            <div class="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl">
                <i class="fa-solid fa-credit-card"></i>
            </div>
            <h3 class="font-serif font-black text-2xl text-white">Mercado Pago Checkout</h3>
            <p class="text-slate-300 text-xs">Total a pagar: <strong id="mp-modal-total" class="text-amber-400 text-base">$0 MXN</strong></p>
            <div class="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
                <p class="font-bold text-amber-300">Enlace de Pago Seguro Creado:</p>
                <a id="mp-checkout-link" href="#" target="_blank" class="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 px-4 rounded-xl block text-sm shadow-md transition-all">
                    <i class="fa-solid fa-lock mr-1"></i> Ir a Pagar en Mercado Pago
                </a>
            </div>
            <p class="text-[11px] text-slate-400">Una vez completado el pago, envía tu comprobante al WhatsApp <strong>311 847 0860</strong> para recibir tu enlace de descarga en alta resolución.</p>
        </div>
    </div>

    <!-- MODAL SUBIDA FOTÓGRAFO (ADMIN PANEL) -->
    <div id="admin-modal" class="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md hidden items-center justify-center p-4 overflow-y-auto">
        <div class="max-w-2xl w-full bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6 my-8">
            <button onclick="closeAdminModal()" class="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold">✕</button>

            <div class="flex items-center gap-3 border-b border-slate-800 pb-4">
                <img src="${LOCAL_LOGO_URL}" alt="Logo" class="w-12 h-12 rounded-full border border-amber-400 object-cover">
                <div>
                    <h3 class="font-serif font-black text-2xl text-white">Panel de Administración El Tigre</h3>
                    <p class="text-xs text-amber-400">Subida directa de vistas previas de fotos y videos a Cloudflare D1</p>
                </div>
            </div>

            <!-- ADMIN LOGIN FORM -->
            <div id="admin-login-step" class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">Contraseña de Administrador:</label>
                    <input type="password" id="admin-pass-input" placeholder="Ingresa contraseña de acceso (tigre2026)" class="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-white text-sm focus:outline-none">
                </div>
                <button onclick="loginAdmin()" class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl transition-all text-sm">
                    Ingresar al Panel
                </button>
                <div id="admin-login-msg" class="hidden text-xs text-center font-bold"></div>
            </div>

            <!-- ADMIN UPLOAD PANEL -->
            <form id="admin-upload-form" class="hidden space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">Título de la Foto / Video *</label>
                        <input type="text" id="upload-title" required placeholder="Ej. Gran Topadera - Jinete #12" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">Número de Dorsal / Etiqueta</label>
                        <input type="text" id="upload-dorsal" placeholder="Ej. 12, 45, Reinas..." class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">Categoría</label>
                        <select id="upload-category" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
                            <option value="topaderas">Topaderas y Jaripeo</option>
                            <option value="cabalgatas">Cabalgatas</option>
                            <option value="grito">Noche del Grito y Reinas</option>
                            <option value="desfiles">Desfiles y Antorchas</option>
                            <option value="bailes">Bailes Populares</option>
                            <option value="videos">Videos Paquete</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">Fecha</label>
                        <input type="text" id="upload-date" placeholder="Ej. 16 de Septiembre" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">Precio (MXN)</label>
                        <input type="number" id="upload-price" value="50" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">URL de la Imagen o Vista Previa *</label>
                    <input type="url" id="upload-url" required placeholder="https://..." class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
                </div>

                <div>
                    <label class="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">URL del Video MP4 (Opcional si es Video)</label>
                    <input type="url" id="upload-video-url" placeholder="https://..." class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs">
                </div>

                <div>
                    <label class="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">Descripción</label>
                    <textarea id="upload-desc" rows="2" placeholder="Detalles de la toma fotográfica..." class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"></textarea>
                </div>

                <button type="submit" class="w-full bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black py-3 rounded-xl transition-all text-sm">
                    <i class="fa-solid fa-cloud-arrow-up mr-1"></i> Publicar en Galería D1
                </button>
                <div id="admin-upload-msg" class="hidden text-xs text-center font-bold p-2 rounded-xl"></div>
            </form>
        </div>
    </div>

    <!-- INFORMES FISICOS Y UBICACION EN CARPINTERIA EL TIGRE -->
    <section id="ubicacion" class="py-20 bg-slate-950 border-t border-amber-900/30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                <div class="space-y-6">
                    <span class="text-amber-400 font-extrabold uppercase text-xs tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">Punto de Atención Presencial</span>
                    <h2 class="font-serif text-3xl sm:text-5xl font-black text-white leading-tight">
                        Te Atendemos en <br>
                        <span class="text-amber-400">Carpintería El Tigre</span>
                    </h2>

                    <p class="text-slate-300 text-base leading-relaxed">
                        Si prefieres ver las fotos impresas, encargar tu memoria USB de videos en persona o platicar directamente con nosotros, visítanos en nuestro local comercial conocido por todos en San Pedro Lagunillas.
                    </p>

                    <div class="space-y-4 pt-2">
                        <div class="flex items-start gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                            <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xl flex-shrink-0">
                                <i class="fa-solid fa-store"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-white text-lg">Dirección Física:</h4>
                                <p class="text-slate-300 text-sm">Carpintería "El Tigre", San Pedro Lagunillas, Nayarit, México.</p>
                            </div>
                        </div>

                        <div class="flex items-start gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                            <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl flex-shrink-0">
                                <i class="fa-brands fa-whatsapp"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-white text-lg">Teléfono / WhatsApp Directo:</h4>
                                <p class="text-emerald-400 font-black text-lg">311 847 0860</p>
                                <p class="text-slate-400 text-xs">Atención rápida y envío de catálogos digitales por mensaje.</p>
                            </div>
                        </div>

                        <div class="flex items-start gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                            <div class="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 text-xl flex-shrink-0">
                                <i class="fa-solid fa-compact-disc"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-white text-lg">Formatos de Entrega:</h4>
                                <p class="text-slate-300 text-sm">Memoria USB Full HD, Descarga Digital privada en Alta Definición o Foto Impresa Fotográfica.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- CARPINTERIA EL TIGRE SHOWCASE BOX -->
                <div class="bg-gradient-to-br from-amber-900/40 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-8 shadow-2xl relative">
                    <div class="absolute -top-4 -left-4 bg-amber-500 text-slate-950 font-black text-xs uppercase px-4 py-1.5 rounded-full shadow-lg">
                        ¡Garantía de Calidad!
                    </div>

                    <div class="text-center space-y-6 pt-4">
                        <div class="w-32 h-32 mx-auto rounded-full p-1 bg-gradient-to-br from-amber-400 to-red-600 shadow-xl overflow-hidden">
                            <img src="${LOCAL_LOGO_URL}" alt="El Tigre" class="w-full h-full object-cover rounded-full bg-slate-950 border border-slate-950">
                        </div>

                        <h3 class="font-serif font-black text-3xl text-white">FOTOGRAFÍAS EL TIGRE</h3>
                        <p class="text-slate-300 text-sm italic">
                            "Capturando el alma, el valor y la fiesta de San Pedro Lagunillas. Apoya el talento local nayarita."
                        </p>

                        <div class="grid grid-cols-2 gap-4 text-left pt-4 border-t border-slate-800 text-xs">
                            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                <span class="text-amber-400 font-bold block">Fechas de Cobertura:</span>
                                <span class="text-slate-200">10 de Septiembre en adelante</span>
                            </div>
                            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                <span class="text-amber-400 font-bold block">Paquete de Videos:</span>
                                <span class="text-slate-200">$600 MXN Completo</span>
                            </div>
                            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                <span class="text-amber-400 font-bold block">Foto Individual:</span>
                                <span class="text-slate-200">$50 MXN c/u</span>
                            </div>
                            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                <span class="text-amber-400 font-bold block">Informes:</span>
                                <span class="text-slate-200">Carpintería El Tigre</span>
                            </div>
                        </div>

                        <a href="https://wa.me/523118470860?text=Hola,%20busco%20informes%20en%20Carpinteria%20El%20Tigre%20sobre%20fotos%20y%20videos" target="_blank" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-xl block transition-all shadow-lg text-sm">
                            <i class="fa-brands fa-whatsapp mr-1 text-lg"></i> Contactar por WhatsApp
                        </a>
                    </div>
                </div>

            </div>
        </div>
    </section>

    <!-- FOOTER -->
    <footer class="bg-slate-950 border-t border-amber-900/50 py-12 text-slate-400 text-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div class="flex flex-col md:flex-row items-center justify-between gap-6">
                <div class="flex items-center gap-3">
                    <img src="${LOCAL_LOGO_URL}" alt="Fotografías El Tigre" class="w-12 h-12 rounded-full border border-amber-400 object-cover">
                    <div>
                        <span class="font-serif font-black text-lg text-white block">Fotografías El Tigre</span>
                        <span class="text-xs text-amber-400">San Pedro Lagunillas, Nayarit</span>
                    </div>
                </div>

                <div class="flex items-center gap-6 text-xs text-slate-300">
                    <a href="#inicio" class="hover:text-amber-400">Inicio</a>
                    <a href="#carrusel" class="hover:text-amber-400">Carrusel</a>
                    <a href="/seleccionar" class="hover:text-amber-400 font-bold">Seleccionar Fotos</a>
                    <a href="#programa" class="hover:text-amber-400">Programa</a>
                    <a href="#ubicacion" class="hover:text-amber-400">Ubicación</a>
                </div>

                <div class="text-xs text-center md:text-right text-slate-400 space-y-1">
                    <p><i class="fa-solid fa-phone text-amber-400 mr-1"></i> <strong>311 847 0860</strong></p>
                    <p><i class="fa-solid fa-shop text-amber-400 mr-1"></i> Carpintería El Tigre</p>
                </div>
            </div>

            <div class="pt-8 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p>© 2026 Fotografías El Tigre — Fiestas Patrias San Pedro Lagunillas. Todos los derechos reservados.</p>
                <p class="text-slate-400">Paquete de Videos completos: <strong>$600 MXN</strong> | Cada Foto: <strong>$50 MXN</strong></p>
            </div>
        </div>
    </footer>

    <!-- JS SCRIPT -->
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/app.js"></script>
</body>
</html>
  `)
})

export default app
