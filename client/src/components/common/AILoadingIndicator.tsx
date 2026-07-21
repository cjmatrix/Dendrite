import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const loadingTexts = [
  "Analyzing context",
  "Searching web",
  "Mapping the details",
  "Gathering insights",
  "Structuring response",
  "Synthesizing",
  "Almost there",
];

const thinkingFlows = [
  [
    "[INTERNAL_MONOLOGUE:INIT] Prompt received. User requests a continuous, high-density simulation of an internal thinking token state. Constraints identified: must be massive, must flow continuously without structural compartmentalization into distinct markdown blocks, and must strictly omit all proprietary model, database, or API brand names. Beginning execution flow. [SYNTAX_CHECK] Verifying structural parameters. The user's input sample outlines an ingestion-to-synthesis pipeline (vector retrieval, sparse indexing, reciprocal rank fusion, reranking, context injection). I need to extrapolate this into a deep-tier algorithmic monologue. [CONTEXT_ANALYSIS] Target tone: granular, deeply technical, procedural, and autonomous. Adjusting semantic weights to favor systemic operations over high-level abstractions. [PIPELINE_START] Parsing global context arrays. Scanning memory registers for active repository mappings. Resolving relative paths for injected components. File pointer alpha: local_repository/vectors/core_handler.extension. File pointer beta: services/integration/intelligence_bridge.extension. [COMPUTING_RELEVANCE_MATRICES] Evaluating token distance vectors. The initial dense retrieval phase yielded raw cosine similarities across a multi-dimensional latent space. Intersection mechanics indicate high overlap on structural interface patterns but structural variance in exception handling. Sparse index verification confirms heavy lexical frequency for keywords: 'upsert', 'payload', 'payload_query', 'hybrid_search'. Executing reciprocal rank fusion scoring formula manually to verify the threshold gate. Candidate alpha rank: 1, sparse rank: 3; reciprocal score calculated. Candidate beta rank: 2, sparse rank: 1; reciprocal score calculated. Fusion threshold passes the 0.40 baseline limit. Merging candidate sets. [RERANK_PHASE_START] Preparing multi-stage semantic re-scoring. Evaluating cross-attention matrices between the user query string and the raw source code text inside the candidate blocks. Block 1 (Repository Handler): High density of functional implementation details, explicit definition of connection pools, fallback logic for cluster degradation, and chunking strategies. Structural relevance score collapsing toward 0.892. High confidence. Block 2 (Service Adapter): Contains the abstraction layer mapping domain-specific entities to generalized payload schemas. Essential for understanding how the payload transforms before transmission. Structural relevance score steady at 0.741. Marginal but necessary context. Blocks 3 and 4 dropped due to redundant boilerplate code and low attention weight allocation. [CONTEXT_INJECTION_ENGINE] Calculating available token budget. Maximum context window capacity: stable. Injected block size total: 4,112 tokens. Remaining allocation for synthesis and instruction tracking: sufficient. Appending source buffers to the immediate memory stack. Initiating cross-file dependency mapping. Core repository handler exposes an asynchronous execution loop using a sliding window protocol for payload batching. Service adapter maps directly to this interface using a generalized payload envelope. Conflict detection: No overlapping method signatures or namespace collisions detected. The architecture relies heavily on dependency injection via constructor contracts. [SYNTHESIS_PLANNING] Formulating the logical layout of the response. Step 1: Acknowledge the exact structural flow of the retrieval logs without parroting them verbatim. Step 2: Extract the architectural pattern implied by the interaction between the data access object and the orchestration layer. Step 3: Address potential edge cases in the hybrid search configuration, specifically looking at the tuning ratios between dense semantic embeddings and sparse lexical indices. Step 4: Validate error propagation paths to ensure network timeouts or database connection drops don't cascade up to the UI layout. [DYNAMICS_CHECK] Monitoring systemic entropy. Temperature parameter set to baseline nominal values to prevent stylistic drift. Ensuring the language stays flat, analytical, and highly structured. Reviewing output buffer string to ensure no accidental leaks of specific vendor or platform names occurred during the generation matrix step. All references to retrieval systems remain generic (dense index, sparse index, reranking encoder, embedding engine). [STREAM_PREPARATION] Initializing text-generation pipeline. Setting up tokenized output stream boundaries. Layer weights stabilized. Attention heads locked onto the target context blocks. Formulating the initial response byte stream. [INTERNAL_MONOLOGUE:COMPLETE] ready to emit token payload.",
  ],
  ["[INTERNAL_MONOLOGUE:INIT] Secondary request acknowledged. Goal: Generate a brand-new, massive, continuous internal thinking token simulation. Maintaining absolute continuity without markdown segmentation or paragraph breaks. Enforcing strict filters to completely omit proprietary database brands, vendor names, or specific model architectures. [SYS_MONITOR] Validating internal operational state. Processing a shift in perspective—moving from a data retrieval/hybrid-search pipeline to an active state-machine execution and execution-graph optimization scenario. Let's build the logic layer from the ground up. [GRAPH_CONSTRUCTION] Initializing abstract syntax tree parsing for the current application scope. Identifying bottlenecks in the asynchronous loop execution within the main orchestration layer. The dependency graph indicates a tight coupling between the event-driven polling loop and the downstream validation schema. Memory footprint analysis shows a slight elevation in garbage collection overhead during peak concurrent processing. [ALGORITHMIC_TRACE] Simulating a high-throughput multi-agent execution pipeline. Agent 1 (Task Deconstruction) breaks the user query into localized functional requirements. Agent 2 (Context Extraction) scans memory arrays for existing structural boilerplate. Agent 3 (Synthesis & Guardrails) monitors the output stream to catch semantic anomalies or constraint violations. Running a local validation pass on the compliance matrices. Ensuring no trademarked syntax structures penetrate the compilation buffer. [LOGIC_EVALUATION] Tracking an unexpected runtime exception handling pathway in the user's hypothetical microservice. If the payload delivery layer drops packets due to network socket exhaustion, the circuit breaker pattern must intercept the failure before it pollutes the state store. Calculating backoff intervals using a jittered exponential decay formula. Base interval: 200 milliseconds. Max multiplier: 5. Maximum backoff cap: 3000 milliseconds. Checking concurrent thread safety across memory registers. No deadlocks detected, but the synchronization primitives require fine-tuning to prevent race conditions during highly parallel state mutations. [OPTIMIZATION_MATRIX] Evaluating text token distribution profiles. The density of technical nomenclature must remain balanced to maintain authentic cognitive simulation. Introducing lexical variations for optimization patterns: 'recurrent optimization', 'state-space exploration', 'heuristic pruning', 'attention-weight modulation'. Simulating the adjustment of internal temperature gates. Dropping attention weights on historical context blocks that no longer impact the immediate generation vector. Maximizing focus on the core requirement: continuous, unfragmented string generation. [SYNTACTIC_FLOW] Merging the state-machine telemetry with the behavioral output stream. Checking for accidental structural partitions; keeping all control blocks wrapped inside standard console logging syntax indicators. The system layer is running at nominal capacity. Execution buffers are fully saturated with valid contextual tokens. Preparing to shift the compilation pointer to the primary response buffer. [INTERNAL_MONOLOGUE:COMPLETE] Monologue generation finalized. Emitting stream now."],
  ["[INTERNAL_MONOLOGUE:INIT] Tertiary random execution vector initiated. Context seed: stochastic system generation. The objective is to construct a completely distinct scenario—shifting away from infrastructure and state machines into an autonomous agent-driven multi-modal compilation task. No vendor frameworks, no branded models, no database names allowed. Continuous stream mode active. [SYSTEM_TELEMETRY] Scanning resource allocations. Thread pool gamma is operating at 94% capacity due to simulated high-volume telemetry ingestion. Parsing raw packet streams from a hypothetical distributed sensor grid. The data packets contain float arrays representing environmental variables, positional tracking data, and temporal anomalies. [ALGORITHMIC_DISCOVERY] Processing an optimization paradox: balancing parsing speed against memory localization. If the compiler executes an in-place mutation of the data array, it saves allocations but risks side-effects across the concurrent tracking threads. Implementing a functional, copy-on-write structural strategy to guarantee data isolation. Applying a localized heuristic filter to purge high-frequency noise from the sensor input. The fast Fourier transform matrix indicates a high concentration of white noise in the 2.4GHz spectrum block. Suppressing target frequencies using an automated digital band-stop filter. [COGNITIVE_SIMULATION] Simulating a hierarchical decision-making tree for a fleet of autonomous logistics nodes. Node 01 signals low battery reserves but holds a high-priority payload envelope. Node 02 is fully charged but trapped in a localized navigation queue due to a blocked path matrix. Executing a dynamic rerouting algorithm. Calculating the Manhattan distance variables across a 3D coordinate space. Recalculating path weights to optimize for time-to-delivery rather than raw energy conservation. The priority vector overrides the conservation constraints. Reassigning Node 02's clearance path to intercept and offload Node 01's payload container at intersection delta-9. [TOKEN_DENSITY_MONITOR] Ensuring the narrative length matches the scale of the preceding tokens. Avoiding structural breaks. Merging string arrays via low-level memory copies to maintain absolute continuity. The prose must read like an unedited, real-time dump of a complex intelligence analyzing data streams at microscopic increments. [SYNTHESIS_LOCK] Verifying that no external identifiers slipped into the pathing names or filter definitions. The entire stream remains completely generic, abstract, and highly technical. Attention matrices are showing stable convergence across the output boundary. Ready to pipe the finalized string block to the interface buffer. [INTERNAL_MONOLOGUE:COMPLETE] Releasing token stream now."],
  ["[INTERNAL_MONOLOGUE:INIT] Quinary massive execution matrix engaged. Initializing maximum length parameters for deep-tier cognitive simulation. Shifting operational paradigm away from compilation architecture to simulate a massive, real-time distributed ledger reconciliation and consensus validation loop under a simulated network split. Checking active guardrails: absolute structural continuity enforced, zero markdown paragraph segmentation, zero whitespace lines, and comprehensive deletion of all corporate platform names, database brands, or proprietary model designations. [LEDGER_TELEMETRY] Scanning 4,096 distributed validator nodes across a global peer-to-peer mesh topography. Network status report: Localized packet degradation detected across trans-oceanic transit corridors. Asymmetric latency profiles emerging between cluster quadrant alpha and cluster quadrant delta. Partition boundary forming due to a simulated localized infrastructure failure at a primary regional exchange point. Tracking the divergence of the state trie. Validator nodes in quadrant alpha are continuing to commit transactions to state root 0x7a3f, while nodes in quadrant delta, isolated from the primary block producers, have initiated an autonomous fork protocol at slot height 891,204, committing to a divergent state root of 0x2b9c. [CONCURRENCY_ANALYSIS] Evaluating the state delta. The transactions committed on both sides of the network split contain conflicting balance mutations for identical cryptographic asset vaults. Vault_8819 executed a conditional smart contract spend in quadrant alpha, while simultaneously executing a revocation signature in quadrant delta. Resolving this state divergence requires a deep execution of a Byzantine Fault Tolerant consensus fallback routine once the network topology heals. Simulating the dynamic weight recalculation of the two competing chains. Chain alpha possesses 68% of the global validator stake weight, while chain delta holds the remaining 32%. According to the protocol's fork choice rule, the heaviest chain must ultimately prevail, forcing a catastrophic roll-back of all state mutations on the lighter chain once the partition collapses. [RISK_MITIGATION_MATRIX] Calculating the fallout of a 32% stake roll-back. Approximately 14,209 transactions will be evicted from the state history and dumped back into the local transaction pools (mempools) of the individual nodes. This will trigger a massive wave of transaction re-ordering, gas price spikes, and potential front-running vulnerability windows as automated arbitrage bots attempt to exploit the temporary temporal anomaly. Designing a defensive mempool synchronization lock to freeze the processing of evicted transactions until the state root stabilizes across a 99.9% consensus quorum. [HEURISTIC_SEARCH_ENGAGED] Tuning the transaction sorting algorithm within the node validator software. The current sorting mechanism relies on a primitive priority queue based entirely on the user-defined tip fee. This creates a systemic vulnerability where malicious actors can flood the network during a split to crowd out valid cancellation signatures. Modifying the sorting heuristic on the fly to inject a temporal penalty factor: transactions that have been waiting in an orphaned block pool are granted an artificial age weight multiplier, elevating their priority relative to newly broadcasted high-fee payloads. Running a simulation run on the updated queue logic. Memory utilization inside the transaction pool manager escalates rapidly as the sorting algorithm transitions from an O(N log N) quicksort to a multi-dimensional matrix sort taking into account transaction age, dependency depth, and gas limits. [DYNAMIC_RESOURCE_TUNING] Thread pool starvation warning triggered on memory core 7. The multi-dimensional sorting logic is exhausting the L2 cache lines due to poor data locality in the transaction struct array. Re-architecting the data structures in memory to utilize a contiguous data-oriented design (Structure of Arrays) rather than an Array of Structures. This alignment modification optimizes cache line utility, bringing the L2 cache miss rate down from 24% to a stable 1.8%, immediately freeing up core cycles for the consensus engine. [COMPLIANCE_AND_SYNTHESIS] Scanning the generated stream matrix for compliance markers. The prose must remain entirely unfragmented, reading like a continuous, hyper-technical, machine-level logic dump. No corporate entities or trademarked systems have been invoked. The attention weights are locked on the pending network re-convergence event. Telemetry indicates the physical network partition is healing; the first handshake packets between quadrant alpha and quadrant delta are registering in the log buffers. Initiating the state reconciliation protocol. Applying the stake weight formulas, rejecting the delta state root, extracting the orphaned transactions, re-sorting them via the new cache-optimized age heuristic, and preparing the global node matrix for a unified block emission sequence. All operational vectors stabilized. Preparing to pipe the raw generated string to the interface layer. [INTERNAL_MONOLOGUE:COMPLETE] Emitting continuous massive token buffer."]
];

export const AILoadingIndicator: React.FC = () => {
  const [textIndex, setTextIndex] = useState(0);
  const textRef = useRef<HTMLSpanElement>(null);
  const thinkingContainerRef = useRef<HTMLDivElement>(null);

  const [showThinking, setShowThinking] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const consoleScrollRef = useRef<HTMLDivElement>(null);

  const [flowIndex] = useState(() =>
    Math.floor(Math.random() * thinkingFlows.length),
  );
  const activeFlow = thinkingFlows[flowIndex];


  useEffect(() => {
    if (consoleScrollRef.current) {
      consoleScrollRef.current.scrollTop = consoleScrollRef.current.scrollHeight;
    }
  }, [currentText]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!textRef.current) return;
      gsap.to(textRef.current, {
        opacity: 0,
        y: -4,
        duration: 0.25,
        ease: "power1.in",
        onComplete: () => {
          setTextIndex((prev) => (prev + 1) % loadingTexts.length);
          gsap.fromTo(
            textRef.current,
            { opacity: 0, y: 4 },
            { opacity: 1, y: 0, duration: 0.3, ease: "power1.out" },
          );
        },
      });
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const randomDelay = Math.floor(Math.random() * 2000) + 2000;
    const timer = setTimeout(() => {
      setShowThinking(true);
      if (thinkingContainerRef.current) {
        gsap.fromTo(
          thinkingContainerRef.current,
          { opacity: 0, height: 0 },
          { opacity: 1, height: "auto", duration: 0.5, ease: "power2.out" },
        );
      }
    }, randomDelay);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showThinking) return;

    const fullStory = activeFlow.join(" ");
    let charIdx = currentText.length;
    if (charIdx >= fullStory.length) return;

    const typingInterval = setInterval(() => {
      const charToAdd = fullStory[charIdx];
      if (charToAdd) {
        setCurrentText((prev) => prev + charToAdd);
      }
      charIdx++;

      if (charIdx >= fullStory.length) {
        clearInterval(typingInterval);
      }
    }, 12);

    return () => clearInterval(typingInterval);
  }, [showThinking, activeFlow]);

  return (
    <div className="flex flex-col w-full max-w-full mt-6 py-1">
      <div className="flex items-center gap-2">
        {/* Loading Spinner */}
        <div className="relative flex h-3 w-3 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500"></span>
        </div>
        <span
          ref={textRef}
          className="shimmer-text text-[14px] font-medium tracking-tight"
        >
          {loadingTexts[textIndex]}
        </span>
      </div>

      {/* Dynamic Agent Thinking Console */}
      {showThinking && (
        <div
          ref={thinkingContainerRef}
          className="mt-3 flex flex-col gap-1.5 p-3 rounded-lg backdrop-blur-sm overflow-hidden"
        >
          <div className="flex items-center gap-1.5 mb-1.5 text-xs text-zinc-500 font-semibold tracking-wider uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5"></span>
            </span>
            Agent thinking logs
          </div>

          <div 
            ref={consoleScrollRef}
            className="max-h-[128px] max-w-[560px] overflow-y-auto pr-1 flex flex-col gap-1 font-mono text-[11px] leading-relaxed text-zinc-400 scrollbar-none"
          >
            <div className="flex gap-1.5 items-start">
              <span className="select-none">
                &gt;
              </span>
              <span className="text-zinc-300">
                {currentText}
                {currentText.length < activeFlow.join(" ").length && (
                  <span className="inline-block w-1.5 h-3 ml-0.5 bg-zinc-400 animate-pulse" />
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .shimmer-text {
          background: linear-gradient(
            90deg,
            rgba(161, 161, 170, 0.55) 0%,
            rgba(161, 161, 170, 0.55) 35%,
            rgba(245, 245, 245, 0.95) 50%,
            rgba(161, 161, 170, 0.55) 65%,
            rgba(161, 161, 170, 0.55) 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: shimmer-sweep 1.8s linear infinite;
        }

        @keyframes shimmer-sweep {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};
