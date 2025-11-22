// src/services/routing.ts

import { MockDexRouter } from "../dex/MockDexRouter";


const dex = new MockDexRouter(1); // base price = 1 (can be adjusted)

export type RoutingDecision = {
  bestDex: "raydium" | "meteora";
  raydiumQuote: any;
  meteoraQuote: any;
  selectedQuote: any;
};

export async function getBestRoute(
  tokenIn: string,
  tokenOut: string,
  amount: number
): Promise<RoutingDecision> {
  // Fetch quotes in parallel
  const [raydiumQuote, meteoraQuote] = await Promise.all([
    dex.getRaydiumQuote(tokenIn, tokenOut, amount),
    dex.getMeteoraQuote(tokenIn, tokenOut, amount),
  ]);

  // Compare effective output (after fee)
  let bestDex: "raydium" | "meteora";
  let selectedQuote;

  if (raydiumQuote.effectiveOut >= meteoraQuote.effectiveOut) {
    bestDex = "raydium";
    selectedQuote = raydiumQuote;
  } else {
    bestDex = "meteora";
    selectedQuote = meteoraQuote;
  }

  return {
    bestDex,
    raydiumQuote,
    meteoraQuote,
    selectedQuote,
  };
}
