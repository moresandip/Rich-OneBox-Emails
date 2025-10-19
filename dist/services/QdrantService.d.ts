export interface VectorSearchResult {
    id: string;
    score: number;
    text: string;
    metadata: any;
}
export declare class QdrantService {
    private collectionName;
    constructor();
    initializeCollection(): Promise<void>;
    storeVector(embedding: number[], text: string, metadata: any): Promise<void>;
    searchSimilar(queryVector: number[], limit?: number): Promise<VectorSearchResult[]>;
    searchByMetadata(filter: any, limit?: number): Promise<VectorSearchResult[]>;
    deleteVector(pointId: string): Promise<void>;
    getCollectionInfo(): Promise<any>;
    clearCollection(): Promise<void>;
    updateVector(pointId: string, embedding: number[], text: string, metadata: any): Promise<void>;
    getVectorCount(): Promise<number>;
    private generatePointId;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=QdrantService.d.ts.map