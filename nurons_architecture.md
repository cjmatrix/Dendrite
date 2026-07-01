# Nurons System Architecture

Below is the detailed PlantUML diagram mapping out your cloud deployment (AWS S3 + CloudFront + EC2) and your backend's Service-Oriented Architecture (SOA). 

```plantuml
@startuml
skinparam componentStyle uml2
skinparam linetype ortho
skinparam nodesep 40
skinparam ranksep 60
skinparam backgroundColor #1E1E1E
skinparam fontColor #FFFFFF
skinparam arrowColor #60A5FA
skinparam borderColor #3B82F6

title <color:#FFFFFF>Nurons - Service Oriented Architecture (SOA) & Cloud Deployment</color>

actor "<color:#FFFFFF>User (Browser)</color>" as User

cloud "<color:#FFFFFF>AWS Cloud Infrastructure</color>" {
  
  package "<color:#FFFFFF>Frontend Environment</color>" {
    node "<color:#FFFFFF>CloudFront (CDN)</color>" as CF #2D3748
    database "<color:#FFFFFF>S3 Bucket\n(React + Vite SPA)</color>" as S3 #2D3748
  }
  
  node "<color:#FFFFFF>Backend EC2 Instance</color>" as EC2 #1A202C {
    component "<color:#FFFFFF>Nginx\n(Reverse Proxy, SSL, CORS)</color>" as Nginx #4A5568
    
    package "<color:#FFFFFF>Node.js Backend (Docker Compose)</color>" {
      component "<color:#FFFFFF>API Controllers & Middleware\n(Express, Rate Limiting, Auth)</color>" as Routers #2B6CB0
      
      package "<color:#FFFFFF>Application Layer (Use Cases)</color>" {
        component "<color:#FFFFFF>Chat & Agent\nService</color>" as ChatSVC #3182CE
        component "<color:#FFFFFF>Document & RAG\nService</color>" as RAGSVC #3182CE
        component "<color:#FFFFFF>Recall (Spaced Repetition)\nService</color>" as RecallSVC #3182CE
        component "<color:#FFFFFF>Auth & Identity\nService</color>" as AuthSVC #3182CE
        component "<color:#FFFFFF>Billing & Payments\nService</color>" as BillingSVC #3182CE
      }
      
      package "<color:#FFFFFF>Infrastructure Layer (Data & Queues)</color>" {
        database "<color:#FFFFFF>MongoDB\n(Users, Chats, Folders)</color>" as Mongo #276749
        database "<color:#FFFFFF>Redis / BullMQ\n(Caching, Rate Limits, Jobs)</color>" as Redis #C53030
        database "<color:#FFFFFF>Qdrant\n(Vector Database)</color>" as Qdrant #553C9A
      }
    }
  }
}

cloud "<color:#FFFFFF>External 3rd Party APIs</color>" {
  component "<color:#FFFFFF>Voyage AI\n(Embeddings & Reranker)</color>" as Voyage #4A5568
  component "<color:#FFFFFF>Google Gemini\n(LLM Inference)</color>" as Gemini #4A5568
  component "<color:#FFFFFF>Paddle\n(Billing & Subscriptions)</color>" as Paddle #4A5568
  component "<color:#FFFFFF>Cloudinary\n(File Object Storage)</color>" as Cloudinary #4A5568
}

' User interactions
User --> CF : "Visits nurons.me (HTTPS)"
CF --> S3 : "Fetches Static Assets (HTML/JS/CSS)"
CF --> Nginx : "Routes /api/* requests"

' Nginx to Backend
Nginx --> Routers : "Proxies API Traffic (Port 3000)"

' Routers to Services (SOA)
Routers --> ChatSVC
Routers --> RAGSVC
Routers --> RecallSVC
Routers --> AuthSVC
Routers --> BillingSVC

' Application logic to Infrastructure
ChatSVC --> Mongo : "Persists chat history"
ChatSVC --> Gemini : "Streams prompt completions"
ChatSVC --> RAGSVC : "Requests Context/Docs"

RAGSVC --> Redis : "Queues Async Document Parsing"
RAGSVC --> Qdrant : "Stores/Searches Semantic Vectors"
RAGSVC --> Voyage : "Generates Text Embeddings"
RAGSVC --> Cloudinary : "Uploads/Retrieves Raw PDFs"

RecallSVC --> Mongo : "Saves Spaced Repetition Cards"
RecallSVC --> Redis : "Queues automated flashcard generation"

AuthSVC --> Mongo : "Reads/Writes User Profiles"
AuthSVC --> Redis : "Caches OTPs & Sessions"

BillingSVC --> Mongo : "Updates User Subscription Tiers"
BillingSVC --> Paddle : "Creates Checkouts & Receives Webhooks"

@enduml
```

### Explanation of the Architecture:
1.  **The Frontend Edge:** Your users never directly touch your EC2 server for the UI. CloudFront serves your compiled React application from the S3 bucket globally with edge caching.
2.  **Traffic Routing:** API calls from the browser hit CloudFront, which forwards `/api/*` traffic to your EC2 instance. Nginx handles the SSL termination and securely passes the traffic internally to your Dockerized Node.js backend.
3.  **Service-Oriented Architecture (SOA):**
    *   **Presentation (Controllers):** Handles the raw Express endpoints, auth guards, and rate limiting.
    *   **Application (Use Cases):** Your business logic is strictly decoupled into distinct services (Chat, RAG, Recall, Billing).
    *   **Infrastructure (Adapters):** MongoDB holds persistent relational/document state. Redis holds ephemeral state and manages asynchronous processing queues via BullMQ (essential for heavy RAG workloads). Qdrant specifically handles vector mathematics for similarity search.
4.  **External Integrations:** Decoupled adapters communicate with Voyage (for dense embeddings), Gemini (for reasoning), Paddle (for SaaS revenue), and Cloudinary (for blob storage).
