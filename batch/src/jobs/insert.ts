import { generateChartId } from '../libs/function.ts';
import { createClient } from '@supabase/supabase-js';
import { log } from '../libs/logger.ts';

/**
 * 対象楽曲情報一覧をupsertする
 * @param {{ title: string; level: string; diff: string; }[]} musicList
 * @returns {Promise<void>}
 * @throws {Error}
 */
export async function upsertMusicList(musicList: { title: string; level: string; diff: string; }[]) {
  log('info', '対象楽曲情報一覧upsert処理開始');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Service Role Key is not defined in environment variables.');
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const records = [];
    for (const music of musicList) {
      const chartId = await generateChartId(music.title, music.diff, music.level);
      records.push({
        id: chartId,
        title: music.title,
        diff: music.diff,
        level: music.level,
      });
    }

    // 500件ずつbulk upsert
    const BATCH_SIZE = 500;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('CHARTS').upsert(batch, { onConflict: 'id' });
      if (error) {
        console.error(`error: Supabase upsert失敗 (index ${i}):`, error);
        throw error;
      }
    }

    log('info', '対象楽曲情報一覧upsert処理完了');
  } catch (err) {
    log('error', `upsertMusicList関数でエラー: ${err}`);
    console.error(err);
    throw err;
  }
}

/**
 * テクチャレ対象楽曲をupdateする
 * @param {{ title: string; level: string; diff: string; }[]} techFlagList
 * @returns {Promise<void>}
 * @throws {Error}
 */
export async function updateTechFlagList(techFlagList: { title: string; level: string; diff: string; }[]) {
  log('info', 'テクチャレ対象楽曲一覧update処理開始');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Service Role Key is not defined in environment variables.');
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  try {
    const records = [];
    for (const music of techFlagList) {
      const chartId = await generateChartId(music.title, music.diff, music.level);
      records.push({
        id: chartId,
        tech_flag: true,
      });
    }
    // 500件ずつbulk update
    const BATCH_SIZE = 500;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      for (const record of batch) {
        const { data, error: selectError } = await supabase
          .from('CHARTS')
          .select('id')
          .eq('id', record.id)
          .single();
        if (selectError) {
          console.error(`error: Supabase select失敗 (id: ${record.id}):`, selectError);
          throw selectError;
        }
        if (data) {
          const { error: updateError } = await supabase
            .from('CHARTS')
            .update({ tech_flag: record.tech_flag })
            .eq('id', record.id);
          if (updateError) {
            console.error(`error: Supabase update失敗 (id: ${record.id}):`, updateError);
            throw updateError;
          }
        }
      }
    }

    log('info', 'テクチャレ対象楽曲一覧update処理完了');
  } catch (err) {
    log('error', `updateTechFlagList関数でエラー: ${err}`);
    console.error(err);
    throw err;
  }
}

/**
 * 譜面定数情報をupdateする
 * @param {{
 *  title: string;
 *  diff: string;
 *  level: string;
 *  chartConst: number;
 *  ps5Rating: number;
 *  ps4Rating: number;
 *  ps3Rating: number;
 *  ps2Rating: number;
 *  ps1Rating: number;
 * }[]} chartConstList
 * @returns {Promise<void>}
 * @throws {Error}
 */
export async function updateChartConstList(chartConstList: { title: string; diff: string; level: string; chartConst: number; ps5Rating: number; ps4Rating: number; ps3Rating: number; ps2Rating: number; ps1Rating: number;}[]) {
  log('info', '譜面定数情報一覧update処理開始');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Service Role Key is not defined in environment variables.');
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  try {
    const records = [];
    for (const music of chartConstList) {
      const chartId = await generateChartId(music.title, music.diff, music.level);
      records.push({
        id: chartId,
        chart_const: music.chartConst,
        ps_5_rating: music.ps5Rating,
        ps_4_rating: music.ps4Rating,
        ps_3_rating: music.ps3Rating,
        ps_2_rating: music.ps2Rating,
        ps_1_rating: music.ps1Rating,
      });
    }

    // 10件ずつまとめてselectし、存在するidのみupdate、なければログ出力
    const BATCH_SIZE = 10;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const ids = batch.map(r => r.id);
      const { data: existRows, error: selectError } = await supabase
        .from('CHARTS')
        .select('id')
        .in('id', ids);
      log('info', `Processing batch index ${i / BATCH_SIZE + 1}: Checking existence for ${ids.length} records.`);
      if (selectError) {
        console.error(`error: Supabase select失敗 (batch index ${i}):`, selectError);
        throw selectError;
      }
      const existIdSet = new Set((existRows ?? []).map(row => row.id));
      for (const record of batch) {
        if (existIdSet.has(record.id)) {
          const { error: updateError } = await supabase
            .from('CHARTS')
            .update({
              chart_const: record.chart_const,
              ps_5_rating: record.ps_5_rating,
              ps_4_rating: record.ps_4_rating,
              ps_3_rating: record.ps_3_rating,
              ps_2_rating: record.ps_2_rating,
              ps_1_rating: record.ps_1_rating,
            })
            .eq('id', record.id);
          if (updateError) {
            console.error(`error: Supabase update失敗 (id: ${record.id}):`, updateError);
            throw updateError;
          }
        } else {
          log('warn', `CHARTSテーブルに存在しないためスキップ: id=${record.id}`);
        }
      }
    }

    log('info', '譜面定数情報一覧update処理完了');  
  } catch (err) {
    log('error', `updateChartConstList関数でエラー: ${err}`);
    console.error(err);
    throw err;
  }
}

/**
 * ランキング情報をupdateする
 * @param {{
 *  title: string;
 *  level: string;
 *  diff: string;
 *  psTheoryScore: number;
 *  ps5Tolerance: number;
 *  ps5MinScore: number;
 *  tsTheoryCounts: number[];
 *  ps5RainbowCount: number;
 *  ps5Count: number;
 *  ps4Count: number;
 *  ps3Count: number;
 *  ps2Count: number;
 *  ps1Count: number;
 *  psTheoryCount: number;
 * }[]} rankingDataList
 * @returns {Promise<void>}
 * @throws {Error}
 */
export async function updateRankingDataList(rankingDataList: { title: string; level: string; diff: string; psTheoryScore: number; ps5Tolerance: number; ps5MinScore: number; tsTheoryCounts: number[]; ps5RainbowCount: number; ps5Count: number; ps4Count: number; ps3Count: number; ps2Count: number; ps1Count: number; psTheoryCount: number;}[]) {
  log('info', 'ランキング情報一覧update処理開始');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Service Role Key is not defined in environment variables.');
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  try {
    const records = [];
    for (const music of rankingDataList) {
      const chartId = await generateChartId(music.title, music.diff, music.level);
      records.push({
        id: chartId,
        ps_theory_score: music.psTheoryScore,
        ps_5_tolerance: music.ps5Tolerance,
        ps_5_min_score: music.ps5MinScore,
        ts_theory_counts: music.tsTheoryCounts,
        ps_5_total_count: music.ps5RainbowCount + music.ps5Count,
        ps_5_rainbow_count: music.ps5RainbowCount,
        ps_5_count: music.ps5Count,
        ps_4_count: music.ps4Count,
        ps_3_count: music.ps3Count,
        ps_2_count: music.ps2Count,
        ps_1_count: music.ps1Count,
        ps_theory_count: music.psTheoryCount,
      });
    }

    // 10件ずつまとめてselectし、存在するidのみupdate、なければログ出力
    const BATCH_SIZE = 10;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const ids = batch.map(r => r.id);
      const { data: existRows, error: selectError } = await supabase
        .from('CHARTS')
        .select('id')
        .in('id', ids);
      log('info', `Processing batch index ${i / BATCH_SIZE + 1}: Checking existence for ${ids.length} records.`);
      if (selectError) {
        console.error(`error: Supabase select失敗 (batch index ${i}):`, selectError);
        throw selectError;
      }
      const existIdSet = new Set((existRows ?? []).map(row => row.id));
      for (const record of batch) {
        if (existIdSet.has(record.id)) {
          const { error: updateError } = await supabase
            .from('CHARTS')
            .update({
              ps_theory_score: record.ps_theory_score,
              ps_5_tolerance: record.ps_5_tolerance,
              ps_5_min_score: record.ps_5_min_score,
              ts_theory_counts: record.ts_theory_counts,
              ps_5_total_count: record.ps_5_total_count,
              ps_5_rainbow_count: record.ps_5_rainbow_count,
              ps_5_count: record.ps_5_count,
              ps_4_count: record.ps_4_count,
              ps_3_count: record.ps_3_count,
              ps_2_count: record.ps_2_count,
              ps_1_count: record.ps_1_count,
              ps_theory_count: record.ps_theory_count,
            })
            .eq('id', record.id);
          if (updateError) {
            console.error(`error: Supabase update失敗 (id: ${record.id}):`, updateError);
            throw updateError;
          }
        } else {
          log('warn', `CHARTSテーブルに存在しないためスキップ: id=${record.id}`);
        }
      }
    }
    log('info', 'ランキング情報一覧update処理完了');
  } catch (err) {
    log('error', `updateRankingDataList関数でエラー: ${err}`);
    console.error(err);
    throw err;
  }
}