import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

import { log } from '../libs/logger.ts';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// ESM環境で__dirnameを定義
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SupabaseからCHARTSテーブルの全データを取得し、
 * JSONファイルに保存してgitでプッシュする。
 * @returns {Promise<void>}
 */
export async function push() {
  log('info', 'SupabaseからCHARTS全データ取得開始');

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or Service Role Key is not defined in environment variables.');
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. CHARTSテーブルから全レコード・全カラム取得（1000件ずつページング）
    const allData = [];
    const PAGE_SIZE = 1000;
    let offset = 0;
    while (true) {
      const { data, error } = await supabase
        .from('CHARTS')
        .select('*')
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) {
        log('error', `Supabaseからのデータ取得失敗: ${error.message}`);
        throw error;
      }
      if (data && data.length > 0) {
        allData.push(...data);
        if (data.length < PAGE_SIZE) {
          break;
        }
        offset += PAGE_SIZE;
      } else {
        break;
      }
    }
    log('info', `取得件数: ${allData.length}`);

    // 2. jsonファイルを上書き
    const jsonPath = path.resolve(__dirname, '../../../next/public/data/data.json');
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify(allData, null, 2), 'utf-8');
    log('info', `JSONファイル書き込み完了: ${jsonPath}`);

    // 3. git add/commit/push
    try {
      execSync(`git add ${jsonPath}`);
      execSync(`git commit -m "update data.json by push.ts"`);
      execSync('git push');
      log('info', 'git push完了');
    } catch (e) {
      log('error', `git push失敗: ${e}`);
      throw e;
    }
  } catch (err) {
    log('error', `push関数でエラー: ${err}`);
    console.error(err);
  }
}
