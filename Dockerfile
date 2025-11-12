FROM denoland/deno:2.5.6

RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libgif-dev \
    libjpeg-dev \
    libpango1.0-dev \
    librsvg2-dev \
    fonts-roboto \
    fonts-liberation \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/share/fonts/custom

RUN fc-cache -fv

WORKDIR /app

COPY deno.json deno.lock* ./
COPY . .

RUN if [ -d "fonts" ] && [ "$(ls -A fonts 2>/dev/null)" ]; then \
        cp -r fonts/* /usr/share/fonts/custom/ && \
        fc-cache -fv; \
    fi

RUN deno install --allow-scripts=npm:canvas
RUN deno cache src/index.ts src/deploy-commands.ts

EXPOSE 3000

