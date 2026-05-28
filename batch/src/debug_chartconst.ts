import "dotenv/config";
import { getChartConstList } from "./jobs/fetch.js";
import { log } from "./libs/logger.js";

async function main() {
  try {
    log("info", "===== 譜面定数デバッグ実行開始 =====");

    const chartConstList = await getChartConstList();

    log("info", `===== 取得結果: ${chartConstList.length} 件 =====`);

    if (chartConstList.length === 0) {
      log("warn", "譜面定数が0件です。取得に失敗している可能性があります。");
      process.exit(1);
    }

    // 先頭10件を出力
    log("info", "--- 先頭10件 ---");
    chartConstList.slice(0, 10).forEach((item, i) => {
      log("info", `[${i + 1}] ${item.title} | ${item.diff} | Lv${item.level} | 定数:${item.chartConst} | ps5:${item.ps5Rating}`);
    });

    // 末尾10件を出力
    log("info", "--- 末尾10件 ---");
    chartConstList.slice(-10).forEach((item, i) => {
      log("info", `[${chartConstList.length - 9 + i}] ${item.title} | ${item.diff} | Lv${item.level} | 定数:${item.chartConst}`);
    });

    // 難易度ごとの件数集計
    const diffCount: { [key: string]: number } = {};
    for (const item of chartConstList) {
      diffCount[item.diff] = (diffCount[item.diff] ?? 0) + 1;
    }
    log("info", "--- 難易度別件数 ---");
    for (const [diff, count] of Object.entries(diffCount)) {
      log("info", `${diff}: ${count} 件`);
    }

    log("info", "===== 譜面定数デバッグ実行完了 =====");
    process.exit(0);
  } catch (error) {
    log("error", `デバッグ実行エラー: ${error}`);
    process.exit(1);
  }
}

main();
