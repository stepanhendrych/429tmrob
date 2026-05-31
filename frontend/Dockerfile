FROM node:20-slim

WORKDIR /app

# Kopírování package.json a instalace
COPY package.json package-lock.json* ./
RUN npm install

# Kopírování zbytku
COPY . .

# Start aplikace (pro hackathon stačí npm run dev)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]