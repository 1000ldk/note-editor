FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl chromium dbus fontconfig nss freetype harfbuzz ttf-freefont tzdata xvfb xvfb-run libc6-compat

CMD ["sh", "-c", "if [ -f package.json ]; then npm run dev; else echo 'Waiting for initialization...'; sleep infinity; fi"]
