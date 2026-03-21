FROM node:20-alpine

WORKDIR /app

# 初期化時にコンテナが落ちないようにおくための処置。
# パッケージが存在すれば起動、なければ無限ループで待機（execで初期化するため）
CMD ["sh", "-c", "if [ -f package.json ]; then npm run dev; else echo 'Waiting for initialization...'; sleep infinity; fi"]
