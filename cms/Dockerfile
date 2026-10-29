# Local development image for Strapi. Runs `strapi develop` so the admin's
# Content-Type Builder can edit schemas (src/ and config/ are bind-mounted).
FROM node:24-alpine

ENV NODE_ENV=development \
    STRAPI_TELEMETRY_DISABLED=true

# Fonts let the seed render the text in the sample illustrations (SVG to JPG with sharp).
RUN apk add --no-cache fontconfig font-dejavu

WORKDIR /opt/app
RUN chown node:node /opt/app
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --no-audit --no-fund && npm cache clean --force

COPY --chown=node:node . .
RUN mkdir -p public/uploads

EXPOSE 1337
HEALTHCHECK --interval=15s --timeout=5s --start-period=120s --retries=5 \
  CMD wget -q --spider http://127.0.0.1:1337/_health || exit 1
CMD ["npm", "run", "develop"]
