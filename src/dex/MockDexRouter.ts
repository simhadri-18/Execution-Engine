// src/dex/MockDexRouter.ts

export type QuoteResult = {
  price: number;
  fee: number;
  effectiveOut: number;
};

export type SwapResult = {
  txHash: string;
  executedPrice: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateMockTxHash() {
  return "MOCK_TX_" + Math.random().toString(36).substring(2, 12);
}

export class MockDexRouter {
  basePrice: number;

  constructor(basePrice = 1) {
    this.basePrice = basePrice; // starting price reference
  }

  async getRaydiumQuote(tokenIn: string, tokenOut: string, amount: number): Promise<QuoteResult> {
    await sleep(200);

    const price = this.basePrice * (0.98 + Math.random() * 0.04);
    const fee = 0.003;

    return {
      price,
      fee,
      effectiveOut: price * (1 - fee),
    };
  }

  async getMeteoraQuote(tokenIn: string, tokenOut: string, amount: number): Promise<QuoteResult> {
    await sleep(200);

    const price = this.basePrice * (0.97 + Math.random() * 0.05);
    const fee = 0.002;

    return {
      price,
      fee,
      effectiveOut: price * (1 - fee),
    };
  }

  async executeSwap(dex: string, order: any, minAmountOut: number): Promise<SwapResult> {
    await sleep(2000 + Math.random() * 1000); // 2–3 sec

    // 5% chance of simulated blockchain failure
    if (Math.random() < 0.05) {
      throw new Error(`${dex} swap failed (simulated)`);
    }

    const executedPrice =
      this.basePrice * (0.98 + Math.random() * 0.03);

    if (executedPrice < minAmountOut) {
      throw new Error("Slippage exceeded during execution");
    }

    return {
      txHash: generateMockTxHash(),
      executedPrice,
    };
  }
}
