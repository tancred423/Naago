FROM denoland/deno:2.5.6

RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libgif-dev \
    libjpeg-dev \
    libpango1.0-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY deno.json deno.lock* ./
COPY . .

RUN deno install --allow-scripts=npm:canvas
RUN deno cache src/index.ts src/deploy-commands.ts

EXPOSE 3000

