



        
function fnv1a32(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0; 
}







const STOP_WORDS = new Set([
  "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", 
  "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", 
  "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", 
  "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", 
  "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", 
  "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", 
  "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", 
  "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", 
  "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", 
  "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", 
  "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", 
  "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now",
  "check", "find", "document", "mentioned", "tell", "context", "search", "show", "give", "look", "say"
]);


export function textToSparseVector(text: string): { indices: number[], values: number[] } {
  const tokens = text.toLowerCase().match(/\w+/g) || [];
  
  const freqMap = new Map<number, number>();
  for (const token of tokens) {
    if (STOP_WORDS.has(token) || token.length <= 1) continue;
    
    const tokenId = fnv1a32(token);
    freqMap.set(tokenId, (freqMap.get(tokenId) || 0) + 1);
  }
  
  const scaledIndices: number[] = [];
  const scaledValues: number[] = [];
  
  for (const [tokenId, count] of freqMap.entries()) {
    scaledIndices.push(tokenId);
    scaledValues.push(1 + Math.log(count)); 
  }

  return {
    indices: scaledIndices,
    values: scaledValues
  };
}

