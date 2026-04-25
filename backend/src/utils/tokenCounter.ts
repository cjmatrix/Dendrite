
export function estimateTokenCount(text: string): number {
  if (!text || text.length === 0) return 0;

  const estimatedTokens = Math.ceil(text.length / 4);
  return estimatedTokens;
}


export function exceedsTokenLimit(
  text: string,
  maxTokens: number = 512
): boolean {
  const estimatedTokens = estimateTokenCount(text);
  return estimatedTokens > maxTokens;
}


export function getTokenInfo(text: string, maxTokens: number = 512) {
  const estimatedTokens = estimateTokenCount(text);
  const isExceeded = estimatedTokens > maxTokens;

  return {
    estimatedTokens,
    maxTokens,
    isExceeded,
    remaining: Math.max(0, maxTokens - estimatedTokens),
    ratio: (estimatedTokens / maxTokens * 100).toFixed(2) + '%',
  };
}


export function truncateToTokenLimit(
  text: string,
  maxTokens: number = 512
): string {
  const maxChars = maxTokens * 4; // Reverse calculation
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + "...";
}
