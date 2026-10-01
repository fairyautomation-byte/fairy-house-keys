import PayOS from "@payos/node";

const clientId = process.env.PAYOS_CLIENT_ID || "fcaaf2a3-ae41-4913-b9f2-ecb9b85c3793";
const apiKey = process.env.PAYOS_API_KEY || "eb825018-e705-4020-b5f5-7368ded67af9";
const checksumKey = process.env.PAYOS_CHECKSUM_KEY || "0ec675d7621e3ece030f46aa7092b7b270d0ebf6e3bcbdbcba8a99ad3f286dda";

export const payos = new PayOS(clientId, apiKey, checksumKey);
