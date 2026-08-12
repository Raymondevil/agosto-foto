/**
 * Cliente para interactuar con el servidor de subidas de fotos
 * Usado desde el navegador (frontend)
 */

// URL base del servidor de subidas (configurable)
export const UPLOAD_SERVER_URL = import.meta.env.VITE_UPLOAD_SERVER_URL || 
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')

// Interfaz para la respuesta de subida
export interface UploadResponse {
  success: boolean
  message?: string
  url?: string
  fileName?: string
  error?: string
}

// Interfaz para la lista de fotos
export interface PhotoFile {
  name: string
  url: string
  size: string
}

// Interfaz para la respuesta de lista
export interface ListResponse {
  success: boolean
  files?: PhotoFile[]
  count?: number
  error?: string
}

// Interfaz para la respuesta de eliminación
export interface DeleteResponse {
  success: boolean
  message?: string
  fileName?: string
  error?: string
}

/**
 * Subir una foto al servidor
 * @param file - Archivo de imagen a subir
 * @param onProgress - Callback para progreso de subida (opcional)
 * @returns Promesa con la respuesta del servidor
 */
export async function uploadPhoto(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  try {
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      return { 
        success: false, 
        error: 'Solo se permiten archivos de imagen' 
      }
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { 
        success: false, 
        error: 'Archivo demasiado grande (máximo 10MB)' 
      }
    }

    // Crear FormData
    const formData = new FormData()
    formData.append('photo', file)

    // Configurar headers (el navegador automaticamente agrega el boundary)
    const headers = {} as Record<string, string>
    
    // Crear evento para tracking de progreso
    const xhr = new XMLHttpRequest()
    
    return new Promise<UploadResponse>((resolve) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100)
          onProgress(progress)
        }
      })

      xhr.open('POST', `${UPLOAD_SERVER_URL}/api/upload`, true)
      
      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText) as UploadResponse
          resolve(response)
        } catch (err) {
          resolve({
            success: false,
            error: 'Error al parsear respuesta del servidor'
          })
        }
      }

      xhr.onerror = () => {
        resolve({
          success: false,
          error: 'Error de conexión con el servidor'
        })
      }

      xhr.send(formData)
    })
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Error desconocido al subir la foto'
    }
  }
}

/**
 * Listar todas las fotos disponibles
 * @returns Promesa con la lista de fotos
 */
export async function listPhotos(): Promise<ListResponse> {
  try {
    const response = await fetch(`${UPLOAD_SERVER_URL}/api/fotos`)
    return await response.json() as ListResponse
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Error al obtener la lista de fotos'
    }
  }
}

/**
 * Eliminar una foto del servidor
 * @param fileName - Nombre del archivo a eliminar
 * @param password - Contraseña de administrador
 * @returns Promesa con la respuesta del servidor
 */
export async function deletePhoto(
  fileName: string,
  password: string
): Promise<DeleteResponse> {
  try {
    const response = await fetch(`${UPLOAD_SERVER_URL}/api/fotos/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileName, password })
    })
    return await response.json() as DeleteResponse
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Error al eliminar la foto'
    }
  }
}

/**
 * Obtener URL directa de una foto
 * @param fileName - Nombre del archivo
 * @returns URL completa para acceder a la foto
 */
export function getPhotoUrl(fileName: string): string {
  return `${UPLOAD_SERVER_URL}/fotos/${fileName}`
}

/**
 * Verificar el estado del servidor
 * @returns Promesa con el estado
 */
export async function checkServerHealth(): Promise<{ status: string }> {
  try {
    const response = await fetch(`${UPLOAD_SERVER_URL}/health`)
    return await response.json() as { status: string }
  } catch {
    return { status: 'error' }
  }
}

/**
 * Tipos de archivo permitidos
 */
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * Tamaño máximo permitido (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Validar si un archivo es una imagen válida
 * @param file - Archivo a validar
 * @returns true si es válido
 */
export function isValidPhoto(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF' 
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: 'Archivo demasiado grande (máximo 10MB)' 
    }
  }

  return { valid: true }
}

/**
 * Generar nombre único para un archivo
 * @param originalName - Nombre original del archivo
 * @returns Nombre único con timestamp
 */
export function generateFileName(originalName: string): string {
  const extension = originalName.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}.${extension}`
}
