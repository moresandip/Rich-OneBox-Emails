export declare const config: {
    port: number;
    nodeEnv: string;
    mongodb: {
        uri: string;
    };
    elasticsearch: {
        url: string;
        index: string;
    };
    imap: {
        host: string;
        port: number;
        secure: boolean;
    };
    ai: {
        geminiApiKey: string;
        openaiApiKey: string;
        model: string;
        embeddingModel: string;
    };
    slack: {
        botToken: string;
        channelId: string;
    };
    webhook: {
        url: string;
    };
    jwt: {
        secret: string;
    };
    qdrant: {
        url: string;
        collectionName: string;
    };
};
//# sourceMappingURL=index.d.ts.map