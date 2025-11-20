# Use the official Bun image
FROM oven/bun:latest AS base
WORKDIR /usr/src/app

FROM base AS install
# Install dependencies
RUN mkdir -p /temp/bun
COPY package.json bun.lockb /temp/bun/
RUN cd /temp/bun && bun install --frozen-lockfile
# Install Sub-Store backend
ADD https://github.com/sub-store-org/Sub-Store/releases/download/2.20.39/sub-store.bundle.js sub-store.js
# Install Mihomo
ADD https://github.com/MetaCubeX/mihomo/releases/download/v1.19.16/mihomo-linux-amd64-compatible-v1.19.16.gz mihomo.gz
RUN gunzip mihomo.gz && chmod +x mihomo
# Install GEOX
ADD https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.dat GeoIP.dat
ADD https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.metadb Country.mmdb
ADD https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/GeoLite2-ASN.mmdb ASN.mmdb
ADD https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat GeoSite.dat

FROM base AS action
COPY --from=install /temp/bun/node_modules node_modules
COPY --from=install /usr/src/app/sub-store.js services/sub-store.js
COPY --from=install /usr/src/app/mihomo services/mihomo
COPY --from=install /usr/src/app/GeoIP.dat services/GeoIP.dat
COPY --from=install /usr/src/app/Country.mmdb services/Country.mmdb
COPY --from=install /usr/src/app/ASN.mmdb services/ASN.mmdb
COPY --from=install /usr/src/app/GeoSite.dat services/GeoSite.dat
COPY . .

# Set environment variables
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV SUB_STORE_BACKEND_API_PORT=3000
ENV SUB_STORE_BODY_JSON_LIMIT=20mb
ENV EXTERNAL_CONTROLLER_PORT=9090

# Expose ports (Dev Only)
EXPOSE 3000
EXPOSE 9090

# Run the app
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]