import { EmailMessage, AISuggestion } from '../types';
export declare class GeminiAIService {
    private genAI;
    private model;
    private embeddingModel;
    private qdrantService;
    constructor();
    categorizeEmail(email: EmailMessage): Promise<AISuggestion | null>;
    private parseCategorizationResult;
    generateEmbedding(text: string): Promise<number[]>;
    generateSuggestedReply(email: EmailMessage): Promise<string | null>;
    initializeProductData(): Promise<void>;
    analyzeEmailSentiment(email: EmailMessage): Promise<{
        sentiment: 'positive' | 'negative' | 'neutral';
        confidence: number;
        keyPhrases: string[];
    }>;
    private parseSentimentResult;
}
//# sourceMappingURL=GeminiAIService.d.ts.map