import { injectable } from "tsyringe";
import { embeddingService } from "./EmbeddingService";
import fs from "fs";
import crypto from "crypto";
import LlamaCloud from "@llamaindex/llama-cloud";
import { redisConnection } from "../config/redis";
import { computeFileHash } from "../utils/fileHasher";

const LLAMA_CACHE_PREFIX = "llamaparse:";
const LLAMA_CACHE_TTL = 60 * 60 * 24; 



export type SegmentKind =
  | "heading"
  | "paragraph"
  | "sentence"
  | "table"
  | "list"
  | "code"
  | "blockquote";

export interface Segment {
  text: string;
  kind: SegmentKind;
  heading: string;
  atomic: boolean;
}

export interface SemanticChunk {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  tokenEstimate: number;
  embedding?: number[];
  metadata: {
    headings: string[];
    kinds: SegmentKind[];
    chunkIndex: number;
    totalChunks?: number;
  };
}

export interface ChunkingOptions {
  similarityThreshold?: number;
  windowSize?: number;
  minChunkTokens?: number;
  maxChunkTokens?: number;
  embedChunks?: boolean;
}



function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA === 0 || normB === 0
    ? 0
    : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function averageVectors(vecs: number[][]): number[] {
  if (vecs.length === 0) return [];
  const dim = vecs[0].length;
  const sum = new Array(dim).fill(0);
  for (const v of vecs) for (let k = 0; k < dim; k++) sum[k] += v[k];
  return sum.map((x) => x / vecs.length);
}

function estimateTokens(text: string): number {

  return Math.ceil(text.length / 3.5);
}


function splitByTokenLimit(text: string, limit: number): string[] {
  const chunks: string[] = [];
  const maxChars = Math.floor(limit * 3.5);
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + maxChars));
    start += maxChars;
  }
  return chunks;
}



function buildSegments(markdown: string): Segment[] {
  const segments: Segment[] = [];
  const lines = markdown.split("\n");
  let currentHeading = "";
  let i = 0;
  
  const MAX_LINES_DEPTH = lines.length + 1000;
  let mainLoopCount = 0;

  while (i < lines.length && mainLoopCount++ < MAX_LINES_DEPTH * 2) {
    const startI = i; 
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      i++;
      continue;
    }

   
    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      const fence = trimmed.slice(0, 3);
      const block: string[] = [line];
      i++;
      let innerCount = 0;
      while (i < lines.length && innerCount++ < MAX_LINES_DEPTH) {
        block.push(lines[i]);
        if (lines[i].trim().startsWith(fence)) {
          i++;
          break;
        }
        i++;
      }
      segments.push({
        text: block.join("\n"),
        kind: "code",
        heading: currentHeading,
        atomic: true,
      });
      if (i === startI) i++; 
      continue;
    }

   
    if (trimmed.startsWith("|") || trimmed.toLowerCase().startsWith("<table")) {
      const block: string[] = [];
      const isHtmlTable = trimmed.toLowerCase().startsWith("<table");
      
      let innerCount = 0;
      if (isHtmlTable) {
        while (i < lines.length && innerCount++ < MAX_LINES_DEPTH) {
          block.push(lines[i]);
          if (lines[i].trim().toLowerCase().startsWith("</table")) {
            i++;
            break;
          }
          i++;
        }
      } else {
        while (i < lines.length && lines[i].trim().startsWith("|") && innerCount++ < MAX_LINES_DEPTH) {
          block.push(lines[i]);
          i++;
        }
      }
      
      segments.push({
        text: block.join("\n"),
        kind: "table",
        heading: currentHeading,
        atomic: true,
      });
      if (i === startI) i++; 
      continue;
    }

    
    if (trimmed.startsWith(">")) {
      const block: string[] = [];
      let innerCount = 0;
      while (i < lines.length && lines[i].trim().startsWith(">") && innerCount++ < MAX_LINES_DEPTH) {
        block.push(lines[i]);
        i++;
      }
      segments.push({
        text: block.join("\n"),
        kind: "blockquote",
        heading: currentHeading,
        atomic: true,
      });
      if (i === startI) i++; 
      continue;
    }

 
    if (/^([-*+]|[\dA-Za-z]+[.):])\s/.test(trimmed)) {  //list
      const block: string[] = [];
      let innerCount = 0;
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        (/^([-*+]|[\dA-Za-z]+[.):])\s/.test(lines[i].trim()) || /^\s{2,}/.test(lines[i])) &&
        innerCount++ < MAX_LINES_DEPTH
      ) {
        block.push(lines[i]);
        i++;
      }
      segments.push({
        text: block.join("\n"),
        kind: "list",
        heading: currentHeading,
        atomic: true,
      });
      if (i === startI) i++; 
      continue;
    }

   
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      currentHeading = headingMatch[2].trim();
      segments.push({
        text: line,
        kind: "heading",
        heading: currentHeading,
        atomic: false,
      });
      i++;
      continue;
    }


    const paraLines: string[] = [];
    const exclusionRegex = /^(?:#{1,6}\s+|\||>|[-*+]\s|[\dA-Za-z]+[.):]\s|```|~~~)/; //paragraphs

    let innerCount = 0;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !exclusionRegex.test(lines[i].trim()) &&
      innerCount++ < MAX_LINES_DEPTH
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length === 0 || i === startI) {
      i++;
      continue;
    }

    const paraText = paraLines.join(" ").trim();
    if (!paraText) continue;

    const sentences = paraText.split(/(?<=[.!?])\s+(?=[A-Z"'(])|(?<=[.!?])$/).filter(Boolean);

    if (sentences.length <= 2) {
      segments.push({
        text: paraText,
        kind: "paragraph",
        heading: currentHeading,
        atomic: false,
      });
    } else {
      for (const s of sentences) {
        segments.push({
          text: s.trim(),
          kind: "sentence",
          heading: currentHeading,
          atomic: false,
        });
      }
    }
  }
  return segments;
}

interface RawChunk {
  segments: Segment[];
  embeddings: number[][];
}

async function semanticChunk(
  markdown: string,
  options: ChunkingOptions = {},
): Promise<SemanticChunk[]> {
  const {
    similarityThreshold = 0.45,
    windowSize = 3,
    minChunkTokens = 256,
    maxChunkTokens = 4094,
    embedChunks = false,
  } = options;
  console.log("Intitlaizing SEMANTIC CHUNKING");

  const initialSegments = buildSegments(markdown);
  console.log("COMPLETED BUILDING SEGMENTS");
  const segments: Segment[] = [];
  for (const s of initialSegments) {
    if (estimateTokens(s.text) > maxChunkTokens) {
      const parts = splitByTokenLimit(s.text, maxChunkTokens);
      parts.forEach((p) => segments.push({ ...s, text: p }));
    } else {
      segments.push(s);
    }
  }

  if (segments.length === 0) return [];


  const texts = segments.map((s) => s.text);
  const embeddings = await embeddingService.embedBatch(
    texts,
    "RETRIEVAL_DOCUMENT",
  );


  const boundaries = new Set<number>();
  for (let i = 0; i < segments.length - 1; i++) {
    const curr = segments[i];
    const next = segments[i + 1];

    if (curr.atomic || next.atomic || next.kind === "heading") {
      boundaries.add(i + 1);
      continue;
    }

    const leftStart = Math.max(0, i - windowSize + 1);
    const rightEnd = Math.min(segments.length - 1, i + windowSize);

    const leftVecs = embeddings
      .slice(leftStart, i + 1)
      .filter((_, idx) => !segments[leftStart + idx].atomic);
    const rightVecs = embeddings
      .slice(i + 1, rightEnd + 1)
      .filter((_, idx) => !segments[i + 1 + idx].atomic);

    if (leftVecs.length === 0 || rightVecs.length === 0) continue;

    const sim = cosineSimilarity(
      averageVectors(leftVecs),
      averageVectors(rightVecs),
    );
    if (sim < similarityThreshold) boundaries.add(i + 1);
  }

 
  const rawChunks: RawChunk[] = [];
  let start = 0;
  for (const splitAt of [...boundaries].sort((a, b) => a - b)) {
    rawChunks.push({
      segments: segments.slice(start, splitAt),
      embeddings: embeddings.slice(start, splitAt),
    });
    start = splitAt;
  }
  rawChunks.push({
    segments: segments.slice(start),
    embeddings: embeddings.slice(start),
  });

  
  const adjusted = enforceTokenLimits(
    rawChunks,
    minChunkTokens,
    maxChunkTokens,
  );


  let charOffset = 0;
  const finalChunks = adjusted.map((raw, i) => {
    const content = raw.segments
      .map((s) => s.text)
      .join("\n\n")
      .trim();
    const chunk: SemanticChunk = {
      id: `chunk-${i}`,
      content,
      startIndex: charOffset,
      endIndex: charOffset + content.length,
      tokenEstimate: estimateTokens(content),
      metadata: {
        headings: [
          ...new Set(raw.segments.map((s) => s.heading).filter(Boolean)),
        ],
        kinds: [...new Set(raw.segments.map((s) => s.kind))],
        chunkIndex: i,
      },
    };
    if (embedChunks) chunk.embedding = averageVectors(raw.embeddings);
    charOffset += content.length + 2;
    return chunk;
  });

  finalChunks.forEach((c) => (c.metadata.totalChunks = finalChunks.length));
  return finalChunks;
}

function enforceTokenLimits(
  rawChunks: RawChunk[],
  minTokens: number,
  maxTokens: number,
): RawChunk[] {
  // Merge Pass

  const merged: RawChunk[] = [];
  for (const chunk of rawChunks) {
    const tokens = estimateTokens(chunk.segments.map((s) => s.text).join(" "));
    const hasAtomic = chunk.segments.some((s) => s.atomic);

    if (!hasAtomic && merged.length > 0 && tokens < minTokens) {
      const prev = merged[merged.length - 1];
      if (!prev.segments.some((s) => s.atomic)) {
        prev.segments.push(...chunk.segments);
        prev.embeddings.push(...chunk.embeddings);
        continue;
      }
    }
    merged.push(chunk);
  }

  // Split Pass
  const result: RawChunk[] = [];
  for (const chunk of merged) {
    let bufSegs: Segment[] = [];
    let bufEmbs: number[][] = [];
    let bufToks = 0;

    for (let i = 0; i < chunk.segments.length; i++) {
      const seg = chunk.segments[i];
      const tok = estimateTokens(seg.text);

      if (bufToks + tok > maxTokens && bufSegs.length > 0) {
        result.push({ segments: bufSegs, embeddings: bufEmbs });
        bufSegs = [];
        bufEmbs = [];
        bufToks = 0;
      }
      bufSegs.push(seg);
      bufEmbs.push(chunk.embeddings[i]);
      bufToks += tok;
    }
    if (bufSegs.length > 0)
      result.push({ segments: bufSegs, embeddings: bufEmbs });
  }

  return result;
}



@injectable()
export class SemanticChunkingService {
  private client;

  constructor() {
    this.client = new LlamaCloud({
      apiKey: process.env.LLAMA_CLOUD_API_KEY, 
    });
  }

  async processDocument(
    pdfPath: string,
    options: ChunkingOptions = {},
  ): Promise<{ chunks: SemanticChunk[]; contentHash: string }> {
    const contentHash = computeFileHash(pdfPath);
    const markdown = await this.extractMarkdown(pdfPath, contentHash);
    const chunks = await semanticChunk(markdown, options);
    return { chunks, contentHash };
  }

  private async extractMarkdown(pdfPath: string, contentHash: string): Promise<string> {
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`File not found: ${pdfPath}`);
    }


    const cacheKey = `${LLAMA_CACHE_PREFIX}${contentHash}`;

    try {
      const cached = await redisConnection.get(cacheKey);
      if (cached) {
        console.log(`⚡ LlamaParse cache HIT (${(cached.length / 1024).toFixed(1)} KB)`);
        return cached;
      }
    } catch (err) {
      console.warn(" Redis cache read failed, proceeding with LlamaParse:", err);
    }

 
    try {
      console.log(` Parsing PDF with LlamaParse (cache MISS): ${pdfPath}`);

      const file = await this.client.files.create({
        file: fs.createReadStream(pdfPath),
        purpose: "parse",
      });

      const result = await this.client.parsing.parse({
        file_id: file.id,
        tier: "agentic",
        version: "latest",
        expand: ["markdown"],
      });

      if (!result?.markdown?.pages?.length) {
        throw new Error("No markdown pages returned from LlamaParse");
      }

      let markdown = result.markdown.pages
        .map((page: any) => page.markdown ?? "")
        .filter((text: string) => text.length > 0)
        .join("\n\n");

      if (!markdown) {
        throw new Error("No markdown content extracted from LlamaParse");
      }

      markdown = markdown.replace(/^\[\d+\]\s?/gm, "");

      console.log(
        ` LlamaParse extraction complete (${result.markdown.pages.length} pages, ${(markdown.length / 1024).toFixed(1)} KB)`,
      );

      
      try {
        await redisConnection.set(cacheKey, markdown, "EX", LLAMA_CACHE_TTL);
        console.log(`Cached LlamaParse result (key: ${contentHash.slice(0, 12)}..., TTL: 24h)`);
      } catch (err) {
        console.warn(" Redis cache write failed:", err);
      }

      return markdown;
    } catch (error: any) {
      throw new Error(
        `LlamaParse extraction failed: ${error.message || "Unknown error"}`,
      );
    }
  }
}
