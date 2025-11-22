import "dotenv/config";
import { Worker, Queue, QueueEvents } from "bullmq";
import Redis from "ioredis";
import { getBestRoute } from "../services/routing";
import { wsManager } from "../lib/websocket";
import { MockDexRouter } from "../dex/MockDexRouter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const redis = new Redis({
  maxRetriesPerRequest: null
});

const dex = new MockDexRouter(1);

// Queue initialization
export const orderQueue = new Queue("order-queue", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true,
  }
});

export const orderQueueEvents = new QueueEvents("order-queue", {
  connection: redis,
});

// WebSocket helper
function emitWS(orderId: string, status: string, meta: any = {}) {
  wsManager.emit(orderId, {
    orderId,
    status,
    timestamp: new Date().toISOString(),
    meta,
  });
}

// Worker logic
export const orderWorker = new Worker(
  "order-queue",
  async (job) => {
    const { orderId } = job.data;

    console.log("Processing order:", orderId);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      emitWS(orderId, "failed", { reason: "Order not found" });
      return;
    }

    emitWS(orderId, "pending");

    // Routing
    emitWS(orderId, "routing");
    const route = await getBestRoute(order.tokenIn, order.tokenOut, order.amount);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        selectedDex: route.bestDex,
        routedPrice: route.selectedQuote.price,
      }
    });

    emitWS(orderId, "routing", route);

    emitWS(orderId, "building");

    const minOut = route.selectedQuote.effectiveOut * 0.99;

    emitWS(orderId, "submitted");

    try {
      const result = await dex.executeSwap(route.bestDex, order, minOut);

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "confirmed",
          txHash: result.txHash,
          executedPrice: result.executedPrice,
        }
      });

      emitWS(orderId, "confirmed", result);
      console.log("Order confirmed:", orderId);

    } catch (err: any) {
      const attempt = job.attemptsMade + 1;

      if (attempt >= 3) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "failed",
            failReason: err.message,
          }
        });

        emitWS(orderId, "failed", { reason: err.message });

      } else {
        emitWS(orderId, "retrying", { attempt });
        throw err;
      }
    }
  },
  {
    connection: redis,
    concurrency: 10,
  }
);

console.log("🟢 Order Worker is RUNNING and waiting for jobs...");
