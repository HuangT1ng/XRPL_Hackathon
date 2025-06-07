// aiVerifyCompany.ts
import { OpenAI } from 'openai';
import { z } from 'zod';
import { config } from '@/lib/config';
import { log } from '@/lib/logger';

const openai = new OpenAI({ apiKey: config.secrets.openaiKey });

const CompanyCheckSchema = z.object({
  companyName: z.string(),
  website: z.string().optional(),
  registrationNumber: z.string().optional(),
  industry: z.string(),
  country: z.string(),
  yearFounded: z.string().optional(),
  headquarters: z.string().optional(),
  contactEmail: z.string().email().optional(),
  linkedin: z.string().url().optional()
});

interface VerificationResult {
  isLegit: boolean;
  confidence: number;
  redFlags?: string[];
  matchedSources?: string[];
  explanation: string;
}

export async function verifyCompany(input: z.infer<typeof CompanyCheckSchema>): Promise<VerificationResult> {
  const validated = CompanyCheckSchema.safeParse(input);
  if (!validated.success) {
    throw new Error('Invalid company data for verification');
  }

  const prompt = `You are a due diligence agent. Use the following data to determine whether a company is legitimate. 

Data:
Company Name: ${input.companyName}
Industry: ${input.industry}
Country: ${input.country}
Website: ${input.website || 'N/A'}
Registration No.: ${input.registrationNumber || 'N/A'}
Founded: ${input.yearFounded || 'N/A'}
HQ: ${input.headquarters || 'N/A'}
Email: ${input.contactEmail || 'N/A'}
LinkedIn: ${input.linkedin || 'N/A'}

Consider the following:
- Is the company name verifiable in public records or web searches?
- Does the domain look like a valid corporate site?
- Are registration number, founding year, and location consistent?
- Are there scam or fraud alerts linked to it?
- Would an investor trust this data?

Respond in JSON with these fields:
{
  "isLegit": boolean,
  "confidence": float (0.0 - 1.0),
  "redFlags": string[] (if any),
  "matchedSources": string[] (if any),
  "explanation": string
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a strict AI compliance officer who verifies company legitimacy for investors.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    });

    const raw = completion.choices[0].message.content;
    if (!raw) throw new Error('Empty AI response');

    const parsed = JSON.parse(raw);

    if (typeof parsed.isLegit !== 'boolean' || typeof parsed.confidence !== 'number') {
      throw new Error('Malformed AI response');
    }

    return parsed as VerificationResult;
  } catch (err) {
    log.error('AI_VERIFICATION', 'Failed to verify company:', err);
    throw new Error('Failed to verify company legitimacy');
  }
}
