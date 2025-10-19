import { GoogleGenerativeAI, GenerativeModel, EmbedContentRequest } from '@google/generative-ai';
import { EmailMessage, EmailCategory, AISuggestion, RAGContext } from '../types';
import { config } from '../config';
import { QdrantService } from './QdrantService';

export class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private embeddingModel: GenerativeModel;
  private qdrantService: QdrantService;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.ai.model });
    this.embeddingModel = this.genAI.getGenerativeModel({ model: config.ai.embeddingModel });
    this.qdrantService = new QdrantService();
  }

  public async categorizeEmail(email: EmailMessage): Promise<AISuggestion | null> {
    try {
      const systemInstruction = `You are an expert email classifier. Your task is to analyze the provided email text and categorize it into one of the following labels: Interested, Meeting Booked, Not Interested, Spam, or Out of Office.

Guidelines:
- "Interested": Shows genuine interest in the product/service, asks questions, requests more information, or shows buying intent
- "Meeting Booked": Explicitly mentions scheduling a meeting, call, or appointment
- "Not Interested": Clearly states they are not interested, unsubscribe requests, or negative responses
- "Spam": Promotional content, irrelevant messages, or suspicious content
- "Out of Office": Automated out-of-office replies, vacation notices, or unavailability messages

Respond with a JSON object containing the category and confidence score (0-1).`;

      const prompt = `
Email Details:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body.substring(0, 1000)}...

Please analyze this email and provide your categorization.`;

      const result = await this.model.generateContent([
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\n${prompt}` }]
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      return this.parseCategorizationResult(text);
    } catch (error) {
      console.error('Error categorizing email with Gemini:', error);
      return null;
    }
  }

  private parseCategorizationResult(result: string): AISuggestion | null {
    try {
      // Try to extract JSON from the response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      let category = EmailCategory.UNCATEGORIZED;
      if (Object.values(EmailCategory).includes(parsed.category?.toLowerCase() as EmailCategory)) {
        category = parsed.category.toLowerCase() as EmailCategory;
      }

      return {
        category,
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'AI categorization completed'
      };
    } catch (error) {
      console.error('Error parsing Gemini categorization result:', error);
      return {
        category: EmailCategory.UNCATEGORIZED,
        confidence: 0.1,
        reasoning: 'Failed to parse AI response'
      };
    }
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  public async generateSuggestedReply(email: EmailMessage): Promise<string | null> {
    try {
      // Step 1: Generate embedding for the incoming email
      const emailEmbedding = await this.generateEmbedding(email.body);
      
      // Step 2: Retrieve relevant context from vector database
      const relevantContext = await this.qdrantService.searchSimilar(
        emailEmbedding,
        3 // Top 3 most relevant chunks
      );

      // Step 3: Construct the RAG prompt
      const systemInstruction = `You are a helpful assistant that writes professional, relevant email replies for a business outreach team. Use ONLY the provided context to craft your response.`;

      const contextText = relevantContext.map(ctx => ctx.text).join('\n\n');
      
      const prompt = `
Context (Product Information and Outreach Agenda):
${contextText}

Original Email to Reply To:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

Based ONLY on the context provided and the original email, draft a professional and helpful reply. Be concise, relevant, and include appropriate next steps or meeting links if applicable.

Reply:`;

      const result = await this.model.generateContent([
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\n${prompt}` }]
        }
      ]);

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating suggested reply:', error);
      return null;
    }
  }

  public async initializeProductData(): Promise<void> {
    try {
      // Initialize the vector database with product information
      await this.qdrantService.initializeCollection();
      
      const productData = [
        {
          text: "ReachInbox is an AI-driven platform that transforms cold outreach. We help businesses find, enrich, and engage high-intent leads through multi-channel outreach on Twitter, LinkedIn, email, and phone.",
          metadata: { type: "product_description", priority: 1 }
        },
        {
          text: "Our platform uses AI to prospect and verify leads, craft personalized sequences, and notify businesses of responsive prospects. With just a single prompt, ReachInbox springs into action.",
          metadata: { type: "product_features", priority: 1 }
        },
        {
          text: "We offer a comprehensive lead generation solution that includes: 1) AI-powered lead prospecting, 2) Multi-channel outreach automation, 3) Real-time lead verification, 4) Personalized sequence generation, 5) Response tracking and analytics.",
          metadata: { type: "product_offerings", priority: 2 }
        },
        {
          text: "For interested prospects, we can schedule a demo call to show how ReachInbox can transform your lead generation process. You can book a meeting here: https://cal.com/example",
          metadata: { type: "meeting_booking", priority: 3 }
        },
        {
          text: "Our pricing starts at $99/month for the basic plan, which includes up to 1,000 leads per month. We also offer enterprise plans with custom pricing for larger organizations.",
          metadata: { type: "pricing_info", priority: 2 }
        },
        {
          text: "We typically work with B2B companies looking to scale their outbound sales efforts. Our clients include SaaS companies, agencies, and service providers who need to generate more qualified leads.",
          metadata: { type: "target_audience", priority: 2 }
        }
      ];

      // Generate embeddings and store in vector database
      for (const data of productData) {
        const embedding = await this.generateEmbedding(data.text);
        await this.qdrantService.storeVector(embedding, data.text, data.metadata);
      }

      console.log('Product data initialized in vector database');
    } catch (error) {
      console.error('Error initializing product data:', error);
      throw error;
    }
  }

  public async analyzeEmailSentiment(email: EmailMessage): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    keyPhrases: string[];
  }> {
    try {
      const prompt = `
Analyze the sentiment of this email and extract key phrases:

From: ${email.from}
Subject: ${email.subject}
Body: ${email.body.substring(0, 1000)}

Respond with a JSON object containing:
- sentiment: "positive", "negative", or "neutral"
- confidence: number between 0 and 1
- keyPhrases: array of important phrases from the email
`;

      const result = await this.model.generateContent([
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      return this.parseSentimentResult(text);
    } catch (error) {
      console.error('Error analyzing email sentiment:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        keyPhrases: []
      };
    }
  }

  private parseSentimentResult(result: string): {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    keyPhrases: string[];
  } {
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        sentiment: parsed.sentiment || 'neutral',
        confidence: parsed.confidence || 0.5,
        keyPhrases: parsed.keyPhrases || []
      };
    } catch (error) {
      console.error('Error parsing sentiment result:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        keyPhrases: []
      };
    }
  }
}
