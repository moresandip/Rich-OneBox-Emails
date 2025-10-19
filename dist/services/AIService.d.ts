import { EmailMessage, AISuggestion, RAGContext } from '../types';
export declare class AIService {
    private openai;
    private ragContext;
    constructor();
    categorizeEmail(email: EmailMessage): Promise<AISuggestion | null>;
    private buildCategorizationPrompt;
    private parseCategorizationResult;
    generateSuggestedReply(email: EmailMessage): Promise<string | null>;
    private buildReplyPrompt;
    updateRAGContext(newContext: Partial<RAGContext>): Promise<void>;
    getRAGContext(): RAGContext;
    analyzeEmailSentiment(email: EmailMessage): Promise<{
        sentiment: 'positive' | 'negative' | 'neutral';
        confidence: number;
        keyPhrases: string[];
    }>;
    private parseSentimentResult;
}
//# sourceMappingURL=AIService.d.ts.map