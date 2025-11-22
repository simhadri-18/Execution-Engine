🚀 Execution Engine — Market Order Routing & WebSocket Live Updates

A high-performance order execution engine built using Node.js, TypeScript, Fastify, BullMQ, Redis, and PostgreSQL, capable of processing market orders with:

DEX price comparison (Raydium & Meteora — Mock)

Real-time WebSocket streaming

Concurrent queue processing

Exponential backoff retries

Persistent order history

Clean architecture & modular structure

This project implements Backend Task 2: Order Execution Engine from the assignment.

🟦 Why I Chose Market Orders

I selected Market Orders because they are the fastest to execute and best demonstrate the required flow:
order submission → routing → execution → WebSocket updates → confirmation.

Extending to Limit/Sniper Orders (Easy)

Limit Order: Add a price check before execution; retry until the target price is reached.

Sniper Order: Poll Raydium/Meteora pools until token launch, then execute immediately.

The current architecture fully supports these extensions.

🧩 Architecture Overview
User → POST /api/orders/execute → BullMQ Queue → Worker → Mock DEX Router
        ↘                                     ↙
               WebSocket (live order updates)

Components
Component	Description
Fastify API	Handles order submission & WebSocket upgrading
BullMQ	Manages order queue with retries & concurrency
Redis	Queue backend
PostgreSQL	Stores order history
Prisma ORM	DB layer
MockDexRouter	Simulated Raydium + Meteora pricing
WebSocket Manager	Pushes live lifecycle events
🔄 Order Execution Lifecycle (WebSocket)

Your WebSocket client receives real-time updates:

pending → routing → building → submitted → confirmed (or failed)


Example WebSocket payload:

{
  "orderId": "ce7f1334-0623",
  "status": "routing",
  "timestamp": "2025-11-22T16:31:49.718Z",
  "meta": {
    "bestDex": "raydium",
    "raydiumQuote": { "price": 1.00 },
    "meteoraQuote": { "price": 0.98 }
  }
}

🛠 Setup Instructions
1️⃣ Clone Repository
git clone https://github.com/<your-username>/Execution-Engine.git
cd Execution-Engine

2️⃣ Install Dependencies
npm install

3️⃣ Environment Variables

Create a .env file:

DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres"
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

4️⃣ Start PostgreSQL & Redis
PostgreSQL (Docker)
docker run --name pg -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

Redis (Docker)
docker run --name redis -p 6379:6379 -d redis


Or use your local Redis installation.

5️⃣ Run Prisma Migration
npx prisma migrate dev --name init

6️⃣ Start API Server
npx ts-node src/index.ts

7️⃣ Start Worker
npx ts-node src/workers/orderWorker.ts

📬 API Usage
Submit Order

POST /api/orders/execute

Body
{
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amount": 1
}

Response
{
  "orderId": "xxxx-xxxx-xxxx"
}

🔌 WebSocket (Live Updates)

Connect to:

ws://localhost:3000/ws?orderId=<orderId>


You will receive live messages:

pending → routing → building → submitted → confirmed

📦 Project Structure
src/
 ├─ index.ts             # Fastify API + WebSocket route
 ├─ workers/
 │   └─ orderWorker.ts   # BullMQ worker logic
 ├─ dex/
 │   └─ MockDexRouter.ts # Mock Raydium & Meteora router
 ├─ services/
 │   └─ routing.ts       # Price comparison & routing logic
 ├─ lib/
 │   └─ websocket.ts     # WebSocket manager
prisma/
 ├─ schema.prisma        # Prisma schema
 └─ migrations/          # DB migrations
