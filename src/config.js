import "dotenv/config";

export const network = process.env.NETWORK || "mainnet";

export const clientUrl =
  network === "mainnet"
    ? "https://odapp.aa-dev.net"
    : "https://odapp-t.aa-dev.net";

const envBaseAAs = process.env.BASE_AAS;
if (!envBaseAAs) {
  throw new Error("BASE_AAS env variable is not set");
}

export const baseAAs = envBaseAAs
  .split(",")
  .map((v) => v.trim())
  .filter((v) => v);
