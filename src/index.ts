import "dotenv/config";
import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { PrismaClient } from "@prisma/client";
import { orderQueue } from "./workers/orderWorker";
import { wsManager } from "./lib/websocket";

const prisma = new PrismaClient();

async function startServer() {
  const fastify = Fastify({ logger: true });

  await fastify.register(websocket);

  fastify.get("/ws", { websocket: true }, (connection, req) => {
  const socket = connection;        // <-- FIX: connection IS the socket
  const orderId = (req.query as any).orderId;

  if (!orderId) {
    socket.send(JSON.stringify({ error: "Missing orderId" }));
    socket.close();
    return;
  }

  // Add connection
  wsManager.addConnection(orderId, socket);

  // Remove when disconnected
  socket.on("close", () => {
    wsManager.removeConnection(orderId);
  });
});


  fastify.post("/api/orders/execute", async (req, reply) => {
    const { tokenIn, tokenOut, amount, type = "market" } = req.body as any;

    if (!tokenIn || !tokenOut || !amount) {
      return reply.status(400).send({ error: "Missing fields" });
    }

    const newOrder = await prisma.order.create({
      data: { type, tokenIn, tokenOut, amount }
    });

    await orderQueue.add("execute", { orderId: newOrder.id });

    return { orderId: newOrder.id };
  });

  fastify.listen({ port: 3000 });
  console.log("🚀 Server running on http://localhost:3000");
}

startServer();
