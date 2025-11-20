#!/bin/sh -l
cd /usr/src/app

# Start Sub-Store backend
bun run ./services/sub-store.ts

# Start Mihomo backend
bun run ./services/mihomo.ts

# Start health check
bun run index.ts

#hang
tail -f /dev/null
