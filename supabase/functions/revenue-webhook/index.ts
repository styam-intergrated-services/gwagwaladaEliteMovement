import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const BodySchema = z.object({
  ward: z.enum(['Gwagwalada Center', 'Paiko', 'Ibwa', 'Zuba', 'Kutunku']),
  amount: z.number().positive(),
  source: z.string().min(1).max(255),
  linked_project_id: z.string().uuid().optional(),
  recorded_at: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});

export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const secret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('REVENUE_WEBHOOK_SECRET');

    if (!expectedSecret) {
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!secret || secret !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabase.from('revenue_logs').insert({
      ward: parsed.data.ward,
      amount: parsed.data.amount,
      source: parsed.data.source,
      linked_project_id: parsed.data.linked_project_id,
      recorded_at: parsed.data.recorded_at ? new Date(parsed.data.recorded_at).toISOString() : new Date().toISOString(),
      notes: parsed.data.notes,
    }).select().single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
