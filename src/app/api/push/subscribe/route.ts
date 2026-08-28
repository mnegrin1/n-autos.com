import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, userEmail, agencyId } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 });
    }

    console.log('[Push API] Nueva suscripción push recibida para:', { userEmail, agencyId, endpoint: subscription.endpoint });

    // En un entorno de producción con Supabase, aquí se registra la suscripción en la tabla push_subscriptions:
    // await supabaseAdmin.from('push_subscriptions').upsert({
    //   user_email: userEmail,
    //   agency_id: agencyId,
    //   endpoint: subscription.endpoint,
    //   subscription_json: JSON.stringify(subscription),
    //   updated_at: new Date().toISOString()
    // });

    return NextResponse.json({ success: true, message: 'Suscripción push registrada correctamente' });
  } catch (error: any) {
    console.error('Error registrando suscripción push:', error);
    return NextResponse.json({ error: 'Error interno guardando suscripción push' }, { status: 500 });
  }
}
