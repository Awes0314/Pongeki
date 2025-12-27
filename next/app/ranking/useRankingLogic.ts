"use client";
import { useState, useRef, useEffect } from "react";
import { initializeLocalStorageSettings } from "@/utils/localStorage";

export const useDatabaseLogic = () => {
  const [tab, setTab] = useState<"ts" | "ps">("ts");
  const [showAfter2nd, setShowAfter2nd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tableImageUrl, setTableImageUrl] = useState<string | null>(null);

  /**
   * LocalStorageから設定値を取得
   * @returns {void}
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    // 初回アクセス時にlocalStorageの初期化を行う
    initializeLocalStorageSettings();

    const type = localStorage.getItem("ranking-type");
    if (type === "ts" || type === "ps") setTab(type);
    const showAfter2nd = localStorage.getItem("ranking-show-after-2nd");
    if (showAfter2nd === "true") setShowAfter2nd(true)
      else setShowAfter2nd(false);
  }, []);

  /** 
   * 初回レンダリング時にスクロール位置をトップに設定
   * @returns {void}
   */
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  /**
   * 画像生成処理
   * @returns {void}
   */
  useEffect(() => {
    // オプションをlocalStorageに保存
    localStorage.setItem("ranking-type", tab);
    localStorage.setItem("ranking-show-after-2nd", showAfter2nd ? "true" : "false");

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
        action: 'execute ranking table generation',
        localStorage: localStorageData,
        userAgent: navigator.userAgent
      }),
    });
    
    setTableImageUrl(null);
    setLoading(true);

    // データ取得
    fetch("/data/data.json")
      .then((res) => res.json())
      .then(async (json) => {
        if (!Array.isArray(json)) return;
        let filtered: any[] = [];
        let header: string[] = [];
        let rows: any[][] = [];

        // TS1位理論値回数
        if (tab === "ts" && !showAfter2nd) {
          filtered = json.filter(
            (item: any) => item.ts_theory_counts.length >= 1
          );
          filtered.sort((a: any, b: any) => {
            const ta = Number(a.ts_theory_counts[0] ?? 0);
            const tb = Number(b.ts_theory_counts[0] ?? 0);
            if (ta !== tb) return tb - ta;
            const ca = Number(a.chart_const ?? 0);
            const cb = Number(b.chart_const ?? 0);
            return cb - ca;
          });
          header = ["Title", "Diff", "Lev", "TS1 ThCount"];
          rows = filtered.map((item) => [
            item.title ?? "",
            item.diff ?? "",
            item.level ?? "",
            item.ts_theory_counts[0] ?? "",
          ]);
        } else if (tab === "ts" && showAfter2nd) {
          // TS1位理論値回数（2位以降も表示）
          // ts_theory_countsが複数ある場合にも別として扱い、同一楽曲内での順位も表示する
          filtered = json.filter(
            (item: any) => item.ts_theory_counts.length >= 1
          );
          const expanded: any[] = [];
          filtered.forEach((item: any) => {
            const counts: number[] = item.ts_theory_counts;
            counts.forEach((count: number, index: number) => {
              expanded.push({
                title: item.title,
                diff: item.diff,
                level: item.level,
                ts_theory_count: count,
                rank: index + 1,
                chart_const: item.chart_const,
              });
            });
          });
          expanded.sort((a: any, b: any) => {
            if (a.ts_theory_count !== b.ts_theory_count) return b.ts_theory_count - a.ts_theory_count;
            const ca = Number(a.chart_const ?? 0);
            const cb = Number(b.chart_const ?? 0);
            return cb - ca;
          });
          header = ["Title", "Diff", "Lev", "Rank", "TS ThCount"];
          rows = expanded.map((item) => [
            item.title ?? "",
            item.diff ?? "",
            item.level ?? "",
            item.rank ?? "",
            item.ts_theory_count ?? "",
          ]);
          rows = rows.slice(0, 1000);
        } else {
          filtered = json.filter(
            (item: any) => Number(item.ps_theory_count ?? 0) >= 1
          );
          filtered.sort((a: any, b: any) => {
            const pa = Number(a.ps_theory_count ?? 0);
            const pb = Number(b.ps_theory_count ?? 0);
            if (pa !== pb) return pb - pa;
            const ca = Number(a.chart_const ?? 0);
            const cb = Number(b.chart_const ?? 0);
            return cb - ca;
          });
          header = ["Title", "Diff", "Lev", "PS ThCount"];
          rows = filtered.map((item) => [
            item.title ?? "",
            item.diff ?? "",
            item.level ?? "",
            item.ps_theory_count ?? "",
          ]);
        }
        
        // canvas描画
        // 画像仕様: 上端・下端ボーダー、左右余白、カラム色・背景色
        const rowH = 38;
        const headerH = 120;
        const leftMargin = 18;
        const rightMargin = 18;
        // カラム幅割合: 8:3:2:3(:3)
        const colRatio = header.length === 5 ? [8, 3, 2, 2, 3] : [8, 3, 2, 3];
        const totalRatio = colRatio.reduce((a, b) => a + b, 0);
        const tableW = 900;
        const colW = colRatio.map((r) =>
          Math.round((tableW - leftMargin - rightMargin) * r / totalRatio)
        );
        const canvasW = tableW;
        const canvasH = headerH + rowH * rows.length + rowH + 60;

        // TS1/PS-MAX値の最大・最小取得
        let minVal = 99999,
          maxVal = -99999;
        if (tab === "ts") {
          for (const row of rows) {
            const v = Number(row[tab === "ts" && showAfter2nd ? 4 : 3]);
            if (!isNaN(v)) {
              minVal = Math.min(minVal, v);
              maxVal = Math.max(maxVal, v);
            }
          }
          minVal = Math.max(minVal, 10);
          maxVal = Math.min(maxVal, 999);
        } else {
          for (const row of rows) {
            const v = Number(row[3]);
            if (!isNaN(v)) {
              minVal = Math.min(minVal, v);
              maxVal = Math.max(maxVal, v);
            }
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 背景
        ctx.fillStyle = "#e0fbfc";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

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

        // タイトル表示
        const titleText = tab === "ts"
          ? showAfter2nd
            ? "T-SCORE 理論値回数"
            : "T-SCORE 譜面別1位理論値回数"
          : "P-SCORE 理論値人数";
        ctx.font = "bold 28px 'Segoe UI',sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#3d5a80";
        ctx.fillText(titleText, leftMargin + (tableW - leftMargin - rightMargin) / 2, headerH / 2 + 4);

        // オプション表示
        ctx.save();
        ctx.font = "12px 'Segoe UI',sans-serif";
        ctx.textAlign = "right";
        ctx.fillStyle = "#293241";
        const optX = canvasW - 24;
        let optY = 30;
        ctx.fillText(new Date().toLocaleString("ja-JP", { hour12: false }), optX, optY);
        ctx.restore();

        // ヘッダー
        const header2 =
          tab === "ts" && !showAfter2nd
            ? ["Title", "Diff", "Lev", "TS1 ThCount"]
            : tab === "ts" && showAfter2nd
              ? ["Title", "Diff", "Lev", "Rank", "TS ThCount"]
            : ["Title", "Diff", "Lev", "PS ThCount"];
        let x = leftMargin;
        ctx.font = "bold 16px 'Segoe UI',sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let c = 0; c < header.length; ++c) {
          ctx.fillStyle = "#3d5a80";
          ctx.fillRect(x, headerH, colW[c], rowH);
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(x, headerH, colW[c], rowH);
          ctx.fillStyle = "#fff";
          ctx.fillText(
            header2[c],
            x + colW[c] / 2,
            headerH + rowH / 2,
            colW[c] - 8
          );
          x += colW[c];
        }

        // 本体
        ctx.font = "15px 'Segoe UI',sans-serif";
        for (let r = 0; r < rows.length; ++r) {
          let x = leftMargin;
          const item = rows[r];
          // Title背景色
          let bgColor = "#fff";
          switch (item[1]) {
            case "MASTER":
              bgColor = "#f3e6fa";
              break;
            case "EXPERT":
              bgColor = "#fde6f3";
              break;
            case "ADVANCED":
              bgColor = "#fff2e0";
              break;
            case "BASIC":
              bgColor = "#e6fae6";
              break;
            case "LUNATIC":
              bgColor = "#f3f3f3";
              break;
          }
          // Title
          ctx.fillStyle = bgColor;
          ctx.fillRect(
            x,
            headerH + rowH * (r + 1),
            colW[0],
            rowH
          );
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(
            x,
            headerH + rowH * (r + 1),
            colW[0],
            rowH
          );
          ctx.fillStyle = "#293241";
          ctx.textAlign = "left";
          ctx.font = "bold 18px 'Segoe UI',sans-serif";
          ctx.fillText(
            item[0] ?? "",
            x + 12,
            headerH + rowH * (r + 1) + rowH / 2,
            colW[0] - 24
          );
          x += colW[0];

          // Diff
          let diffColor = "#293241";
          switch (item[1]) {
            case "MASTER":
              diffColor = "#a259e6";
              break;
            case "EXPERT":
              diffColor = "#e0408a";
              break;
            case "ADVANCED":
              diffColor = "#ff9800";
              break;
            case "BASIC":
              diffColor = "#7ed957";
              break;
            case "LUNATIC":
              diffColor = "#222";
              break;
          }
          ctx.fillStyle = "#fff";
          ctx.fillRect(
            x,
            headerH + rowH * (r + 1),
            colW[1],
            rowH
          );
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(
            x,
            headerH + rowH * (r + 1),
            colW[1],
            rowH
          );
          ctx.fillStyle = diffColor;
          ctx.textAlign = "center";
          ctx.font = "bold 18px 'Segoe UI',sans-serif";
          ctx.fillText(
            item[1] ?? "",
            x + colW[1] / 2,
            headerH + rowH * (r + 1) + rowH / 2,
            colW[1] - 8
          );
          x += colW[1];

          // Lev
          ctx.fillStyle = "#fff";
          ctx.fillRect(
            x,
            headerH + rowH * (r + 1),
            colW[2],
            rowH
          );
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(
            x,
            headerH + rowH * (r + 1),
            colW[2],
            rowH
          );
          ctx.fillStyle = "#293241";
          ctx.textAlign = "center";
          ctx.font = "18px 'Segoe UI',sans-serif";
          ctx.fillText(
            item[2] ?? "",
            x + colW[2] / 2,
            headerH + rowH * (r + 1) + rowH / 2,
            colW[2] - 8
          );
          x += colW[2];

          // Rank（headerが5列のときのみ）
          // 太文字
          if (header.length === 5) {
            ctx.fillStyle = "#fff";
            ctx.fillRect(
              x,
              headerH + rowH * (r + 1),
              colW[3],
              rowH
            );
            ctx.strokeStyle = "#98c1d9";
            ctx.strokeRect(
              x,
              headerH + rowH * (r + 1),
              colW[3],
              rowH
            );
            ctx.fillStyle = "#293241";
            ctx.textAlign = "center";
            ctx.font = "bold 18px 'Segoe UI',sans-serif";
            ctx.fillText(
              item[3] ?? "",
              x + colW[3] / 2,
              headerH + rowH * (r + 1) + rowH / 2,
              colW[3] - 8
            );
            x += colW[3];
          }

          // TS1 Count or PS-MAX Count（常に最後のカラム）
          let val = Number(item[header.length - 1]);
          let bg = "#fff",
            fg = "#293241";
          if (tab === "ts") {
            if (val >= 1000) {
              bg = "#222";
              fg = "#fff";
            } else {
              // 10で白、999で黄色
              const ratio = Math.max(0, Math.min(1, (val - 10) / (999 - 10)));
              // 白→黄色
              const r = Math.round(255);
              const g = Math.round(255 * (1 - ratio) + 255 * ratio);
              const b = Math.round(255 * (1 - ratio));
              bg = `rgb(${r},${g},${b})`;
              fg = "#293241";
            }
          } else {
            // PS-MAX Count
            if (maxVal > minVal) {
              const ratio = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
              const r = Math.round(255);
              const g = Math.round(255 * (1 - ratio) + 255 * ratio);
              const b = Math.round(255 * (1 - ratio));
              bg = `rgb(${r},${g},${b})`;
              fg = "#293241";
            }
          }
          ctx.fillStyle = bg;
          ctx.fillRect(
            x,
            headerH + rowH * (r + 1),
            colW[header.length - 1],
            rowH
          );
          ctx.strokeStyle = "#98c1d9";
          ctx.strokeRect(
            x,
            headerH + rowH * (r + 1),
            colW[header.length - 1],
            rowH
          );
          ctx.fillStyle = fg;
          ctx.textAlign = "center";
          ctx.font = "bold 20px 'Segoe UI',sans-serif";
          ctx.fillText(
            item[header.length - 1] ?? "",
            x + colW[header.length - 1] / 2,
            headerH + rowH * (r + 1) + rowH / 2,
            colW[header.length - 1] - 8
          );
        }
        setTableImageUrl(canvas.toDataURL());
      })
      .finally(() => setLoading(false));
  }, [tab, showAfter2nd]);

  return {
    tab,
    setTab,
    showAfter2nd,
    setShowAfter2nd,
    loading,
    setLoading,
    tableImageUrl,
    setTableImageUrl,
  };
}
