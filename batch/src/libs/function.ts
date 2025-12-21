import crypto from 'crypto';

/**
 * 譜面と1対1で対応するidを生成する
 * 楽曲名(string)をハッシュ化 + 難易度(string) + レベル(string)（"+"は"plus"に変換）
 * @param {string} name
 * @param {string} diff
 * @param {string} level
 * @return {string}
 */
export async function generateChartId(name: string, diff: string, level: string): Promise<string> {
  try {
    const hash = crypto.createHash('md5').update(name).digest('hex');
    const safeLevel = level.replace('+', 'plus');
    return `${hash}_${diff}_${safeLevel}`;
  } catch (err) {
    console.error('error: generateChartId関数でエラー:', err);
    throw err;
  }
}