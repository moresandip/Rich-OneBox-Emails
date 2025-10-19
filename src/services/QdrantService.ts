import { QdrantClient } from 'qdrant-client';
import { config } from '../config';

export interface VectorSearchResult {
  id: string;
  score: number;
  text: string;
  metadata: any;
}

export class QdrantService {
  private client: QdrantClient;
  private collectionName: string;

  constructor() {
    this.client = new QdrantClient({
      url: config.qdrant.url
    });
    this.collectionName = config.qdrant.collectionName;
  }

  public async initializeCollection(): Promise<void> {
    try {
      // Check if collection exists
      const collections = await this.client.getCollections();
      const collectionExists = collections.collections.some(
        (col: any) => col.name === this.collectionName
      );

      if (!collectionExists) {
        // Create collection with proper configuration
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: 768, // Gemini embedding dimension
            distance: 'Cosine'
          }
        });
        console.log(`Created Qdrant collection: ${this.collectionName}`);
      } else {
        console.log(`Qdrant collection already exists: ${this.collectionName}`);
      }
    } catch (error) {
      console.error('Error initializing Qdrant collection:', error);
      throw error;
    }
  }

  public async storeVector(
    embedding: number[],
    text: string,
    metadata: any
  ): Promise<void> {
    try {
      const pointId = this.generatePointId();
      
      await this.client.upsert(this.collectionName, {
        wait: true,
        points: [
          {
            id: pointId,
            vector: embedding,
            payload: {
              text: text,
              metadata: metadata,
              timestamp: new Date().toISOString()
            }
          }
        ]
      });

      console.log(`Stored vector in Qdrant: ${pointId}`);
    } catch (error) {
      console.error('Error storing vector in Qdrant:', error);
      throw error;
    }
  }

  public async searchSimilar(
    queryVector: number[],
    limit: number = 3
  ): Promise<VectorSearchResult[]> {
    try {
      const searchResult = await this.client.search(this.collectionName, {
        vector: queryVector,
        limit: limit,
        with_payload: true,
        with_vector: false
      });

      return searchResult.map((result: any) => ({
        id: result.id,
        score: result.score,
        text: result.payload.text,
        metadata: result.payload.metadata
      }));
    } catch (error) {
      console.error('Error searching vectors in Qdrant:', error);
      throw error;
    }
  }

  public async searchByMetadata(
    filter: any,
    limit: number = 10
  ): Promise<VectorSearchResult[]> {
    try {
      const searchResult = await this.client.scroll(this.collectionName, {
        filter: {
          must: [
            {
              key: 'metadata',
              match: filter
            }
          ]
        },
        limit: limit,
        with_payload: true,
        with_vector: false
      });

      return searchResult.points.map((point: any) => ({
        id: point.id,
        score: 1.0, // No score for scroll results
        text: point.payload.text,
        metadata: point.payload.metadata
      }));
    } catch (error) {
      console.error('Error searching by metadata in Qdrant:', error);
      throw error;
    }
  }

  public async deleteVector(pointId: string): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        points: [pointId]
      });
      console.log(`Deleted vector from Qdrant: ${pointId}`);
    } catch (error) {
      console.error('Error deleting vector from Qdrant:', error);
      throw error;
    }
  }

  public async getCollectionInfo(): Promise<any> {
    try {
      const collection = await this.client.getCollection(this.collectionName);
      return collection;
    } catch (error) {
      console.error('Error getting collection info from Qdrant:', error);
      throw error;
    }
  }

  public async clearCollection(): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        points: {
          all: true
        }
      });
      console.log(`Cleared Qdrant collection: ${this.collectionName}`);
    } catch (error) {
      console.error('Error clearing Qdrant collection:', error);
      throw error;
    }
  }

  public async updateVector(
    pointId: string,
    embedding: number[],
    text: string,
    metadata: any
  ): Promise<void> {
    try {
      await this.client.upsert(this.collectionName, {
        wait: true,
        points: [
          {
            id: pointId,
            vector: embedding,
            payload: {
              text: text,
              metadata: metadata,
              timestamp: new Date().toISOString()
            }
          }
        ]
      });
      console.log(`Updated vector in Qdrant: ${pointId}`);
    } catch (error) {
      console.error('Error updating vector in Qdrant:', error);
      throw error;
    }
  }

  public async getVectorCount(): Promise<number> {
    try {
      const collection = await this.getCollectionInfo();
      return collection.points_count;
    } catch (error) {
      console.error('Error getting vector count from Qdrant:', error);
      return 0;
    }
  }

  private generatePointId(): string {
    return `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch (error) {
      console.error('Qdrant health check failed:', error);
      return false;
    }
  }
}
