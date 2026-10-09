import PayOS from "@payos/node";
let client: PayOS | undefined;
export const payos: PayOS = new Proxy({} as PayOS, {
  get(_, property) {
    if (!client) {
      const { PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY } =
        process.env;
      if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY)
        throw new Error("PAYOS_CONFIG_MISSING");
      client = new PayOS(PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY);
    }
    const value = Reflect.get(client, property);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
