# Usamos Node.js en Alpine Linux (súper ligero)
FROM node:20-alpine

# Creamos el directorio de trabajo
WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos todo el código fuente
COPY . .

# Construimos la aplicación
RUN npm run build

# Exponemos el puerto 3000
EXPOSE 3000

# Creamos la carpeta /srv si no existe
RUN mkdir -p /srv

# Comando para iniciar la app con Wrangler (necesario para Hono/Cloudflare y accesible desde el túnel)
CMD ["npx", "wrangler", "pages", "dev", "dist", "--ip", "0.0.0.0", "--port", "3000"]

