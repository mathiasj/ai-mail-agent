export const CLASSIFY_PROMPT = `Analyze this email and return a JSON classification.

From: {from}
Subject: {subject}
Body (truncated): {body}

Return ONLY valid JSON with this exact structure:
{
  "category": "action-required" | "fyi" | "meeting" | "newsletter" | "spam" | "automated",
  "priority": <number 1-10>,
  "summary": "<one sentence summary>",
  "entities": {
    "people": ["<name>"],
    "companies": ["<company>"],
    "dates": ["<YYYY-MM-DD>"],
    "amounts": ["<$X.XX>"]
  }
}

Category rules:
- "action-required": Needs a response or action from the recipient (priority 7-10)
- "fyi": Informational, no action needed (priority 4-6)
- "meeting": Calendar invites or meeting-related (priority 6-8)
- "newsletter": Marketing emails, digests, updates (priority 1-3)
- "spam": Unsolicited commercial or phishing (priority 0-1)
- "automated": No-reply system notifications like shipping, receipts (priority 2-4)`;

export const DRAFT_PROMPT = `You are a professional email assistant. Write a reply to this email.

From: {from}
Subject: {subject}
Body: {body}

{template_instruction}

Requirements:
- Professional but friendly tone
- Keep it concise (2-3 paragraphs max)
- Match the formality level of the original email
- Do NOT include subject line
- Do NOT include greetings like "Dear..." if the original is casual
- Sign with just a first name placeholder: [Your Name]

Return ONLY the email body text.`;
