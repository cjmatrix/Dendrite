# Semantic Internet Search Caching

Internet search (via APIs like Tavily) can be expensive and slow down the AI response time. Because user queries are often repetitive or rephrased versions of identical questions (e.g., "Who is the CEO of OpenAI?" vs. "OpenAI current CEO"), Nurons implements a **Dual-Layer Caching System** that operates on all general AI chat interactions.

## The Dual-Layer Strategy

This strategy ensures that exact matches are served with zero latency, while semantic matches (meaning similar, but not identical phrasing) are resolved without hitting the external search API.

```mermaid
flowchart TD
    %% Define Styles
    classDef startNode fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#ffffff,rx:8,ry:8
    classDef cacheCheck fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#ffffff,rx:5,ry:5
    classDef hitNode fill:#10b981,stroke:#059669,stroke-width:2px,color:#ffffff,rx:5,ry:5
    classDef actionNode fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,color:#0f172a,rx:5,ry:5
    
    Query["User Query Requires Internet Search"]:::startNode --> Normalize["Normalize Query Text"]:::actionNode
    Normalize --> RedisCheck{"Exact Match in Redis?"}:::cacheCheck
    
    RedisCheck -- yes --> CacheHit1["Return Cached Context (L1)"]:::hitNode
    
    RedisCheck -- no --> Embed["Generate Query Embedding"]:::actionNode
    Embed --> QdrantCheck{"Semantic Match > 0.89 in Qdrant?<br/>(Within last 12 hours)"}:::cacheCheck
    
    QdrantCheck -- yes --> CacheHit2["Return Semantic Cached Context (L2)"]:::hitNode
    CacheHit2 --> CacheToRedis["Set in Redis for future L1 hits"]:::actionNode
    
    QdrantCheck -- no --> Tavily["Call Tavily Search API"]:::actionNode
    Tavily --> BuildContext["Build Markdown Context"]:::actionNode
    BuildContext --> SaveCache["Save to Redis (L1) & Qdrant (L2)"]:::actionNode
    SaveCache --> Return["Return Search Context"]:::startNode
```

## Detailed Flow

1. **L1 Cache (Exact String Match - Redis)**: 
   The query is sanitized and normalized. If an exact string match exists in Redis, the RAG context is returned instantly.
2. **L2 Cache (Semantic Vector Match - Qdrant)**: 
   If Redis misses, the query is converted into an embedding vector. Qdrant is queried to find mathematically similar past searches (similarity > `0.89`) made within the last 12 hours. This catches natural language variations.
3. **Execution & Cache Hydration**: 
   If both caches miss, the system performs a live Tavily API search. The markdown result is returned to the LLM and concurrently stored in both Redis and Qdrant to immediately satisfy future variations of the same query.
