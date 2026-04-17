import "dotenv/config";
import { login, getAllMusic, getTechFlag, getChartConstList, getRankingData } from "./jobs/fetch.js";
import { upsertMusicList, updateTechFlagList, updateChartConstList, updateRankingDataList, markDeletedMusicList } from "./jobs/insert.js";
import { sendStartEmail, sendCompletionEmail, sendErrorEmail } from "./libs/mailer.js";
import { push } from "./jobs/push.js";
import { log } from "./libs/logger.js";

async function main() {
  try {
    log("info", "バッチ処理開始");
    const startDateTime = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
    await sendStartEmail(startDateTime);

    // ログイン処理
    await login();

    // 対象楽曲一覧取得
    const musicList = await getAllMusic();
    await upsertMusicList(musicList);
    await markDeletedMusicList(musicList);
    
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

    await sendCompletionEmail(startDateTime, musicList, techFlagList, chartConstList, rankingDataList);
    log("info", "バッチ処理完了");
    process.exit(0);
  } catch (error) {
    log("error", `バッチ処理異常終了: ${error}`);
    await sendErrorEmail(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();