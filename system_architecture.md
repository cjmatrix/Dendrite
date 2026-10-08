# Nurons (Dentrites) System Architecture

This diagram maps out the full deployment architecture, including the Dockerized microservices, background workers, observability stack, and external cloud services.

<img width="5925" height="3171" alt="SSv9png" src="https://github.com/user-attachments/assets/4b9c3673-5521-4c61-809f-53d6c77c0d7d" />


# Abstract System Architecture

```mermaid
graph TD
    %% Define Styles
    classDef frontend fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:#fff
    classDef proxy fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef worker fill:#8b5cf6,stroke:#4c1d95,stroke-width:2px,color:#fff
    classDef database fill:#ef4444,stroke:#991b1b,stroke-width:2px,color:#fff
    classDef external fill:#6366f1,stroke:#3730a3,stroke-width:2px,color:#fff
    classDef monitoring fill:#64748b,stroke:#334155,stroke-width:2px,color:#fff

    %% Frontend & CDN
    subgraph Edge ["Edge Network (AWS)"]
        CF["CloudFront (CDN)"]:::frontend
        S3["S3 Bucket (React/Vite SPA)"]:::database
        CF -.->|Fetches static assets| S3
    end

    User["Web Browser"] -->|HTTPS| CF
    User -->|API Requests| Nginx

    %% Backend Server (EC2)
    subgraph Server ["EC2 Instance (Docker Compose)"]
        Nginx["Nginx Reverse Proxy & SSL"]:::proxy
        Certbot["Certbot (SSL Renewal)"]:::monitoring

        subgraph CoreBackend ["Node.js API Services"]
            API["Backend API (Express)"]:::backend
        end

        subgraph BackgroundWorkers ["BullMQ Asynchronous Workers"]
            FastWorker["Fast Worker (Quick Tasks)"]:::worker
            AIWorker["AI Worker (LLM & Generation)"]:::worker
            CPUWorker["CPU Worker (Chunking/Parsing)"]:::worker
        end

        subgraph Infra ["Local Infrastructure"]
            Redis["Redis (Cache & Message Queue)"]:::database
        end
        
        subgraph Observability ["Monitoring Stack"]
            Prometheus["Prometheus (Metrics)"]:::monitoring
            Grafana["Grafana (Dashboards)"]:::monitoring
            Loki["Loki (Log Aggregation)"]:::monitoring
        end
    end

    %% Internal Routing
    Nginx -->|Routes /api/*| API
    
    %% API to Queues
    API -->|Enqueues Jobs| Redis
    API -->|Reads/Writes| Redis
    
    %% Workers pulling from Queue
    Redis -->|Consumes Jobs| FastWorker
    Redis -->|Consumes Jobs| AIWorker
    Redis -->|Consumes Jobs| CPUWorker

    %% Monitoring Connections
    Prometheus -.->|Scrapes| API
    Grafana -.->|Reads| Prometheus
    Grafana -.->|Reads| Loki
    API -.->|Pushes Logs| Loki
    Workers -.->|Pushes Logs| Loki

    %% External APIs & Databases
    subgraph ExternalServices ["External Cloud Services (SaaS & DBaaS)"]
        Mongo["MongoDB Atlas (Persistent Data)"]:::database
        Qdrant["Qdrant Cloud (Vector DB)"]:::database
        Voyage["Voyage AI (Embeddings & Reranking)"]:::external
        Gemini["Google Gemini (LLM)"]:::external
        Paddle["Paddle (Billing)"]:::external
        Cloudinary["Cloudinary (Object Storage)"]:::external
    end

    %% Backend to External
    API -->|CRUD Users/Chats| Mongo
    API -->|Webhooks| Paddle
    
    CPUWorker -->|Uploads| Cloudinary
    CPUWorker -->|Embeds Chunks| Voyage
    CPUWorker -->|Stores Vectors| Qdrant
    
    AIWorker -->|Prompts| Gemini
    AIWorker -->|Generates Roadmaps/Flashcards| Gemini
    AIWorker -->|Vector Search| Qdrant
```


# Observability stack

<img width="2599" height="1416" alt="Observaibilty" src="https://github.com/user-attachments/assets/730cf682-a569-4a0a-9f46-2db7836f0074" />

