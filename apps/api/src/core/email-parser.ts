interface ParsedEmail {
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
}

export function parseGmailMessage(message: any): ParsedEmail {
  const headers = message.payload?.headers || [];

  const getHeader = (name: string): string => {
    const header = headers.find(
      (h: any) => h.name.toLowerCase() === name.toLowerCase()
    );
    return header?.value || '';
  };

  const body = extractBody(message.payload);

  return {
    from: getHeader('From'),
    to: getHeader('To'),
    subject: getHeader('Subject'),
    body,
    date: new Date(parseInt(message.internalDate)),
  };
}

function extractBody(payload: any): string {
  if (!payload) return '';

  // Simple text body
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Multipart — look for text/plain first, then text/html
  if (payload.parts) {
    // Prefer text/plain
    const textPart = payload.parts.find(
      (p: any) => p.mimeType === 'text/plain'
    );
    if (textPart?.body?.data) {
      return decodeBase64Url(textPart.body.data);
    }

    // Fall back to text/html (strip tags)
    const htmlPart = payload.parts.find(
      (p: any) => p.mimeType === 'text/html'
    );
    if (htmlPart?.body?.data) {
      const html = decodeBase64Url(htmlPart.body.data);
      return stripHtml(html);
    }

    // Recurse into nested multipart
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractBody(part);
        if (nested) return nested;
      }
    }
  }

  return '';
}

function decodeBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}
