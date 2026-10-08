# Nurons (Dendrites) 4+1 Cognitive Memory Architecture

This diagram visualizes how the AI processes user intent through five distinct memory layers, from short-term context windows down to long-term cross-session knowledge and permanent spaced repetition.

```mermaid
graph TD
    %% Define Professional Styles (Tailwind Inspired)
    classDef user fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#ffffff,rx:8,ry:8
    classDef innerProcess fill:#f8fafc,stroke:#cbd5e1,stroke-width:2px,color:#0f172a,rx:5,ry:5
    classDef layerBox fill:none,stroke:#94a3b8,stroke-width:2px,stroke-dasharray: 5 5,color:#64748b
    classDef guardrails fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#ffffff,rx:5,ry:5
    classDef prompt fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#ffffff,rx:5,ry:5
    
    UserMsg["User Message Arrives<br/>(e.g. 'Explain SQL JOIN optimization')"]:::user

    %% Layer 3: Vector RAG (Long-Term)
    subgraph L3 ["Layer 3: Vector RAG (Long-Term)"]
        subgraph TPS ["Triple Parallel Search"]
            L3_Code["code_blocks<br/>Dual vector match<br/>(code + description)"]:::innerProcess
            L3_Chat["chat_summaries<br/>Extracted facts<br/>similarity > 0.62"]:::innerProcess
            L3_Docs["documents<br/>Semantic chunks<br/>from uploaded files"]:::innerProcess
        end
        L3_Dedup["Deduplicate against<br/>sliding window content"]:::innerProcess
        
        L3_Code --> L3_Dedup
        L3_Chat --> L3_Dedup
        L3_Docs --> L3_Dedup
    end

    %% Layer 1: Sliding Context Window
    subgraph L1 ["Layer 1: Sliding Context Window (Short-Term)"]
        L1_Window["Last 20 messages<br/>sent directly to Gemini"]:::innerProcess
        L1_Deficit["If chat has < 20 messages:<br/>fill deficit from<br/>contextParent chain<br/>(max 300 ancestors)"]:::innerProcess
    end

    %% Layer 2: Rolling Summary
    subgraph L2 ["Layer 2: Rolling Summary (Mid-Term)"]
        L2_Summary["AI-compressed summary<br/>updated every 20 messages"]:::innerProcess
        L2_Inject["Injected as:<br/>[ACTIVE CONVERSATION STATE]<br/>in system prompt"]:::innerProcess
        L2_Summary --> L2_Inject
    end

    %% Layer 5: Global Memory
    subgraph L5 ["Layer 5: Global Memory (Cross-Session)"]
        L5_Worker["Global Memory Worker<br/>Periodically scans all<br/>chat summaries per user →<br/>Extracts recurring themes,<br/>expertise signals, and<br/>cross-domain connections"]:::innerProcess
        
        L5_Update["Update profile +<br/>upsert knowledge vectors"]:::innerProcess
        
        subgraph L5_Qdrant ["Global Knowledge (Qdrant)"]
            L5_UK["user_knowledge<br/>Cross-chat entities,<br/>concepts,<br/>and relationships the user<br/>has learned over time"]:::innerProcess
            L5_UQ["user_queries<br/>Historical query patterns<br/>for inline suggestions<br/>and personalization"]:::innerProcess
        end
        
        subgraph L5_Mongo ["User Profile (MongoDB)"]
            L5_Prefs["User Preferences<br/>├─ Preferred language<br/>├─ Learning style<br/>├─ Expertise level<br/>└─ Response format preference"]:::innerProcess
        end
        
        L5_Worker --> L5_Update
        L5_Update --> L5_Qdrant
        L5_Update --> L5_Mongo
    end

    %% Core Gemini API & Guardrails
    subgraph GeminiAPI ["Gemini API"]
        Prompt["Final Prompt =<br/>System Instruction<br/>+ Global User Profile<br/>+ Folder Behavior<br/>+ Inherited Summaries<br/>+ Rolling Summary<br/>+ RAG Code Snippets<br/>+ RAG Facts<br/>+ RAG Document Chunks<br/>+ Global Knowledge Hits<br/>+ Visual Mode Rules<br/>+ Last 20 Messages"]:::prompt
        
        subgraph NeMo ["Security Guardrails"]
            PreGen["Pre-Generation<br/>├─ Input sanitization<br/>├─ Prompt Injection Router<br/>└─ Topic enforcement"]:::guardrails
        end
        Prompt --> PreGen
    end

    %% Response Flow
    Stream["Streamed Response"]:::user
    PostAnalysis["Post-response analysis"]:::innerProcess
    UserSelect["User selects text"]:::user

    %% Layer 4: Spaced Repetition
    subgraph L4 ["Layer 4: Spaced Repetition (Permanent)"]
        L4_SM2["SM-2 Algorithm<br/>├─ Learning phase (steps 0-3)<br/>├─ Review phase (intervals grow)<br/>└─ easeFactor adjustment"]:::innerProcess
        L4_Push["Firebase Push Notification<br/>when card is due"]:::innerProcess
        L4_SM2 --> L4_Push
    end

    %% Routing / Connections
    UserMsg --> TPS
    UserMsg --> L1_Window
    UserMsg -->|Query user_knowledge<br/>+ user_queries| L5_Qdrant
    
    L3_Dedup --> Prompt
    L1_Window --> Prompt
    L1_Deficit --> Prompt
    L2_Inject --> Prompt
    
    L5_Mongo -.->|"[GLOBAL USER PROFILE]"| Prompt
    L5_Qdrant -.->|cross-chat knowledge| Prompt
    
    PreGen --> Stream
    
    Stream --> PostAnalysis
    PostAnalysis --> L5_Worker
    
    Stream --> UserSelect
    UserSelect --> L4_SM2

    %% Assign styles to subgraphs
    class L1,L2,L3,L4,L5,GeminiAPI layerBox
```
