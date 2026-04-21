import Redis from 'ioredis';
import { redisConfig, redisConnection } from '../config/redis';

export type DocumentProgressStatus =
  | 'queued'
  | 'uploading'
  | 'uploaded'
  | 'chunking'
  | 'completed'
  | 'failed';

export interface DocumentProgressEvent {
  documentId: string;
  chatId: string;
  userId: string;
  fileName: string;
  stage: 'upload' | 'chunk';
  status: DocumentProgressStatus;
  progress: number;
  cloudinaryUrl?: string;
  message?: string;
  timestamp: string;
}

type ProgressListener = (event: DocumentProgressEvent) => void;

class DocumentProgressPubSub {
  private readonly subscriber: Redis;
  private readonly listeners = new Map<string, Set<ProgressListener>>();
  private readonly latestEventTTLSeconds = 60 * 60;

  constructor() {
    this.subscriber = new Redis(redisConfig);

    this.subscriber.on('message', (channel: string, payload: string) => {
      const documentId = this.extractDocumentIdFromChannel(channel);
      if (!documentId) return;

      const callbacks = this.listeners.get(documentId);
      if (!callbacks || callbacks.size === 0) return;

      try {
        const parsed = JSON.parse(payload) as DocumentProgressEvent;
        for (const callback of callbacks) {
          callback(parsed);
        }
      } catch (error) {
        console.error('[DocumentProgressPubSub] Failed to parse payload:', error);
      }
    });

    this.subscriber.on('error', (error) => {
      console.error('[DocumentProgressPubSub] Subscriber error:', error);
    });
  }

  private channel(documentId: string): string {
    return `document-progress:${documentId}`;
  }

  private latestKey(documentId: string): string {
    return `document-progress:latest:${documentId}`;
  }

  private extractDocumentIdFromChannel(channel: string): string | null {
    if (!channel.startsWith('document-progress:')) return null;
    return channel.split(':')[1] || null;
  }

  async publish(event: Omit<DocumentProgressEvent, 'timestamp'>): Promise<void> {
    const payload: DocumentProgressEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    const serialized = JSON.stringify(payload);
    const channel = this.channel(event.documentId);

    try {
      await redisConnection.publish(channel, serialized);
      await redisConnection.set(
        this.latestKey(event.documentId),
        serialized,
        'EX',
        this.latestEventTTLSeconds,
      );
    } catch (error) {
      console.error('[DocumentProgressPubSub] Publish failed:', error);
    }
  }

  async getLatest(documentId: string): Promise<DocumentProgressEvent | null> {
    try {
      const raw = await redisConnection.get(this.latestKey(documentId));
      if (!raw) return null;
      return JSON.parse(raw) as DocumentProgressEvent;
    } catch (error) {
      console.error('[DocumentProgressPubSub] getLatest failed:', error);
      return null;
    }
  }

  async subscribe(
    documentId: string,
    listener: ProgressListener,
  ): Promise<() => Promise<void>> {
    const current = this.listeners.get(documentId) || new Set<ProgressListener>();
    const wasEmpty = current.size === 0;
    current.add(listener);
    this.listeners.set(documentId, current);

    if (wasEmpty) {
      await this.subscriber.subscribe(this.channel(documentId));
    }

    return async () => {
      const callbacks = this.listeners.get(documentId);
      if (!callbacks) return;

      callbacks.delete(listener);
      if (callbacks.size > 0) return;

      this.listeners.delete(documentId);
      await this.subscriber.unsubscribe(this.channel(documentId));
    };
  }
}

export const documentProgressPubSub = new DocumentProgressPubSub();
