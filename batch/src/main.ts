import "dotenv/config";
import { login, getAllMusic, getTechFlag, getChartConstList, getRankingData } from "./jobs/fetch.ts";
import { upsertMusicList, updateTechFlagList, updateChartConstList, updateRankingDataList } from "./jobs/insert.ts";
import { sendStartEmail, sendCompletionEmail } from "./libs/mailer.ts";
import { push } from "./jobs/push.ts";
import { log } from "./libs/logger.ts";

async function main() {
  log("info", "バッチ処理開始");
  await sendStartEmail();

  // ログイン処理
  await login();

  // 対象楽曲一覧取得
  const musicList = await getAllMusic();
  await upsertMusicList(musicList);
  
  // テクチャレ対象楽曲取得
  const techFlagList = await getTechFlag();
  await updateTechFlagList(techFlagList);
  
  // 譜面定数情報取得
  const chartConstList = await getChartConstList();
  await updateChartConstList(chartConstList);
  
  // ランキング情報取得
  const rankingDataList = await getRankingData(musicList);
  await updateRankingDataList(rankingDataList);

  // プッシュ処理
  await push();

  await sendCompletionEmail(musicList, techFlagList, chartConstList, rankingDataList);
  log("info", "バッチ処理完了");
  process.exit(0);
}

main();