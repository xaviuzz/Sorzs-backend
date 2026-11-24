FROM oven/bun:1.4.3-slim
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY src ./src
COPY benchmark ./benchmark
ENV DATA_DIR=/data
RUN mkdir -p /data
VOLUME /data
CMD ["bun", "benchmark/main.ts"]
