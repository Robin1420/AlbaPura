import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

// Caché de páginas y datos ('use cache') en un KV de Cloudflare.
export default defineCloudflareConfig({ incrementalCache: kvIncrementalCache });
