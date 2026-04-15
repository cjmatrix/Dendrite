# Semantic Chunking Pipeline - Integration Guide

## Overview
Your semantic chunking pipeline is now fully integrated with your backend. Here's what was implemented:

## Architecture

```
📄 Document Upload
    ↓
📋 FileUploadService (validates & uploads to Cloudinary)
    ↓
📊 documentChunkingQueue (BullMQ)
    ↓
🔄 ProcessDocumentChunking (use-case)
    ↓
🔗 SemanticChunkingService (custom semantic algorithm)
    ├─ buildSegments() → Parse markdown structure
    ├─ embedBatch() → Jina embeddings (local)
    ├─ Boundary Detection → Cosine similarity
    ├─ Token Limits → Enforce min/max chunk sizes
    ↓
🗄️ Qdrant Vector Store (semantic search)
```

## Files Created

### 1. **SemanticChunkingService.ts**
- Location: `backend/src/services/SemanticChunkingService.ts`
- Features:
  - Markdown segment parsing (tables, code, lists, blockquotes)
  - Batch embedding via `EmbeddingService`
  - Semantic boundary detection (cosine similarity)
  - Token-aware chunk size enforcement
  - Metadata tracking (headings, segment kinds, indices)

### 2. **ProcessDocumentChunking.ts** (Use-Case)
- Location: `backend/src/application/worker/use-cases/ProcessDocumentChunking.ts`
- Orchestrates:
  - Document extraction and chunking
  - Vector generation
  - Qdrant upsert with metadata
  - Outbox event status tracking

### 3. **documentChunkingQueue.ts**
- Location: `backend/src/queue/documentChunkingQueue.ts`
- Features:
  - BullMQ worker with concurrency limit (2)
  - Automatic retries (3 attempts)
  - Event logging for success/failure
  - Integrates with DIContainer

### 4. **Updated Vector Repository**
- Location: `backend/src/infrastructure/vector/repositories/QdrantVectorRepository.ts`
- New Methods:
  - `upsertDocumentVectors()` - Batch insert semantic chunks
  - `searchDocuments()` - Search with userId/chatId filters

### 5. **Updated ChatController**
- Imports document chunking queue
- On file upload success → queues semantic chunking job
- Passes: filePath, userId, chatId, fileName, outboxId

## How It Works

### Step 1: File Upload
```typescript
POST /api/v1/chats/upload/pdf
- User uploads document
- FileUploadService validates & uploads to Cloudinary
```

### Step 2: Queue Chunking Job
```typescript
// In chatController.uploadChatPdf()
await documentChunkingQueue.add('chunk-document', {
  outboxId: crypto.randomUUID(),
  filePath: '/tmp/document.pdf',
  userId: req.user.id,
  chatId: req.body.chatId,
  fileName: 'document.pdf'
});
```

### Step 3: Semantic Processing
```typescript
// Worker processes job
SemanticChunkingService.processDocument(filePath)
  ↓
buildSegments() → Parse markdown structure
  ↓
embedBatch() → Get embeddings for all segments (batch)
  ↓
Boundary Detection → Find semantic breaks (cosine similarity < 0.45)
  ↓
enforceTokenLimits() → Merge/split to respect 80-8000 token limits
  ↓
Generate 768-dim vectors for each chunk
```

### Step 4: Store in Qdrant
```typescript
upsertDocumentVectors([
  {
    id: 'chunk-uuid',
    vector: [0.12, 0.34, ...768 dims],
    payload: {
      sourceId, sourceType: 'document', userId, chatId, fileName,
      content: { text, chunkIndex, headings, kinds },
      tokenEstimate, startIndex, endIndex
    }
  },
  // ... more chunks
])
```

## Configuration Options

### ChunkingOptions (in ProcessDocumentChunking)

```typescript
interface ChunkingOptions {
  similarityThreshold?: number;    // Default: 0.45 (lower = more chunks)
  windowSize?: number;             // Default: 3 (context for similarity)
  minChunkTokens?: number;         // Default: 80
  maxChunkTokens?: number;         // Default: 8000 (Jina's limit ~8192)
  embedChunks?: boolean;           // Default: true (embed each chunk)
}
```

**Customize in ProcessDocumentChunking.execute()**:
```typescript
const chunks = await this.chunkingService.processDocument(filePath, {
  minChunkTokens: 100,
  maxChunkTokens: 6000,
  similarityThreshold: 0.5,
});
```

## Retrieval Example

### Search Documents by Query
```typescript
// In your PrepareMessage or query handler:

const queryEmbedding = await embeddingService.embed(userQuery, 'RETRIEVAL_QUERY');

const documentChunks = await vectorRepository.searchDocuments(
  queryEmbedding,
  userId,
  [chatId],
  topK = 5
);

// Results include:
// - score: similarity (0-1)
// - document: { text, chunkIndex, totalChunks, headings, kinds }
// - metadata: { sourceId, sourceType, fileName, tokenEstimate, ... }
```

## Segment Types Recognized

- **heading** - Markdown headings (`# Title`)
- **paragraph** - Plain text paragraphs
- **sentence** - Individual sentences (if paragraph has 2+ sentences)
- **table** - Markdown tables (`| col | col |`)
- **code** - Fenced code blocks (``` or ~~~)
- **blockquote** - Block quotes (`> quote`)
- **list** - Ordered/unordered lists

## Token Estimation

The service uses a conservative estimate:
```
1 token ≈ 3.5 characters
```

This is to avoid exceeding Jina's 8192 token limit with actual encoding.

## Metadata Attached to Each Chunk

```typescript
{
  headings: ['Section 1', 'Subsection A'],     // Context path
  kinds: ['heading', 'paragraph'],              // Segment types
  chunkIndex: 0,                                // Position in doc
  totalChunks: 12                               // Total chunks
}
```

## Environment Variables Required

```bash
EMBEDDING_ENDPOINT=http://localhost:7997/embeddings
EMBEDDING_MODEL=jinaai/jina-embeddings-v2-base-code
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Health Check

Your server now checks embedding service on startup:

```
✅ Server logs:
✅ Embedding service is healthy
✅ Connected to MongoDB
✅ Initialized Qdrant
Server running on port 5000
```

If embeddings aren't running:
```
⚠️ Embedding service is not responding. Run 'npm run infra:start'
```

## Performance Considerations

### Batching
- Documents are semantically chunked in a single pass
- All segments embedded via `embedBatch()` (1 HTTP call)
- Much faster than individual requests

### Concurrency
- Queue: max 2 concurrent chunking jobs (prevent overload)
- Configure in `documentChunkingQueue.ts`: `concurrency: 2`

### Storage
- Each chunk vector: ~768 floats × 4 bytes = ~3KB
- Large document (1000 chunks): ~3MB in Qdrant
- Vectors stored with full segment metadata

## Debugging

### View Queue Jobs
```bash
# In Redis client:
LLEN bull:document-chunking:processing
LLEN bull:document-chunking:completed
LLEN bull:document-chunking:failed
```

### Logs
```
📎 Queued document chunking for: proposal.pdf
✅ Processed 45 semantic chunks from document: proposal.pdf
✅ Upserted 45 document vectors to Qdrant
```

### Common Issues

**Queue not processing?**
- Check Redis is running: `redis-cli ping` → `PONG`
- Check worker is alive: `npm run dev` logs should show worker registered

**Chunks too small/large?**
- Adjust `minChunkTokens` and `maxChunkTokens` in `ProcessDocumentChunking.execute()`
- Tune `similarityThreshold` (0.3-0.7 range)

**Embeddings failing?**
- Ensure Jina engine running: `npm run infra:start`
- Check endpoint: `curl http://localhost:7997/models`

## Next Steps

1. **Test document upload** - Upload a PDF and check queue processing
2. **Verify Qdrant** - Query vectors to ensure chunks stored
3. **Test retrieval** - Use `searchDocuments()` in your chat flow
4. **Tune parameters** - Adjust chunk sizes based on results
5. **Monitor performance** - Track chunking time and quality

## Integration Points

Already done ✅:
- ✅ EmbeddingService class wrapping your Jina embeddings
- ✅ SemanticChunkingService with full pipeline
- ✅ Document chunking queue (BullMQ)
- ✅ Vector repository upsert methods
- ✅ DIContainer registration
- ✅ Server startup health check

Still to integrate (optional):
- Add search/retrieval to chat flow
- Create admin endpoint to view chunk stats
- Add reprocessing logic for document updates
- Implement chunk caching for repeated queries
