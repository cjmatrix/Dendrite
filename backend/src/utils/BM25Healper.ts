
//   A fast 32-bit hashing function (FNV-1a) to convert string tokens into unique uint32 IDs.




        
function fnv1a32(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0; // Ensure unsigned 32-bit integer
}







//    Tokenizes text and calculates Term Frequency (TF).

export function textToSparseVector(text: string): { indices: number[], values: number[] } {
  
  const tokens = text.toLowerCase().match(/\w+/g) || [];
  

  const freqMap = new Map<number, number>();
  for (const token of tokens) {
    const tokenId = fnv1a32(token);
    freqMap.set(tokenId, (freqMap.get(tokenId) || 0) + 1);
  }
  

  return {
    indices: Array.from(freqMap.keys()),
    values: Array.from(freqMap.values())
  };
}

