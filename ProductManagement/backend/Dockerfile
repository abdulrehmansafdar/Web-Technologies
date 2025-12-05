FROM oven/bun:latest

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies using Bun
COPY package.json package-lock.json* ./
RUN bun install --production

# Copy app code
COPY . .

EXPOSE 3000

# Start the app using Bun. Use sh -lc to run commands sequentially.
CMD ["sh", "-lc", "bun wait-for-db.js && bun server.js"]
