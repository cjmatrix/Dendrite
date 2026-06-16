# Advanced RAG Pipeline

This repository implements an advanced Retrieval-Augmented Generation (RAG) pipeline designed for intelligent document interaction and knowledge retrieval. It features robust document ingestion, semantic chunking, hybrid search, and personalized response generation for user queries.

## Table of Contents

1.  [Features](#features)
2.  [Pipeline Overview](#pipeline-overview)
    *   [A. Document Ingestion Pipeline](#a-document-ingestion-pipeline)
    *   [B. User Query Processing Pipeline](#b-user-query-processing-pipeline)
3.  [Core Components](#core-components)
4.  [Setup](#setup)
5.  [Usage](#usage)

## Features

*   **Robust Document Ingestion**: Secure and efficient document upload with in-stream validation and content hashing.
*   **Intelligent Document Parsing**: Leverages LlamaParse for high-quality Markdown extraction from complex documents (e.g., PDFs).
*   **Semantic Chunking**: Dynamically segments documents based on semantic shifts rather than arbitrary token limits, ensuring contextual integrity.
*   **Hybrid Retrieval**: Combines semantic (vector similarity) and keyword (BM25) search for comprehensive and precise document chunk retrieval.
*   **Contextual Reranking**: Optimizes retrieved chunks using a reranker model to provide the most relevant context to the LLM.
*   **Personalized Responses**: Integrates user preferences for tailoring LLM outputs.
*   **Long-Term Memory Integration**: Utilizes a separate memory collection for conversational context and prior interactions.
*   **External Search Integration**: Ability to perform internet searches when a query requires real-time or broader information.
*   **Caching Mechanisms**: Employs Redis for global-level document caching (LlamaParse results) to reduce processing overhead.

## Pipeline Overview

### A. Document Ingestion Pipeline

This pipeline handles the secure and efficient upload, validation, parsing, and chunking of new documents.

`plantuml
@startuml
skinparam backgroundcolor transparent
skinparam shadowing false
skinparam monochrome true
skinparam packageStyle rectangle
top to bottom direction

start
:User Uploads Document (e.g., PDF);
:In-Stream Validation (Busboy & Magic Bytes);
if (Validation Fails?) then (yes)
  :Reject Document;
  stop
else (no)
  :Store Document Temporarily;
  :Compute Content Hash (for Caching);
  :Check LlamaParse Cache (Redis);
  if (Cache Hit?) then (yes)
    :Retrieve Markdown from Cache;
  else (no)
    :Call LlamaParse API to Extract Markdown;
    :Cache LlamaParse Result (Redis);
  endif
  :Apply Semantic Chunking Logic;
  :Store Chunks in Document Collection (with Embeddings & Metadata);
endif
:Document Ready for Retrieval;
stop
@enduml

**Detailed Steps:**

1.  **Document Upload**: A user initiates the upload of a document (e.g., PDF).
2.  **In-Stream Validation**:
    *   `Busboy` is used for efficient parsing of multipart form data.
    *   `Magic Bytes` are checked in-stream to verify the file type (e.g., PDF, DOCX) ensuring security and preventing processing of malicious or incorrect file formats.
3.  **Temporary Storage & Content Hashing**: Validated documents are temporarily stored, and a unique `content hash` is computed. This hash is crucial for global-level caching.
4.  **LlamaParse Markdown Extraction**:
    *   Before invoking the LlamaParse API, the system checks a `Redis` cache using the document's `content hash`.
    *   If a `cache hit` occurs, the pre-parsed Markdown is retrieved, saving API calls and processing time.
    *   If a `cache miss`, the document is sent to the `LlamaParse API` for advanced PDF/document parsing into structured Markdown.
    *   The resulting Markdown is then stored in `Redis` with an appropriate TTL.
5.  **Semantic Chunking**: The extracted Markdown undergoes a sophisticated `Semantic Chunking` process (as described in your `SemanticChunkingService`). This involves:
    *   Breaking Markdown into structural `Segments` (headings, paragraphs, lists, code, tables).
    *   Embedding these segments using `embeddingService`.
    *   Detecting semantic boundaries using a `sliding window` and `cosine similarity` to ensure chunks represent coherent topics.
    *   Enforcing `min/max token limits` to create optimal chunk sizes for LLMs.
6.  **Chunk Storage**: The final `Semantic Chunks`, along with their `embeddings` and rich `metadata` (headings, kinds, indices), are stored in the `long-term document collection` (e.g., Qdrant, Pinecone).

### B. User Query Processing Pipeline

This pipeline takes a user query, retrieves relevant information, and generates a personalized response using an LLM.

`plantuml
@startuml
skinparam backgroundcolor transparent
skinparam shadowing false
skinparam monochrome true
skinparam packageStyle rectangle
left to right direction

start
:User Query;
:Check if Internet Search Needed?;
if (Internet Search Needed?) then (yes)
  :Perform Internet Search;
  :Integrate Search Results;
endif
:Embed Query;
:Retrieve Memory from Long-Term Memory Collection (RAG);
:Fetch User Preferences from User Profile;

partition "Semantic Chunking Logic (Document Retrieval)" {
  :Retrieve Data from Document Collection;
  note right: Hybrid Search:
  - Semantic Cosine Similarity
  - BM25 Keyword Search
  :Select Top 20 Chunks;
  :Pass Top 20 Chunks into Reranker;
  :Reranker Produces Optimized Context;
}

:Pass Optimized Context to LLM;
:LLM Generates Response;
stop
@enduml

**Detailed Steps:**

1.  **User Query**: The user submits a natural language query.
2.  **Internet Search Check**: An initial assessment determines if the query requires up-to-date information or external context not available in the internal knowledge base. If so, an internet search is performed, and results are integrated.
3.  **Query Embedding**: The user query is transformed into a high-dimensional `vector embedding` using `embeddingService`.
4.  **Long-Term Memory Retrieval (RAG)**: The embedded query is used to retrieve relevant conversational history or prior context from a `long-term memory collection` (e.g., chat history, user-specific facts) using RAG principles.
5.  **User Preference Fetching**: User-specific preferences (from the `User Profile`) are fetched to tailor the LLM's response style, tone, or content to the user's needs.
6.  **Semantic Chunking Logic (Document Retrieval)**: This is the core RAG step for document interaction:
    *   **Hybrid Search**: The embedded query is used to retrieve relevant chunks from the `document collection` using a `hybrid search` approach:
        *   **Semantic Cosine Similarity**: Compares the query embedding against chunk embeddings to find semantically similar content.
        *   **BM25 Keyword Search**: Performs a traditional keyword-based search to ensure recall of important terms even if their semantic similarity is low.
    *   **Top 20 Chunks Selection**: A pool of the top 20 most relevant chunks (from both semantic and BM25 searches) is selected.
    *   **Reranking**: These 20 chunks are passed through a `reranker model` (e.g., using Voyage AI or a cross-encoder model). The reranker re-evaluates the relevance of these chunks in the context of the query, selecting the absolute most pertinent ones and providing an "optimized context."
7.  **LLM Generation**: The user query, retrieved long-term memory, user preferences, and the reranked, optimized document context are all fed into the `Large Language Model (LLM)`.
8.  **Response Generation**: The LLM generates a comprehensive, contextually aware, and personalized response to the user's query.

## Core Components

*   **`tsyringe`**: Dependency injection framework for managing service dependencies and promoting clean architecture.
*   **`Redis`**: Utilized for high-speed caching of LlamaParse results and potentially other temporary data.
*   **`BullMQ`**: (Implied, often used with Redis for background jobs) Likely used for asynchronous processing of document uploads and chunking.
*   **`LlamaCloud / LlamaParse`**: External API for advanced document parsing (especially PDFs) into structured Markdown.
*   **`Voyage AI`**: (Implied from user profile) Potentially used for advanced embedding models or reranking.
*   **`Qdrant`**: (Implied from user profile) Likely the vector database used for storing document embeddings and enabling efficient semantic search.
*   **`embeddingService`**: Custom service encapsulating calls to an embedding provider (e.g., Gemini, OpenAI) to generate vector representations of text.
*   **`computeFileHash`**: Utility for generating content hashes of files, crucial for cache key generation.

