# Videos y Fotos "El Tigre" — Fiestas Patrias San Pedro Lagunillas 2026

Sitio web interactivo y plataforma de venta de contenido fotográfico y audiovisual para **Videos y Fotos "El Tigre"**, enfocado en la cobertura completa de las **Fiestas Patrias de San Pedro Lagunillas, Nayarit**.

---

## 📌 Resumen del Proyecto y Objetivos

- **Nombre Comercial**: Videos y Fotos "El Tigre"
- **Punto de Información y Entrega Física**: Carpintería "El Tigre", San Pedro Lagunillas, Nayarit
- **Contacto Telefónico / WhatsApp**: `311 847 0860`
- **Cobertura**: Fiestas Patrias de San Pedro Lagunillas, Nayarit (Del **10 de Septiembre** hasta la **última topadera**).
- **Objetivo Principal**: Facilitar a los habitantes, paisanos y visitantes la consulta del programa festivo, la cotización de fotos/videos, el armado de pedidos personalizados y el envío directo vía WhatsApp o registro en línea.

---

## 💰 Estructura de Precios Oficiales

1. **Paquete Completo de Videos (Pase Total)**: **$600 MXN**
   - Incluye la filmación en calidad Full HD de **TODOS los días** (del 10 de septiembre hasta la última topadera).
   - Cobertura de Desfiles, Entrada de la Música, Desfile de Antorchas, Noche del Grito, Cabalgatas, Jaripeos y Topaderas.
   - Entrega en memoria USB o enlace privado de descarga digital.

2. **Fotos Individuales Personalizadas**: **$50 MXN c/u**
   - Fotografía individual retocada en alta nitidez.
   - Disponible en formato impreso fotográfico o archivo digital HD.
   - Búsqueda y encargo de fotografías específicas de participantes, charros, reinas o familias.

---

## 🚀 Funcionalidades Completadas

1. **Hero Section de Alto Impacto**: Encabezado visual con la identidad de El Tigre, llamados a la acción claros e información de contacto.
2. **Sección de Precios Transparentes**: Tarjetas informativas con los costos clave ($600 paquete de video y $50 foto individual).
3. **Calculador y Cotizador Interactivo de Pedidos**:
   - Selección dinámica de Paquete de Video ($600).
   - Contador incremental de fotos individuales ($50 c/u) con cálculo en tiempo real.
   - Selección de eventos de interés (Topaderas, Cabalgata, Noche del Grito, Bailes, etc.).
   - Campo para notas y solicitudes de fotos personalizadas.
   - **Botón WhatsApp (3118470860)**: Prepara automáticamente un mensaje formateado con el resumen de la compra para enviar con un solo clic.
   - **Botón Registrar en Línea**: Guarda la solicitud directamente en la base de datos del servidor Hono API.
4. **Calendario y Programa de Fiestas Patrias**:
   - Listado ordenado por fechas desde la Entrada de la Música (10 Sep) hasta la Última Topadera de cierre.
   - Insignias de cobertura y enlaces rápidos para cotizar el evento seleccionado.
5. **Galería Muestra e Interactiva con Lightbox**:
   - Álbumes filtrables por categorías: *Topaderas y Jaripeos*, *Cabalgatas*, *Noche del Grito*, *Desfiles*, *Bailes*.
   - Visor de fotos (Modal Lightbox) con descripción, fecha y botón directo "+ Agregar esta foto ($50 MXN)".
6. **Ubicación e Información en Carpintería El Tigre**:
   - Detalles de la atención presencial en Carpintería El Tigre en San Pedro Lagunillas.
   - Formatos de entrega (Memoria USB, Digital HD, Impreso).
7. **Formulario de Consultas y Contacto**:
   - Envío de mensajes directo a la API con confirmación en pantalla.

---

## 🌐 URIs y Rutas de la API (Hono Backend)

| Método | Ruta | Descripción | Parámetros / Body |
| shadow | `/` | Página principal interactiva HTML | N/A |
| GET | `/api/events` | Obtiene el programa oficial de eventos festivos | N/A |
| GET | `/api/gallery` | Obtiene la lista de fotos y videos de muestra | N/A |
| POST | `/api/orders` | Registra un pedido o cotización en el sistema | `{ clientName, phone, videoPass, photoCount, selectedEvents, notes }` |
| GET | `/api/orders` | Obtiene el historial de solicitudes registradas | N/A |
| POST | `/api/contact` | Envía un mensaje de consulta directa | `{ name, phone, message }` |

---

## 🛠️ Tecnologías y Arquitectura

- **Backend**: [Hono Framework](https://hono.dev/) optimizado para Cloudflare Workers / Pages.
- **Frontend**: HTML5 Semántico + Tailwind CSS (vía CDN) + FontAwesome 6 + Font Google Cinzel & Plus Jakarta Sans.
- **Interactividad**: JavaScript ES6 nativo + Axios HTTP Client.
- **Servidor Dev / Runtime**: Vite + PM2 + Cloudflare Wrangler Pages Dev.

---

## 📖 Guía de Uso Rápido para el Usuario

1. **Explorar el Programa de Fiestas**: Consulta las fechas del 10 de septiembre a la última topadera en la sección *Programa*.
2. **Ver las Muestras**: Ingresa a la *Galería* para ver la calidad fotográfica. Haz clic sobre cualquier imagen para ampliarla y ver sus detalles.
3. **Armar tu Pedido**:
   - Ve a la sección *Hacer Pedido*.
   - Marca la casilla si deseas el **Paquete de Videos de Todos los Días ($600 MXN)**.
   - Ajusta el contador de **Fotos Individuales ($50 MXN c/u)**.
   - Escribe en las notas qué fotos buscas (ej. *"Foto de mi caballo bayo en la cabalgata del 14"*).
4. **Enviar**: Haz clic en **"Enviar por WhatsApp"** para contactar directamente al número `3118470860` con la orden desglosada, o en **"Registrar Solicitud en Línea"**.
5. **Entrega**: Pasa por tu memoria USB o tus impresiones a **Carpintería El Tigre** en San Pedro Lagunillas, Nayarit.

---

## 🔮 Funcionalidades Futuras Recomendadas

- [ ] Integración con Cloudflare D1 SQLite para persistencia permanente de galerías de alta resolución.
- [ ] Subida directa de vistas previas de fotos por parte del fotógrafo mediante panel de administración con contraseña.
- [ ] Búsqueda por número de dorsal o reconocimiento facial para que los participantes encuentren sus fotos automáticamente.
- [ ] Pasarela de pago opcional (Stripe / Mercado Pago) para clientes foráneos o paisanos en USA.

---

*Desarrollado con orgullo para Videos y Fotos "El Tigre" — San Pedro Lagunillas, Nayarit.*
