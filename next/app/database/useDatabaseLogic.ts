"use client";
import { useState, useRef, useEffect } from "react";
import { initializeLocalStorageSettings } from "@/utils/localStorage";
import { title } from "process";
import { POST } from "../api/log/route";

/**
 * オプション用データ定義
 */
const LEVELS = [
  "15+", "15", "14+", "14", "13+", "13", "12+", "12", "11+", "11", "10+", "10",
  "9+", "9", "8+", "8", "7+", "7", "6", "5", "4", "3", "2", "1", "0"
];
const DIFF = [
  "MASTER", "EXPERT", "ADVANCED", "BASIC", "LUNATIC"
];
const SORTS = [
  { value: "star", label: "☆5 人数" },
  { value: "rainbow", label: "☆5(虹) 人数" },
  { value: "const", label: "譜面定数" }
];
const ORDERS = [
  { value: "desc", label: "降順" },
  { value: "asc", label: "昇順" }
];
const TECH_EXCLUDE = [
  { value: "yes", label: "する" },
  { value: "no", label: "しない" }
];
const SOLO_EXCLUDE = [
  { value: "yes", label: "する" },
  { value: "no", label: "しない" }
];
const DISPLAY_COLUMNS = [
  { value: "title", label: "曲名", displayName: "Title" },
  { value: "diff", label: "難易度", displayName: "Diff" },
  { value: "level", label: "レベル", displayName: "Lev" },
  { value: "chartConst", label: "譜面定数", displayName: "Const" },
  { value: "star5Tlrnc", label: "☆5許容/ノーツ数", displayName: "☆5Tolerance" }, 
  { value: "star5Count", label: "☆5人数", displayName: "☆5" },
  { value: "star5RainbowCount", label: "☆5(虹)人数", displayName: "☆5(R)" },
  { value: "starDistr", label: "☆人数分布", displayName: "☆Distribution" },
];

export const useDatabaseLogic = () => {
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedDiffs, setSelectedDiffs] = useState<string[]>([]);
  const [sort, setSort] = useState("star");
  const [order, setOrder] = useState("desc");
  const [techExclude, setTechExclude] = useState("no");
  const [soloExclude, setSoloExclude] = useState("yes");
  const [displayColumns, setDisplayColumns] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState<null | "level" | "other">(null);
  const [modalTab, setModalTab] = useState<"level" | "other">("level");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tableImageUrl, setTableImageUrl] = useState<string | null>(null);
  const [isSpState, setIsSpState] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * LocalStorageから設定値を取得
   * @returns {void}
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    // 初回アクセス時にlocalStorageの初期化を行う
    initializeLocalStorageSettings();
    function collectLocalStorage() {
      const result: { [key: string]: string | null } = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        result[key] = localStorage.getItem(key);
      }
      return result;
    }
    const localStorageData = collectLocalStorage();
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'visit database page',
        localStorage: localStorageData,
        userAgent: navigator.userAgent
      }),
    });

    const levels = localStorage.getItem("database-level");
    if (levels) {
      try {
        const arr = JSON.parse(levels);
        if (Array.isArray(arr)) setSelectedLevels(arr);
      } catch {}
    }
    const diffs = localStorage.getItem("database-diff");
    if (diffs) {
    try {
      const arr = JSON.parse(diffs);
      if (Array.isArray(arr)) setSelectedDiffs(arr);
      } catch {}
    }
    const sort = localStorage.getItem("database-sort");
    if (sort === "star" || sort === "const" || sort === "rainbow") setSort(sort);
    const order = localStorage.getItem("database-asc-desc");
    if (order === "asc" || order === "desc") setOrder(order);
    const tech = localStorage.getItem("database-tech-exclude");
    if (tech === "yes" || tech === "no") setTechExclude(tech);
    const solo = localStorage.getItem("database-solo-exclude");
    if (solo === "yes" || solo === "no") setSoloExclude(solo);
    const cols = localStorage.getItem("database-display-columns");
    if (cols) {
      try {
        const arr = JSON.parse(cols);
        if (Array.isArray(arr)) setDisplayColumns(arr);
      } catch {}
    }
  }, []);

  /**
   * SP判定
   * @returns {void}
   */
  useEffect(() => {
    const check = () => setIsSpState(window.innerWidth <= 480);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /** 
   * 初回レンダリング時にスクロール位置をトップに設定
   * @returns {void}
   */
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  /**
   * 「オプションを適用」ボタン押下時処理
   *  @returns {Promise<void>}
   */
  const handleApplyOptions = async () => {
    // オプションをlocalStorageに保存
    if (typeof window !== "undefined") {
      localStorage.setItem("database-level", JSON.stringify(selectedLevels));
      localStorage.setItem("database-diff", JSON.stringify(selectedDiffs));
      localStorage.setItem("database-sort", sort);
      localStorage.setItem("database-asc-desc", order);
      localStorage.setItem("database-tech-exclude", techExclude);
      localStorage.setItem("database-solo-exclude", soloExclude);
      localStorage.setItem("database-display-columns", JSON.stringify(displayColumns));
    }

    function collectLocalStorage() {
      const result: { [key: string]: string | null } = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        result[key] = localStorage.getItem(key);
      }
      return result;
    }
    const localStorageData = collectLocalStorage();
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'execute database table generation',
        localStorage: localStorageData,
        userAgent: navigator.userAgent
      }),
    });

    setErrorMsg(null);
    setTableImageUrl(null);

    // バリデーションチェック
    if (selectedLevels.length === 0) {
      setErrorMsg("レベルが選択されていません。");
      return;
    }
    if (selectedDiffs.length === 0) {
      setErrorMsg("難易度が選択されていません。");
      return;
    }
    if (displayColumns.length === 0) {
      setErrorMsg("表示する項目が選択されていません。");
      return;
    }

    // ローディング開始
    setLoading(true);

    try {
      // data.json取得
      const res = await fetch("/data/data.json");
      const json = await res.json();
      if (!Array.isArray(json)) {
        setErrorMsg("データ取得に失敗しました");
        setLoading(false);
        return;
      }

      // データフィルタリング
      let filtered = json.filter((item: any) =>
        item.level && selectedLevels.includes(item.level)
      );

      filtered = filtered.filter((item: any) =>
        item.diff && selectedDiffs.includes(item.diff)
      );

      if (techExclude === "yes") {
        filtered = filtered.filter(
          (item: any) => !item.tech_flag
        );
      }

      if (soloExclude === "yes") {
        filtered = filtered.filter(
          (item: any) => !(item.title && item.title.includes("ソロver"))
        );
      }

      // データ数チェック
      if (filtered.length > 2000) {
        setErrorMsg("データ数が多いため正常に生成できませんでした。\nレベル・難易度選択数を減らして再度お試しください。");
        setLoading(false);
        return;
      }

      // ソートキー定義
      const sortKeys =
        sort === "star"
          ? [
              "ps_5_total_count",
              "ps_4_count",
              "ps_3_count",
              "ps_2_count",
              "ps_1_count",
              "ps_5_rainbow_count",
              "chart_const",
            ]
          : sort === "rainbow"
          ? [
              "ps_5_rainbow_count",
              "ps_5_total_count",
              "ps_4_count",
              "ps_3_count",
              "ps_2_count",
              "ps_1_count",
              "chart_const",
            ]
          : sort === "const"
          ? [
              "chart_const",
              "ps_5_total_count",
              "ps_4_count",
              "ps_3_count",
              "ps_2_count",
              "ps_1_count",
              "ps_5_rainbow_count",
            ]
          : [];
        
      // ソート処理
      filtered.sort((a: any, b: any) => {
        for (const key of sortKeys) {
          const va = Number(a[key] ?? 0);
          const vb = Number(b[key] ?? 0);
          if (va !== vb) {
            return order === "desc" ? vb - va : va - vb;
          }
        }
        return 0;
      });

      // オプション文字列(json形式)作成
      const optLevels = selectedLevels.length > 6
        ? selectedLevels.slice(0, 6).join(", ") + "..."
        : selectedLevels.join(", ");
      const optDiffs = selectedDiffs.map(d => d.slice(0, 3)).join(", ");
      const optSort = sort === "star"
        ? "☆5獲得人数"
        : sort === "rainbow"
          ? "☆5(虹)獲得人数"
          : "譜面定数";
      const optionStr = {
        levels: optLevels,
        diffs: optDiffs,
        sort: `${optSort} ${order === "desc" ? "降順" : "昇順"}`,
        techExclude: techExclude === "yes" ? "除外する" : "除外しない",
        soloExclude: soloExclude === "yes" ? "除外する" : "除外しない",
      };

      // 表示用データ整形
      const tableData = filtered.map((item: any) => {
        return {
          title: item.title,
          diff: item.diff,
          level: item.level,
          chart_const: item.chart_const,
          ps_5_tolerance: item.ps_5_tolerance,
          ps_theory_score: item.ps_theory_score,
          ps_5_min_score: item.ps_5_min_score,
          ps_5_rainbow_count: item.ps_5_rainbow_count,
          ps_5_total_count: item.ps_5_total_count,
          ps_5_count: item.ps_5_count,
          ps_4_count: item.ps_4_count,
          ps_3_count: item.ps_3_count,
          ps_2_count: item.ps_2_count,
          ps_1_count: item.ps_1_count,
        };
      });

      // レイアウト定義
      const rowH = 28;
      const headerH = 120;
      const leftMargin = 18;
      const rightMargin = 18;
      let colRatio = [
        displayColumns.includes("title") ? 6 : 0,
        displayColumns.includes("diff") ? 2 : 0,
        displayColumns.includes("level") ? 1 : 0,
        displayColumns.includes("chartConst") ? 1 : 0,
        displayColumns.includes("star5Tlrnc") ? 3 : 0,
        displayColumns.includes("star5Count") ? 1 : 0,
        displayColumns.includes("star5RainbowCount") ? 1 : 0,
        displayColumns.includes("starDistr") ? 6 : 0,
      ];
      const totalRatio = colRatio.reduce((a, b) => a + b, 0);
      const tableW = 900;
      const colW = colRatio.map(r => Math.round((tableW - leftMargin - rightMargin) * r / totalRatio));
      const canvasW = tableW;
      const canvasH = headerH + rowH * filtered.length + 60;
      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas error");

      // 背景
      ctx.fillStyle = "#e0fbfc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // サイトロゴ描画（左上端）
      const logoX = leftMargin;
      const logoY = 18;
      const logoW = 130;
      const logoH = 44;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(logoX + 8, logoY);
      ctx.lineTo(logoX + logoW - 8, logoY);
      ctx.quadraticCurveTo(logoX + logoW, logoY, logoX + logoW, logoY + 8);
      ctx.lineTo(logoX + logoW, logoY + logoH - 8);
      ctx.quadraticCurveTo(logoX + logoW, logoY + logoH, logoX + logoW - 8, logoY + logoH);
      ctx.lineTo(logoX + 8, logoY + logoH);
      ctx.quadraticCurveTo(logoX, logoY + logoH, logoX, logoY + logoH - 8);
      ctx.lineTo(logoX, logoY + 8);
      ctx.quadraticCurveTo(logoX, logoY, logoX + 8, logoY);
      ctx.closePath();
      ctx.fillStyle = "#3d5a80";
      ctx.shadowColor = "#29324133";
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.restore();
      // favicon.ico描画
      try {
        const favicon = new window.Image();
        favicon.src = "/favicon.ico";
        await new Promise<void>((resolve) => {
          favicon.onload = () => resolve();
          favicon.onerror = () => resolve();
        });
        ctx.drawImage(favicon, logoX + 6, logoY + 6, 32, 32);
      } catch {}
      // テキスト
      ctx.save();
      ctx.font = "bold 17px 'Segoe UI',sans-serif";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(41,50,65,0.10)";
      ctx.shadowBlur = 0;
      ctx.fillText("Pongeki", logoX + 50, logoY + logoH / 2 + 1);
      ctx.restore();

      // 上端ボーダー
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(canvasW, 0);
      ctx.lineWidth = 12;
      ctx.strokeStyle = "#ee6c4d";
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.floor(canvasW * 0.3), 0);
      ctx.stroke();
      ctx.strokeStyle = "#3d5a80";
      ctx.moveTo(Math.floor(canvasW * 0.3), 0);
      ctx.lineTo(canvasW, 0);
      ctx.stroke();
      ctx.restore();

      // 下端ボーダー
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, canvasH - 1);
      ctx.lineTo(canvasW, canvasH - 1);
      ctx.lineWidth = 12;
      ctx.strokeStyle = "#ee6c4d";
      ctx.moveTo(0, canvasH - 1);
      ctx.lineTo(Math.floor(canvasW * 0.3), canvasH - 1);
      ctx.stroke();
      ctx.strokeStyle = "#3d5a80";
      ctx.moveTo(Math.floor(canvasW * 0.3), canvasH - 1);
      ctx.lineTo(canvasW, canvasH - 1);
      ctx.stroke();
      ctx.restore();

      // タイトル表示
      ctx.font = "bold 28px 'Segoe UI',sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#3d5a80";
      ctx.fillText("☆獲得人数一覧", leftMargin + (tableW - leftMargin - rightMargin) / 2, headerH / 2);

      // オプション表示
      ctx.save();
      ctx.font = "12px 'Segoe UI',sans-serif";
      ctx.textAlign = "right";
      ctx.fillStyle = "#293241";
      const optX = canvasW - 24;
      let optY = 26;
      ctx.fillText(new Date().toLocaleString("ja-JP", { hour12: false }), optX, optY);
      ctx.fillText("Level: " + optionStr.levels, optX, optY + 16);
      ctx.fillText("Diff: " + optionStr.diffs, optX, optY + 32);
      ctx.fillText("Sort: " + optionStr.sort , optX, optY + 48);
      ctx.fillText("テクチャレ対象曲: " + optionStr.techExclude , optX, optY + 64);
      ctx.fillText("ソロver.対象曲: " + optionStr.soloExclude, optX, optY + 80);
      ctx.restore();

      // テーブルヘッダー
      const displayCols = DISPLAY_COLUMNS.filter(col => col.displayName);
      let x = leftMargin;
      ctx.font = "bold 16px 'Segoe UI',sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let c = 0; c < displayCols.length; ++c) {
        ctx.fillStyle = "#3d5a80";
        ctx.fillRect(x, headerH, colW[c], rowH);
        ctx.strokeStyle = "#98c1d9";
        ctx.strokeRect(x, headerH, colW[c], rowH);
        ctx.fillStyle = "#fff";;
        ctx.fillText(displayCols[c].displayName ?? "", x + colW[c] / 2, headerH + rowH / 2 + 1, colW[c] - 8);
        x += colW[c];
      }

      // テーブル本体
      for (let r = 0; r < tableData.length; ++r) {
        let x = leftMargin;
        const item = tableData[r];

        // title
        if (displayColumns.includes("title")) {
          let bgColor = "#fff";
          switch (item.diff) {
            case "MASTER": bgColor = "#f3e6fa"; break;
            case "EXPERT": bgColor = "#fde6f3"; break;
            case "ADVANCED": bgColor = "#fff2e0"; break;
            case "BASIC": bgColor = "#e6fae6"; break;
            case "LUNATIC": bgColor = "#f3f3f3"; break;
          }
          ctx.fillStyle = bgColor;
          ctx.fillRect(x, headerH + rowH * (r + 1), colW[0], rowH);
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(x, headerH + rowH * (r + 1), colW[0], rowH);
          ctx.fillStyle = "#293241";
          ctx.textAlign = "left";
          ctx.font = "bold 15px 'Segoe UI',sans-serif";
          ctx.fillText(item.title ?? "", x + 12, headerH + rowH * (r + 1) + rowH / 2 + 1, colW[0] - 24);
          x += colW[0];
        }

        // Diff
        if (displayColumns.includes("diff")) {
          let diffColor = "#293241";
          switch (item.diff) {
            case "MASTER": diffColor = "#a259e6"; break;
            case "EXPERT": diffColor = "#e0408a"; break;
            case "ADVANCED": diffColor = "#ff9800"; break;
            case "BASIC": diffColor = "#7ed957"; break;
            case "LUNATIC": diffColor = "#222"; break;
          }
          ctx.fillStyle = "#fff";
          ctx.fillRect(x, headerH + rowH * (r + 1), colW[1], rowH);
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(x, headerH + rowH * (r + 1), colW[1], rowH);
          ctx.fillStyle = diffColor;
          ctx.textAlign = "center";
          ctx.font = "bold 15px 'Segoe UI',sans-serif";
          ctx.fillText(item.diff ?? "", x + colW[1] / 2, headerH + rowH * (r + 1) + rowH / 2 + 1, colW[1] - 8);
          x += colW[1];
        }

        // Lev
        if (displayColumns.includes("level")) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(x, headerH + rowH * (r + 1), colW[2], rowH);
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(x, headerH + rowH * (r + 1), colW[2], rowH);
          ctx.fillStyle = "#293241";
          ctx.textAlign = "center";
          ctx.font = "15px 'Segoe UI',sans-serif";
          ctx.fillText(item.level ?? "", x + colW[2] / 2, headerH + rowH * (r + 1) + rowH / 2 + 1, colW[2] - 8);
          x += colW[2];
        }

        // Const
        if (displayColumns.includes("chartConst")) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(x, headerH + rowH * (r + 1), colW[3], rowH);
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(x, headerH + rowH * (r + 1), colW[3], rowH);
          ctx.fillStyle = "#293241";
          ctx.textAlign = "center";
          ctx.font = "15px 'Segoe UI',sans-serif";
          let chartConstDisp = "";
          if (item.chart_const !== undefined && item.chart_const !== null && item.chart_const !== "") {
            let num = Number(item.chart_const);
            chartConstDisp = isNaN(num) ? String(item.chart_const) : num.toFixed(1);
          }
          ctx.fillText(chartConstDisp, x + colW[3] / 2, headerH + rowH * (r + 1) + rowH / 2 + 1, colW[3] - 8);
          x += colW[3];
        }

        // ☆5 Tolerance/Notes
        if (displayColumns.includes("star5Tlrnc")) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(x, headerH + rowH * (r + 1), colW[4], rowH);
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(x, headerH + rowH * (r + 1), colW[4], rowH);
          ctx.fillStyle = "#293241";
          ctx.textAlign = "center";
          ctx.font = "15px 'Segoe UI',sans-serif";
          let tlrncDisp = "";
          if (item.ps_5_tolerance !== undefined && item.ps_5_tolerance !== null && item.ps_5_tolerance !== "") {
            tlrncDisp = String(item.ps_5_min_score + "(-" + item.ps_5_tolerance + ")/" + item.ps_theory_score);
          }
          ctx.fillText(tlrncDisp, x + colW[4] / 2, headerH + rowH * (r + 1) + rowH / 2 + 1, colW[4] - 8);
          x += colW[4];
        }

        // ☆5 Count
        if (displayColumns.includes("star5Count")) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(x, headerH + rowH * (r + 1), colW[5], rowH);
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(x, headerH + rowH * (r + 1), colW[5], rowH);
          ctx.fillStyle = "#293241";
          if (Number(item.ps_5_total_count) >= 100) {
            ctx.fillStyle = "#e73c3c";
          }
          ctx.textAlign = "center";
          ctx.font = "bold 15px 'Segoe UI',sans-serif";
          ctx.fillText(item.ps_5_total_count ?? "", x + colW[5] / 2, headerH + rowH * (r + 1) + rowH / 2 + 1, colW[5] - 8);
          x += colW[5];
        }

        // ☆5(R) Count
        if (displayColumns.includes("star5RainbowCount")) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(x, headerH + rowH * (r + 1), colW[6], rowH);
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(x, headerH + rowH * (r + 1), colW[6], rowH);
          ctx.fillStyle = "#293241";
          if (Number(item.ps_5_rainbow_count) >= 100) {
            ctx.fillStyle = "#e73c3c";
          }
          ctx.textAlign = "center";
          ctx.font = "bold 15px 'Segoe UI',sans-serif";
          ctx.fillText(item.ps_5_rainbow_count ?? "", x + colW[6] / 2, headerH + rowH * (r + 1) + rowH / 2 + 1, colW[6] - 8);
          x += colW[6];
        }

        // ☆5Distribution
        if (displayColumns.includes("starDistr")) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, headerH + rowH * (r + 1), colW[7], rowH);
          ctx.clip();

          // データ取得
          const rainbow = Number(item.ps_5_rainbow_count ?? 0);
          const star5 = Number(item.ps_5_count ?? 0);
          const star4 = Number(item.ps_4_count ?? 0);
          const star3 = Number(item.ps_3_count ?? 0);
          const star2 = Number(item.ps_2_count ?? 0);
          const star1 = Number(item.ps_1_count ?? 0);
          let remain = 100;
          const segs = [
            { n: rainbow, type: "rainbow" },
            { n: star5, type: "red" },
            { n: star4, type: "orange" },
            { n: star3, type: "yellow" },
            { n: star2, type: "green" },
            { n: star1, type: "blue" },
          ].map((v) => {
            const use = Math.max(0, Math.min(remain, v.n));
            remain -= use;
            return { ...v, n: use };
          });
          if (remain > 0) segs.push({ n: remain, type: "gray" });

          // 各セグメント描画
          let segX = x;
          const segW = colW[7] / 100;
          for (const seg of segs) {
            if (seg.n <= 0) continue;
            if (seg.type === "rainbow") {
              for (let i = 0; i < seg.n; ++i) {
                const grad = ctx.createLinearGradient(
                  segX + i * segW, headerH + rowH * (r + 1),
                  segX + (i + 1) * segW, headerH + rowH * (r + 2)
                );
                grad.addColorStop(0, "#ff0000");
                grad.addColorStop(0.2, "#ffa500");
                grad.addColorStop(0.4, "#ffff00");
                grad.addColorStop(0.6, "#00ff00");
                grad.addColorStop(0.8, "#00bfff");
                grad.addColorStop(1, "#800080");
                ctx.fillStyle = grad;
                ctx.fillRect(segX + i * segW, headerH + rowH * (r + 1), segW, rowH);
              }
              segX += seg.n * segW;
              continue;
            }
            if (seg.type === "red") ctx.fillStyle = "#ff0000";
            else if (seg.type === "orange") ctx.fillStyle = "#ffa500";
            else if (seg.type === "yellow") ctx.fillStyle = "#ffff00";
            else if (seg.type === "green") ctx.fillStyle = "#00ff00";
            else if (seg.type === "blue") ctx.fillStyle = "#00bfff";
            else ctx.fillStyle = "#c0c0c0";
            ctx.fillRect(segX, headerH + rowH * (r + 1), seg.n * segW, rowH);
            segX += seg.n * segW;
          }
          ctx.restore();
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(x, headerH + rowH * (r + 1), colW[7], rowH);
        }
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setTableImageUrl(url);
        }
      });
    } catch (e: any) {
      setErrorMsg("データ取得・描画に失敗しま した");
    }
    setLoading(false);
  };

  return {
    LEVELS,
    DIFF,
    SORTS,
    ORDERS,
    TECH_EXCLUDE,
    SOLO_EXCLUDE,
    DISPLAY_COLUMNS,
    selectedLevels,
    setSelectedLevels,
    selectedDiffs,
    setSelectedDiffs,
    sort,
    setSort,
    order,
    setOrder,
    techExclude,
    setTechExclude,
    soloExclude,
    setSoloExclude,
    displayColumns,
    setDisplayColumns,
    modalOpen,
    setModalOpen,
    modalTab,
    setModalTab,
    loading,
    setLoading,
    errorMsg,
    setErrorMsg,
    tableImageUrl,
    setTableImageUrl,
    isSpState,
    canvasRef,
    handleApplyOptions,
  };
};
