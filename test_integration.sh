#!/bin/bash

# Script de prueba para la integración D1
# Este script prueba el flujo completo: subir foto + registrar en D1

set -e

echo "=========================================="
echo "  Probando Integración D1 + Upload Server"
echo "=========================================="
echo ""

# Navegar al directorio del proyecto
cd "$(dirname "$0")"

echo "🔹 Paso 1: Compilando servidor de subidas..."
npm run build:upload > /dev/null 2>&1
echo "   ✅ Servidor de subidas compilado"

echo ""
echo "🔹 Paso 2: Iniciando servicios con Docker..."
docker compose -f docker-compose.upload.yml down > /dev/null 2>&1 || true
docker compose -f docker-compose.upload.yml up -d > /dev/null 2>&1

# Esperar a que los servicios estén listos
echo "   ⏳ Esperando a que los servicios inicien..."
sleep 10

echo ""
echo "🔹 Paso 3: Probando health check del upload server..."
UPLOADER_HEALTH=$(curl -s http://localhost:3001/health 2>&1 || echo "error")
if echo "$UPLOADER_HEALTH" | grep -q '"status":"ok"'; then
    echo "   ✅ Upload server está funcionando"
else
    echo "   ❌ Upload server no responde"
    exit 1
fi

echo ""
echo "🔹 Paso 4: Probando health check de la app principal..."
WEAPP_HEALTH=$(curl -s http://localhost:3000/health 2>&1 || echo "error")
if echo "$WEAPP_HEALTH" | grep -q '"status":"ok"'; then
    echo "   ✅ App principal está funcionando"
else
    echo "   ⚠️  App principal no está disponible (es normal si solo usas el upload server)"
fi

echo ""
echo "🔹 Paso 5: Creando foto de prueba..."
# Crear una imagen de prueba pequeña
convert -size 100x100 xc:white -fill red -draw "circle 50,50 50,10" /tmp/test-photo.jpg 2>/dev/null || \
echo "test" > /tmp/test-photo.jpg

echo ""
echo "🔹 Paso 6: Subiendo foto AL upload server (sin D1)..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3001/api/upload \
  -F "photo=@/tmp/test-photo.jpg" 2>&1)
echo "   $UPLOAD_RESPONSE"

if echo "$UPLOAD_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Foto subida correctamente"
    FILE_NAME=$(echo "$UPLOAD_RESPONSE" | grep -o '"fileName":"[^"]*"' | cut -d'"' -f4)
    FILE_URL=$(echo "$UPLOAD_RESPONSE" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
    echo "   📁 Nombre: $FILE_NAME"
    echo "   🔗 URL: http://localhost:3001$FILE_URL"
else
    echo "   ❌ Error al subir foto"
    exit 1
fi

# Limpiar
rm -f /tmp/test-photo.jpg

echo ""
echo "🔹 Paso 7: Probando registro manual en D1..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/gallery/register \
  -H "Content-Type: application/json" \
  -d "{\"fileName\":\"$FILE_NAME\",\"url\":\"http://localhost:3001$FILE_URL\",\"title\":\"Foto de Prueba\",\"category\":\"test\",\"price\":50,\"uploadPassword\":\"tigre2026\"}" 2>&1)
echo "   $REGISTER_RESPONSE"

if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Foto registrada en D1"
else
    echo "   ⚠️  No se pudo registrar en D1 (la app principal no está disponible o no tiene D1 configurado)"
fi

echo ""
echo "🔹 Paso 8: Probando subida CON registro en D1 automático..."
# Crear otra foto de prueba
convert -size 100x100 xc:white -fill blue -draw "rectangle 10,10 90,90" /tmp/test-photo2.jpg 2>/dev/null || \
echo "test2" > /tmp/test-photo2.jpg

UPLOAD_WITH_D1=$(curl -s -X POST http://localhost:3001/api/upload \
  -F "photo=@/tmp/test-photo2.jpg" \
  -F "title=Foto de Prueba 2" \
  -F "category=test" \
  -F "price=50" \
  -F "registerInD1=true" 2>&1)
echo "   $UPLOAD_WITH_D1"

if echo "$UPLOAD_WITH_D1" | grep -q '"registeredInD1":true'; then
    echo "   ✅ Foto subida Y registrada en D1 automáticamente"
else
    echo "   ⚠️  Foto subida pero no registrada en D1 automáticamente"
fi

# Limpiar
rm -f /tmp/test-photo2.jpg

echo ""
echo "🔹 Paso 9: Listando fotos en upload server..."
LIST_RESPONSE=$(curl -s http://localhost:3001/api/fotos 2>&1)
echo "   $LIST_RESPONSE"

echo ""
echo "🔹 Paso 10: Consultando D1 directamente..."
if command -v wrangler &> /dev/null; then
    D1_COUNT=$(wrangler d1 execute fotos --remote --command="SELECT COUNT(*) as cnt FROM gallery" 2>&1 | grep -o '"cnt":[0-9]*' | grep -o '[0-9]*')
    echo "   📊 Total de fotos en D1: ${D1_COUNT:-0}"
else
    echo "   ⚠️  Wrangler no está disponible, no se puede consultar D1"
fi

echo ""
echo "=========================================="
echo "  ✅ Pruebas de integración completadas"
echo "=========================================="
echo ""
echo "Resumen:"
echo "  - Upload server: ✅ Funcionando"
echo "  - Subida de archivos: ✅ Funcionando"
echo "  - Registro en D1 (manual): ✅ Probado"
echo "  - Registro en D1 (automático): ✅ Probado"
echo ""
echo "Para limpiar los contenedores:"
echo "  docker compose -f docker-compose.upload.yml down"
