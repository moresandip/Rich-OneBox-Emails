import OpenAI from 'openai';
import { EmailMessage, EmailCategory, AISuggestion, RAGContext } from '../types';
import { config } from '../config';

export class AIService {
  private openai: OpenAI;
  private ragContext: RAGContext;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.ai.openaiApiKey
    });

    // Initialize RAG context with product and outreach information
    this.ragContext = {
      productInfo: "ReachInbox is an AI-driven platform that transforms cold outreach. We help businesses find, enrich, and engage high-intent leads through multi-channel outreach on Twitter, LinkedIn, email, and phone. Our platform uses AI to prospect and verify leads, craft personalized sequences, and notify businesses of responsive prospects.",
      outreachAgenda: "Our goal is to help businesses generate top-tier leads through AI-powered growth strategies. We focus on finding high-intent prospects and creating personalized outreach sequences that drive engagement and conversions.",
      meetingLink: "https://cal.com/example"
    };
  }

  public async categorizeEmail(email: EmailMessage): Promise<AISuggestion | null> {
    try {
      const prompt = this.buildCategorizationPrompt(email);
      
      const response = await this.openai.chat.completions.create({
        model: config.ai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that categorizes emails based on their content and intent. Analyze the email and determine which category it best fits into.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const result = response.choices[0].message.content;
      return this.parseCategorizationResult(result || '');
    } catch (error) {
      console.error('Error categorizing email:', error);
      return null;
    }
  }

  private buildCategorizationPrompt(email: EmailMessage): string {
    return `
Analyze the following email and categorize it into one of these categories:
- interested: Shows genuine interest in the product/service, asks questions, requests more information, or shows buying intent
- meeting_booked: Explicitly mentions scheduling a meeting, call, or appointment
- not_interested: Clearly states they are not interested, unsubscribe requests, or negative responses
- spam: Promotional content, irrelevant messages, or suspicious content
- out_of_office: Automated out-of-office replies, vacation notices, or unavailability messages

Email Details:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body.substring(0, 1000)}...

Please respond with only the category name and confidence score (0-1) in this format:
category: [category_name]
confidence: [score]
reasoning: [brief explanation]
`;
  }

  private parseCategorizationResult(result: string): AISuggestion | null {
    try {
      const lines = result.split('\n');
      let category = EmailCategory.UNCATEGORIZED;
      let confidence = 0.5;
      let reasoning = '';

      for (const line of lines) {
        if (line.startsWith('category:')) {
          const cat = line.split(':')[1].trim().toLowerCase();
          if (Object.values(EmailCategory).includes(cat as EmailCategory)) {
            category = cat as EmailCategory;
          }
        } else if (line.startsWith('confidence:')) {
          confidence = parseFloat(line.split(':')[1].trim());
        } else if (line.startsWith('reasoning:')) {
          reasoning = line.split(':')[1].trim();
        }
      }

      return {
        category,
        confidence,
        reasoning
      };
    } catch (error) {
      console.error('Error parsing categorization result:', error);
      return null;
    }
  }

  public async generateSuggestedReply(email: EmailMessage): Promise<string | null> {
    try {
      const prompt = this.buildReplyPrompt(email);
      
      const response = await this.openai.chat.completions.create({
        model: config.ai.model,
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that generates professional email replies. Use the following context to create appropriate responses:

Product Information: ${this.ragContext.productInfo}
Outreach Agenda: ${this.ragContext.outreachAgenda}
Meeting Link: ${this.ragContext.meetingLink}

Generate professional, personalized replies that align with our outreach goals.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating suggested reply:', error);
      return null;
    }
  }

  private buildReplyPrompt(email: EmailMessage): string {
    return `
Generate a professional reply for the following email:

From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

Context:
- This is a response to an outreach email about our AI-powered lead generation platform
- The person may be interested in learning more about our services
- We want to maintain a professional tone while being helpful
- If they show interest, we should offer to schedule a meeting

Please generate a reply that:
1. Acknowledges their response appropriately
2. Provides relevant information about our services
3. Includes a call-to-action (like scheduling a meeting)
4. Maintains a professional and helpful tone
5. Is personalized to their specific message

Reply:
`;
  }

  public async updateRAGContext(newContext: Partial<RAGContext>): Promise<void> {
    this.ragContext = { ...this.ragContext, ...newContext };
    console.log('RAG context updated:', this.ragContext);
  }

  public getRAGContext(): RAGContext {
    return this.ragContext;
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

Respond in this format:
sentiment: [positive/negative/neutral]
confidence: [0-1]
key_phrases: [comma-separated list of important phrases]
`;

      const response = await this.openai.chat.completions.create({
        model: config.ai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that analyzes email sentiment and extracts key information.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const result = response.choices[0].message.content;
      return this.parseSentimentResult(result || '');
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
      const lines = result.split('\n');
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      let confidence = 0.5;
      let keyPhrases: string[] = [];

      for (const line of lines) {
        if (line.startsWith('sentiment:')) {
          const sent = line.split(':')[1].trim().toLowerCase();
          if (['positive', 'negative', 'neutral'].includes(sent)) {
            sentiment = sent as 'positive' | 'negative' | 'neutral';
          }
        } else if (line.startsWith('confidence:')) {
          confidence = parseFloat(line.split(':')[1].trim());
        } else if (line.startsWith('key_phrases:')) {
          const phrases = line.split(':')[1].trim();
          keyPhrases = phrases.split(',').map(p => p.trim()).filter(p => p.length > 0);
        }
      }

      return { sentiment, confidence, keyPhrases };
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
