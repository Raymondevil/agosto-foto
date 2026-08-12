#!/bin/bash

# Script para deployar el servidor de subidas con Docker
# Uso: ./scripts/deploy-uploader.sh

set -e

echo "=========================================="
echo "  Deployando Servidor de Subidas El Tigre"
echo "=========================================="
echo ""

# Navegar al directorio del proyecto
cd "$(dirname "$0")/.."

# 1. Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# 2. Compilar el servidor de subidas
echo "⚙️  Compilando servidor de subidas..."
npm run build:upload

# 3. Crear directorio srv si no existe
echo "📁 Asegurando que exista directorio srv..."

mkdir -p srv

# 4. Build Docker image
echo "🐳 Construyendo imagen Docker..."
docker build -t eltigre-uploader -f Dockerfile.upload .

# 5. Iniciar servicios con Docker Compose
echo "⚡ Iniciando servicios con Docker Compose..."
docker compose -f docker-compose.upload.yml down 2>/dev/null || true
docker compose -f docker-compose.upload.yml up -d --build

# 6. Mostrar información de los servicios
echo ""
echo "=========================================="
echo "  ✅ Despliegue completado!"
echo "=========================================="
echo ""
echo "Servicios en ejecución:"
docker compose -f docker-compose.upload.yml ps
echo ""
echo "Endpoints disponibles:"
echo "  - Health: GET http://localhost:3001/health"
echo "  - Subir:  POST http://localhost:3001/api/upload"
echo "  - Listar:  GET http://localhost:3001/api/fotos"
echo "  - Ver:    GET http://localhost:3001/fotos/{nombre}"
echo "  - Eliminar: POST http://localhost:3001/api/fotos/delete"
echo ""
echo "Cloudflare Tunnel se conectará automáticamente..."
echo "Espera unos minutos y verifica el dashboard de Cloudflare Zero Trust"
echo ""
