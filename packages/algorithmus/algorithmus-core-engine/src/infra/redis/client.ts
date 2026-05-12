import { createClient } from "redis";
import { getRedisUrl } from "../../config/redisUrl";

let client: ReturnType<typeof createClient> | null = null;
let connecting: Promise<ReturnType<typeof createClient>> | undefined;

/**
 * Cliente Redis singleton (lazy connect). Namespacing por tenant en capas superiores.
 */
export async function getRedis(): Promise<ReturnType<typeof createClient>> {
  if (client?.isOpen) return client;
  if (connecting) return connecting;

  connecting = (async () => {
    const c = createClient({ url: getRedisUrl() });
    c.on("error", (err) => {
      console.error("[redis] error de cliente", err);
    });
    await c.connect();
    client = c;
    return c;
  })();

  try {
    return await connecting;
  } finally {
    connecting = undefined;
  }
}
