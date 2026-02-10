import { NextResponse } from 'next/server';
import { openai } from '@/lib/ai/openai';
import { DRAFT_PROMPT } from '@/lib/ai/prompts';
import { mailgateEmails, mailgateDrafts } from '@/lib/mailgate-server';

export async function POST(request: Request) {
  const { emailId, template } = await request.json();

  if (!emailId) {
    return NextResponse.json({ error: 'emailId is required' }, { status: 400 });
  }

  // Fetch email from Mailgate
  const { email } = await mailgateEmails.get(emailId);

  const templateInstruction = template
    ? `Use this as a guide for the reply style/content: "${template}"`
    : '';

  const prompt = DRAFT_PROMPT
    .replace('{from}', email.from)
    .replace('{subject}', email.subject)
    .replace('{body}', (email.body || '').slice(0, 3000))
    .replace('{template_instruction}', templateInstruction);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    store: false,
    messages: [
      { role: 'system', content: 'You are a professional email assistant.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  const draftContent = completion.choices[0].message.content;
  if (!draftContent) {
    return NextResponse.json({ error: 'Empty draft response' }, { status: 500 });
  }

  // Create draft in Mailgate
  const { draft } = await mailgateDrafts.create({
    emailId,
    content: draftContent,
  });

  return NextResponse.json({ draft });
}
