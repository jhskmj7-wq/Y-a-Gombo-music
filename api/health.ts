export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    return res.status(200).json({ status: "ok" });
  }

  return res.status(200).json({
    status: "ok",
    timestamp: Date.now(),
    env: process.env.NODE_ENV || "production",
  });
}
