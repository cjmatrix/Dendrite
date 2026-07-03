# Nurons (Dentrites) 4-Layer Memory Architecture

This diagram visualizes how the AI processes user intent through four distinct memory layers, preventing context loss and enabling autonomous learning.

```mermaid
graph TD
    %% Define Styles
    classDef user fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:#fff
    classDef layer1 fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef layer2 fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff
    classDef layer3 fill:#8b5cf6,stroke:#4c1d95,stroke-width:2px,color:#fff
    classDef layer4 fill:#ef4444,stroke:#991b1b,stroke-width:2px,color:#fff
    classDef ai fill:#6366f1,stroke:#3730a3,stroke-width:2px,color:#fff

    User["User Query / Action"]:::user

    subgraph Layer1 ["Layer 1: Working Memory (Context)"]
        ChatContext["Active Chat History Window"]:::layer1
        QuickChat["Quick Chat Highlighted Context"]:::layer1
        InheritBranch["Inherited Branch (Parallel Timelines)"]:::layer1
    end

    subgraph Layer2 ["Layer 2: Structural Memory (Rules)"]
        FolderBehavior["Folder Behavior Settings"]:::layer2
        NestedStructure["Nested Folder Hierarchy"]:::layer2
        SystemPrompt["Custom System Prompts"]:::layer2
    end

    subgraph Layer3 ["Layer 3: Semantic Memory (RAG Pipeline)"]
        BM25["Lexical Search (BM25)"]:::layer3
        SemanticChunk["Semantic Chunking"]:::layer3
        VoyageReranker["Voyage AI Reranker"]:::layer3
        Qdrant["Qdrant Vector DB"]:::layer3
        
        SemanticChunk --> Qdrant
        Qdrant --> BM25
        BM25 --> VoyageReranker
    end

    subgraph Layer4 ["Layer 4: Active Retention (Long-Term)"]
        RecallCards["Recall Cards (Auto-Generated)"]:::layer4
        SpacedRepetition["Spaced Repetition Algorithm"]:::layer4
        
        RecallCards --> SpacedRepetition
    end

    subgraph Intelligence ["Agentic Processing"]
        Gemini["Google Gemini LLM"]:::ai
        RoadmapAgent["Autonomous Roadmap Agent"]:::ai
    end

    %% Flow of Data
    User --> Layer1
    User --> Layer2
    
    Layer1 --> Intelligence
    Layer2 --> Intelligence
    
    %% Semantic retrieval requested by AI or User
    Intelligence <-->|Queries Knowledge Base| Layer3
    Layer3 -.->|Feeds Context| Intelligence
    
    %% Converting raw chat/docs into flashcards
    Layer1 -.->|Extracts Concepts| Layer4
    Layer3 -.->|Extracts Concepts| Layer4
    Intelligence -->|Generates Cards| RecallCards
```
