import { NextResponse } from 'next/server';
import { openai } from '@/lib/ai/openai';
import { CLASSIFY_PROMPT } from '@/lib/ai/prompts';
import { mailgateEmails } from '@/lib/mailgate-server';

export async function POST(request: Request) {
  const { emailId } = await request.json();

  if (!emailId) {
    return NextResponse.json({ error: 'emailId is required' }, { status: 400 });
  }

  // Fetch email from Mailgate
  const { email } = await mailgateEmails.get(emailId);

  const prompt = CLASSIFY_PROMPT
    .replace('{from}', email.from)
    .replace('{subject}', email.subject)
    .replace('{body}', (email.body || '').slice(0, 2000));

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    store: false,
    messages: [
      {
        role: 'system',
        content: 'You are an email classification assistant. Return only valid JSON, no markdown.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 300,
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    return NextResponse.json({ error: 'Empty classification response' }, { status: 500 });
  }

  const result = JSON.parse(content);

  // Write classification back to Mailgate
  await mailgateEmails.classify(emailId, {
    category: result.category,
    priority: result.priority,
    summary: result.summary,
    entities: result.entities,
  });

  return NextResponse.json({ classification: result });
}
