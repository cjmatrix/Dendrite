# 🧠 Nurons (Dendrites): The AI-Native Cognitive Workspace

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Architecture](https://img.shields.io/badge/architecture-event--driven-blue)
![Database](https://img.shields.io/badge/database-MongoDB%20%7C%20Qdrant%20%7C%20Redis-red)
![AI](https://img.shields.io/badge/AI-Gemini%20%7C%20Voyage-orange)
![License](https://img.shields.io/badge/license-MIT-green)

**Nurons** is an enterprise-grade, agentic workspace designed to bridge the gap between information capture, intelligent knowledge retrieval, and active learning. Built with a robust event-driven architecture using process separation, Nurons transforms static documents into a dynamic, interactive "second brain." 

It employs a novel **4+1 Cognitive Memory Architecture**, an advanced **Hybrid RAG Pipeline**, and **Custom AI Guardrails** to provide unparalleled context awareness, automated spaced repetition (flashcards), and real-time execution sandboxing.

---

## 🌟 Core Product Features

*   **Instant Study Paths**: Tell the AI what you want to learn. It automatically structures the subject into folders, creates dedicated chats, and maps out a custom learning guide.
*   **Hierarchical Workspaces**: Create separate workspaces and nested folders for different subjects, injecting folder-specific personas and reference files.
*   **Document RAG**: Upload study materials (PDFs, books). Ask questions and get answers grounded entirely in your uploaded sources.
*   **Visual Learning Roadmaps**: Visualize complex topics in an interactive graph, navigating through node connections to map your progress.
*   **Continuous AI Memory**: The AI naturally references your past discussions and uploaded files, meaning you never have to re-explain context.
*   **Inherited Chat Memory (Branching)**: Connect discussions by branching off-shoot chats that automatically inherit the full memory and context of the parent chat, allowing you to explore deep tangents without disrupting the main conversation.
*   **Spaced Repetition (Recall)**: Convert any AI response into a flashcard. The system automatically schedules reviews to help you remember forever.
*   **One-Click Workspace Sharing**: Share entire folder structures and chats. Anyone with the link can copy your exact setup into their own workspace.

---

## ✨ Key Differentiators (Why this isn't just another ChatGPT wrapper)

*   **4+1 Cognitive Memory Architecture**: Blends 4 layers of AI context memory (short-term, rolling, semantic, global) with 1 layer of human active retention (Spaced Repetition).
*   **Intelligent Semantic Chunking**: Documents are split using NLP sliding windows and cosine similarity to ensure semantic boundaries, rather than naive token-based splitting.
*   **Pre-Generation Guardrails**: Built-in routing and sanitization layers intercept prompt injections and enforce topic consistency before interacting with core LLMs.
*   **[Dual-Layer Semantic Search Caching](./semantic_search_cache.md)**: Implements an advanced L1 (Exact Redis Match) and L2 (Semantic Qdrant Match) caching system to eliminate redundant Tavily internet searches while gracefully handling query variations.
*   **Event-Driven Asynchronous Workers**: CPU-intensive tasks (chunking, document parsing, embeddings) are offloaded to scalable background workers (Redis + BullMQ) ensuring zero UI latency.
*   **Active Learning Engine**: The system doesn't just store knowledge; it extracts recurring themes and auto-generates Spaced Repetition (SM-2) flashcards to actively help users retain what they read.

---

## 🏗️ System Architecture

The infrastructure is built to scale horizontally using a modern stack and Clean Architecture principles.

*For full details, see [System Architecture Diagram](./system_architecture.md).*

### Core Components:
- **Client Layer**: React 18 + Vite, highly interactive UI, optimized state management (Redux/React Query).
- **API Layer (Node.js/Express)**: Follows Clean Architecture use-cases, handling user logic, security, rate-limiting, and Server-Sent Events (SSE) for streaming AI responses.
- **Async Pipeline**: Built on Redis and BullMQ to prevent main-thread blocking, consisting of:
  - **Fast Worker**: Handles lightweight, immediate tasks like dispatching emails and scheduling Recall (Spaced Repetition) flashcards.
  - **AI Worker**: Manages embedding generation, automatic code descriptions, and rolling chat summaries.
  - **CPU Worker**: Dedicated exclusively to heavy NLP tasks like structural document parsing and semantic chunking.
- **Observability**: Fully instrumented with Prometheus, Grafana, and Loki for metrics, monitoring, and log aggregation.

---

## 🧠 The 4+1 Cognitive Memory Architecture

To ensure the AI never loses context and understands the user over time, Nurons implements a hierarchical memory structure:

1.  **Layer 1: Working Memory (Short-Term AI Context)**: A sliding context window that sends the last 20 messages directly to the LLM. It intelligently fills context deficits from parent chat chains if needed.
2.  **Layer 2: Rolling Summary (Mid-Term AI Context)**: An AI-compressed state of the conversation, updated every 20 messages, injected as `[ACTIVE CONVERSATION STATE]`.
3.  **Layer 3: Semantic Vector RAG (Long-Term AI Context)**: A triple-parallel search system pulling semantically relevant document chunks, code blocks, and past chat facts using Qdrant (cosine similarity) + BM25 keyword matching, optimized by a Voyage AI Reranker.
4.  **Layer 4: Global Memory (Cross-Session AI Context)**: A background worker periodically scans chat summaries to build a global user profile of preferences, expertise, and cross-domain connections.
5.  **+1 Layer: Spaced Repetition (Permanent Human Retention)**: Uses the SM-2 algorithm to extract core concepts into auto-scheduled recall cards, pinging users via push notifications when it's time to review.

*For deep dive, read [Memory Architecture](./memory_architecture.md).*

---

## 📄 Advanced RAG Pipeline

Our Retrieval-Augmented Generation (RAG) is designed for production-level accuracy:

1.  **Ingestion & Parsing**: Validates magic bytes, caches hashes in Redis, and uses **LlamaParse** for high-fidelity markdown extraction from PDFs.
2.  **Semantic Chunking**: Segments markdown based on structural elements and semantic boundaries (via cosine similarity drops), completely avoiding arbitrary cut-offs.
3.  **Hybrid Retrieval**: Whenever a query is made, the system performs a hybrid search:
    - **Vector Match**: Finding semantic meaning.
    - **BM25**: Finding exact lexical keyword matches.
4.  **Reranking**: The top results are pushed through a cross-encoder Reranker model to guarantee the LLM receives only the absolute highest-fidelity context.

*For full details, see [Document Pipeline](./DocumentPipeline.md).*

---

## 🛡️ Custom AI Guardrails

Security is non-negotiable. Nurons implements custom guardrails wrapped around the core LLM calls:
*   **Pre-Generation Guardrails**: Utilizes an upfront routing and sanitization model to intercept prompt injections, jailbreak attempts, and off-topic wandering before they ever reach the core LLM.
*   **Real-Time Streaming**: To ensure ultra-low latency, the verified prompts are streamed directly via Server-Sent Events (SSE) back to the user without artificial post-generation delays.

---

## 💻 Tech Stack

**Frontend:**
- React 18, Vite, TypeScript
- Redux, React Query
- Tailwind CSS

**Backend & Event-Driven Workers:**
- Node.js, Express, TypeScript (Clean Architecture)
- Redis & BullMQ (Job Queues & Background Workers)
- Docker & Nginx Reverse Proxy

**Databases & Storage:**
- **MongoDB Atlas**: Persistent application data & User Profiles.
- **Qdrant**: Vector Database for high-dimensional embeddings.
- **Redis**: Caching, Session state, Pub/Sub.
- **Cloudinary / AWS S3**: Object storage for documents.

**AI & ML Models:**
- **Google Gemini**: Core foundational LLM for reasoning and chat.
- **Voyage AI**: State-of-the-art Embeddings and Reranking models.
- **LlamaParse**: Advanced OCR and document structuring.

---

## 🚀 Architecture & Deployment Strategy

> **Note**: This repository is open-sourced primarily for architectural review and portfolio demonstration. Direct local execution requires proprietary API keys (Voyage AI, Gemini, etc.) and is not officially supported for public use.

Nurons is designed to be highly scalable and is deployed using modern infrastructure-as-code principles:

*   **Containerization**: The backend API and all background asynchronous workers (Fast, AI, CPU) are fully containerized using Docker, allowing them to be scaled horizontally based on queue pressure.
*   **Reverse Proxy & SSL**: Nginx acts as the edge gateway, routing `/api/*` traffic to the Node.js instances while automatically managing SSL certificate renewals via Certbot.
*   **Environment Constraints**: Strict separation of environments is maintained. Sensitive credentials, LLM API keys, and database URIs are injected securely at runtime via `.env` files and CI/CD pipelines.
*   **Infrastructure Management**: Development environments are orchestrated via `docker-compose`, spinning up isolated networks for Redis and Qdrant vector databases before attaching the application workers.

---

## 📈 Roadmap & SaaS Strategy

Nurons is positioned as a prosumer tool heavily targeting students, researchers, and software engineers who need to bridge the gap between note-taking and active learning. 

*Read more about our Go-To-Market strategy in the [SaaS Strategy Report](./nurons_saas_strategy.md).*

---

> **Developer Note for Recruiters & Hiring Managers:** 
> This project was built to demonstrate my ability to architect complex, scalable, distributed systems integrating modern AI/ML pipelines. From handling asynchronous job queues and implementing custom semantic chunking algorithms to designing a robust 4+1 cognitive memory hierarchy—it reflects my deep understanding of full-stack engineering, clean architecture, and applied AI. Let's connect!
