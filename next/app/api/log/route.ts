import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: false,
    },
  }
);

function convertLocalStorageKeys(obj: { [key: string]: string | null }) {
  const keyMap: { [key: string]: string } = {
    "user-id": "user_id",
    "user-name": "user_name",
    "database-level": "database_level",
    "database-diff": "database_diff",
    "database-sort": "database_sort",
    "database-asc-desc": "database_asc_desc",
    "database-tech-exclude": "database_tech_exclude",
    "database-solo-exclude": "database_solo_exclude",
    "database-display-columns": "database_display_columns",
    "recommend-id": "recommend_id",
    "recommend-count": "recommend_count",
    "recommend-tech-exclude": "recommend_tech_exclude",
    "ranking-type": "ranking_type",
    "ranking-show-after-2nd": "ranking_show_after_2nd",
    "map-id": "map_id",
    "map-options": "map_options",
    "map-actives": "map_actives",
    "map-scale": "map_scale",
    "map-offsets": "map_offsets",
  };

  const result: { [key: string]: string | null } = {};
  for (const key in obj) {
    result[keyMap[key] || key] = obj[key];
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      action,
      userAgent,
      localStorage = {},
    }: {
      action: string | null;
      userAgent: string | null;
      localStorage: { [key: string]: string | null };
    } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'action required' }),
        { status: 400 }
      );
    }

    const logData = {
      action,
      user_agent: userAgent,
      ...convertLocalStorageKeys(localStorage),
    };

    const { error } = await supabase
      .from('LOG')
      .insert(logData); // ← 配列じゃなくてもOK

    if (error) {
      console.error(error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (e: any) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500 }
    );
  }
}
