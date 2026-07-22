import { NextResponse } from 'next/server';
import { processInboundEmailWebhook } from '@/actions/emailActions';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // Resend Inbound Webhook Payload Example
    // {
    //   "type": "email.received",
    //   "created_at": "2023-09-22T00:00:00Z",
    //   "data": {
    //     "from": "user@example.com",
    //     "to": ["inbox@n-sistemas.com"],
    //     "subject": "Hello",
    //     "text": "Hello world",
    //     "html": "<p>Hello world</p>"
    //   }
    // }

    // Procesamos la data si proviene de un payload de webhook estructurado
    const emailData = payload.data ? payload.data : payload;

    const result = await processInboundEmailWebhook(emailData);

    if (!result.success) {
      console.error('Error procesando webhook de email:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook payload parsing error:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
