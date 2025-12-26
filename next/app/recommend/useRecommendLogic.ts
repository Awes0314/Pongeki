import { useRef, useState, useEffect } from "react";
import { initializeLocalStorageSettings } from "@/utils/localStorage";

type SongRow = {
  musicName: string;
  difficulty: string;
  level: string;
  chartConst: string;
  ps5Rating: string;
  ps5TotalCount: string;
  ps4Count: string;
  ps4Rating: string;
  ps3Count: string;
  ps3Rating: string;
  techFlag: string;
  [key: string]: string;
};

function toHankaku(str: string) {
  return str.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
}

function escapeHtml(str: string) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getDiffColor(diff: string) {
  switch (diff) {
    case "Mas": return "#a259e6";
    case "Exp": return "#e0408a";
    case "Adv": return "#ff9800";
    case "Bas": return "#7ed957";
    case "Lun": return "#222";
    default: return "#293241";
  }
}

export const useRecommendLogic = () => {
  // 状態管理
  const [barSliderIdx, setBarSliderIdx] = useState(0);
  const [id, setId] = useState("");
  const [excludeTech, setExcludeTech] = useState("no");
  const [loading, setLoading] = useState(false);
  const [resultImg, setResultImg] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [ratingRange, setRatingRange] = useState<[number, number] | null>(null);
  const [tableHtml, setTableHtml] = useState("");
  const [recommendCount, setRecommendCount] = useState(30);
  const [resultImgs, setResultImgs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);
  const [outlierExclude, setOutlierExclude] = useState<"する" | "しない">("しない");
  const [showOutlierModal, setShowOutlierModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalRatings, setModalRatings] = useState<number[]>([]);
  const [modalError, setModalError] = useState("");
  const [isSp, setIsSp] = useState(false);

  // 初期表示時ログ
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

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
        action: 'visit recommend page',
        localStorage: localStorageData,
        userAgent: navigator.userAgent
      }),
    });
    if (typeof window === "undefined") return;
    const id = localStorage.getItem("recommend-id");
    if (id !== null) setId(id);
    const count = localStorage.getItem("recommend-count");
    if (count !== null && !isNaN(Number(count))) setRecommendCount(Number(count));
    const tech = localStorage.getItem("recommend-tech-exclude");
    if (tech === "yes" || tech === "no") setExcludeTech(tech);
  }, []);

  useEffect(() => {
    const check = () => setIsSp(window.innerWidth <= 480);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (showOutlierModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showOutlierModal]);

  // おすすめ楽曲数 入力ハンドラ
  function handleRecommendCountChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = toHankaku(e.target.value.replace(/[^0-9０-９]/g, ""));
    if (val === "") {
      setRecommendCount(0);
      return;
    }
    let num = parseInt(val, 10);
    if (isNaN(num)) num = 1;
    num = Math.max(1, Math.min(100, num));
    setRecommendCount(num);
  }

  function dataUrlToFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return new File([u8arr], filename, { type: mime });
  }

  // 外れ値除外モーダル表示ハンドラ
  async function handleOutlierExclude() {
    setShowOutlierModal(true);
    setModalLoading(true);
    setModalError("");
    setModalRatings([]);
    try {
      let inputId = toHankaku(id.trim());
      if (inputId.length === 0) inputId = "1";
      // CORS回避のためNext.js API経由で取得
      // app/api/scorelog/route.ts参照
      const res = await fetch(`/api/scorelog?id=${inputId}`);
      const { html } = await res.json();
      let pMusics: any[] = [];
      try {
        const articleMatch = html.match(/<article id="rating_platinum" class="box">([\s\S]*?)<\/table>/);
        if (articleMatch) {
          const tableHtml = articleMatch[1] + "</table>";
          const trRegex = /<tr>([\s\S]*?)<\/tr>/g;
          let match;
          while ((match = trRegex.exec(tableHtml)) !== null) {
            try {
              const trHtml = match[1];
              const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
              let tdMatch;
              let tds: string[] = [];
              while ((tdMatch = tdRegex.exec(trHtml)) !== null) {
                tds.push(tdMatch[1]);
              }
              if (tds.length >= 7) {
                let rating = "";
                const ratingSpanMatch = tds[6].match(/<span[^>]*[\s\S]*?>([\s\S]*?)<\/span>/);
                if (ratingSpanMatch) {
                  rating = ratingSpanMatch[1].replace(/<[^>]+>/g, "").trim();
                }
                if (rating && !isNaN(Number(rating))) {
                  pMusics.push(Number(rating));
                }
              }
            } catch (e) {}
          }
        }
      } catch (e) {
        pMusics = [];
      }
      if (!Array.isArray(pMusics) || pMusics.length === 0) {
        setModalError("Pスコア枠の取得に失敗しました。");
        setModalLoading(false);
        return;
      }
      setModalRatings(pMusics);
      setModalLoading(false);
    } catch (e) {
      setModalError("Pスコア枠の取得に失敗しました。");
      setModalLoading(false);
    }
  }

  function handleCloseModal() {
    setShowOutlierModal(false);
    setModalRatings([]);
    setModalError("");
    setModalLoading(false);
  }

  function handleModalFilter() {
    if (modalRatings.length === 0) return;
    const sortedRatings = [...modalRatings].sort((a, b) => a - b);
    const min = sortedRatings[0];
    const max = sortedRatings[barSliderIdx];

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
        action: 'execute recommend outlier filter',
        localStorage: localStorageData,
        userAgent: navigator.userAgent
      }),
    });

    setShowOutlierModal(false);
    setOutlierExclude("する");
    setRatingRange([min, max]);
  }

  async function handleRecommend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("recommend-id", id);
      localStorage.setItem("recommend-count", String(recommendCount));
      localStorage.setItem("recommend-tech-exclude", excludeTech);
    }

    setError("");
    setResultImg(null);
    setTableHtml("");
    setPlayerName("");
    setRatingRange(null);
    setResultImgs([]);
    setActiveTab(0);

    let inputId = toHankaku(id.trim());
    if (inputId.length === 0) {
      inputId = "1";
      setId("1");
      if (typeof window !== "undefined") {
        localStorage.setItem("recommend-id", "1");
      }
    }
    if (recommendCount == 0) {
      alert("おすすめ楽曲数は1～100の半角数字で入力してください");
      return;
    }
    if (!/^\d{1,5}$/.test(inputId)) {
      alert("OngekiScoreLog IDは半角数字0～5桁で入力してください");
      return;
    }
    setLoading(true);

    try {
      setTableHtml(`
        <div style="text-align:center;padding:32px 0;">
          <span style="display:inline-block;width:24px;height:24px;border:3px solid #bbb;border-top:3px solid #3d5a80;border-radius:50%;animation:spin 0.8s linear infinite;vertical-align:middle;"></span>
          <span style="margin-left:12px;">OngekiScoreLogから情報を取得中...</span>
        </div>
      `);
      const res = await fetch(`/api/scorelog?id=${inputId}`);
      const { html } = await res.json();
      let playerName = "";
      try {
        const asideMatch = html.match(/<aside[^>]*>([\s\S]*?)<\/aside>/);
        if (asideMatch) {
          const asideHtml = asideMatch[1];
          const h1Match = asideHtml.match(/<h1[^>]*class="title"[^>]*>(.*?)<\/h1>/);
          if (h1Match) {
            playerName = h1Match[1].replace(/<[^>]+>/g, "").trim();
          }
        }
      } catch (e) {
        playerName = "";
      }
      if (typeof window !== "undefined" && playerName) {
        localStorage.setItem("user-name", playerName);
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
          action: 'execute recommend table generation',
          localStorage: localStorageData,
          userAgent: navigator.userAgent
        }),
      });

      let pRating = "";
      try {
        const statMatch = html.match(/<article id="rating_statistics" class="box">([\s\S]*?)<\/article>/);
        if (statMatch) {
          const statHtml = statMatch[1];
          const tableMatch = statHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
          if (tableMatch) {
            const tableHtml = tableMatch[1];
            const trMatch = tableHtml.match(/<td>プラチナ([\s\S]*?)<\/tr>/);
            if (trMatch) {
              const trHtml = trMatch[1];
              const tdMatches = trHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/g);
              if (tdMatches && tdMatches.length >= 2) {
                pRating = tdMatches[0].replace(/<[^>]+>/g, "").trim();
              }
            }
          }
        }
      } catch (e) {
        pRating = "";
      }
      let pMusics: any[] = [];
      try {
        const articleMatch = html.match(/<article id="rating_platinum" class="box">([\s\S]*?)<\/table>/);
        if (articleMatch) {
          const tableHtml = articleMatch[1] + "</table>";
          const trRegex = /<tr>([\s\S]*?)<\/tr>/g;
          let match;
          let number = 1;
          while ((match = trRegex.exec(tableHtml)) !== null) {
            try {
              const trHtml = match[1];
              const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
              let tdMatch;
              let tds: string[] = [];
              while ((tdMatch = tdRegex.exec(trHtml)) !== null) {
                tds.push(tdMatch[1]);
              }
              if (tds.length >= 7) {
                let title = "";
                const aMatch = tds[1].match(/<a[^>]*>([\s\S]*?)<\/a>/);
                if (aMatch) {
                  title = aMatch[1].replace(/<[^>]+>/g, "").trim();
                }
                let diff = tds[2].replace(/<[^>]+>/g, "").trim().toLowerCase();
                if (diff === "bas") diff = "BASIC";
                else if (diff === "adv") diff = "ADVANCED";
                else if (diff === "exp") diff = "EXPERT";
                else if (diff === "mas") diff = "MASTER";
                else if (diff === "lun") diff = "LUNATIC";
                let lev = tds[3].replace(/<[^>]+>/g, "").trim();
                let rating = "";
                const ratingSpanMatch = tds[6].match(/<span[^>]*[\s\S]*?>([\s\S]*?)<\/span>/);
                if (ratingSpanMatch) {
                  rating = ratingSpanMatch[1].replace(/<[^>]+>/g, "").trim();
                }
                let star = null;
                const starText = tds[5].replace(/<[^>]+>/g, "").trim();
                if (starText !== "") {
                  star = parseInt(starText, 10);
                }
                pMusics.push({
                  number,
                  title,
                  diff,
                  lev,
                  star,
                  rating: rating ? parseFloat(rating) : null,
                });
                number++;
              }
            } catch (e) {}
          }
        }
      } catch (e) {
        pMusics = [];
      }
      if (!playerName || !pRating || !Array.isArray(pMusics) || pMusics.length === 0) {
        setError("情報の取得に失敗しました。IDが間違っている、またはOngekiScoreLogが未更新の可能性があります。\nお確かめの上、再度お試しください。");
        setLoading(false);
        setTableHtml("");
        return;
      }
      setPlayerName(playerName);
      setTableHtml(`
        <div style="text-align:center;padding:32px 0;">
          <span style="display:inline-block;width:24px;height:24px;border:3px solid #bbb;border-top:3px solid #3d5a80;border-radius:50%;animation:spin 0.8s linear infinite;vertical-align:middle;"></span>
          <span style="margin-left:12px;">おすすめ楽曲を選出中...</span>
        </div>
      `);
      let minRating: number;
      let maxRating: number;
      if (ratingRange) {
        minRating = ratingRange[0];
        maxRating = ratingRange[1];
      } else {
        const ratings = pMusics.map((r: any) => parseFloat(r.rating)).filter((r: any) => !isNaN(r));
        minRating = Math.min(...ratings);
        maxRating = Math.max(...ratings);
      }
      const dataRes = await fetch("/data/data.json");
      const data: SongRow[] = await dataRes.json();
      function getRecommendList(i: number) {
        const ratingKey = `ps_${i}_rating`;
        let filtered = data.filter((row) => {
          const val = parseFloat(row[ratingKey]);
          return !isNaN(val) && val >= minRating + 0.050 && val <= maxRating;
        });
        if (excludeTech === "yes") {
          filtered = filtered.filter((x) => !x.tech_flag || x.tech_flag === "0");
        }
        const pscoreIds = pMusics.filter((x: any) => x.star >= i).map((x: any) => `${x.title}|${x.diff}`);
        filtered = filtered.filter((row) => {
          return !pscoreIds.includes(`${row.title}|${row.diff}`);
        });
        filtered = filtered.filter((row) => !(row.title && row.title.includes("ソロver")));
        filtered.sort((a, b) => {
          const starA = parseInt(a.ps_5_total_count) || 0;
          const starB = parseInt(b.ps_5_total_count) || 0;
          if (starA !== starB) return starB - starA;
          const constA = parseFloat(a.chart_const) || 0;
          const constB = parseFloat(b.chart_const) || 0;
          return constB - constA;
        });
        return filtered.slice(0, recommendCount);
      }
      setTableHtml(`
        <div style="text-align:center;padding:32px 0;">
          <span style="display:inline-block;width:24px;height:24px;border:3px solid #bbb;border-top:3px solid #3d5a80;border-radius:50%;animation:spin 0.8s linear infinite;vertical-align:middle;"></span>
          <span style="margin-left:12px;">画像を生成中...</span>
        </div>
      `);
      setTimeout(async () => {
        const lists = [
          { title: "☆5おすすめ楽曲", data: getRecommendList(5), ratingKey: "ps_5_rating" },
          { title: "☆4おすすめ楽曲", data: getRecommendList(4), ratingKey: "ps_4_rating" },
          { title: "☆3おすすめ楽曲", data: getRecommendList(3), ratingKey: "ps_3_rating" },
        ];
        const imgs: string[] = [];
        for (let i = 0; i < lists.length; ++i) {
          const { title, data: finalList, ratingKey } = lists[i];
          // canvas生成
          const rowH = 28; // databaseと同じ
          const headerH = 120;
          const leftMargin = 18;
          const rightMargin = 18;
          // カラム幅割合: 1:6:2:2:1:2
          const colRatio = [1, 6, 2, 2, 1, 2];
          const totalRatio = colRatio.reduce((a, b) => a + b, 0);
          const tableW = 900;
          const colW = colRatio.map(r => Math.round((tableW - leftMargin - rightMargin) * r / totalRatio));
          const canvasW = tableW;
          const canvasH = headerH + rowH * finalList.length + 60;
          const canvas = document.createElement("canvas");
          canvas.width = canvasW;
          canvas.height = canvasH;
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          // 背景
          ctx.fillStyle = "#e0fbfc";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

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

          // タイトル（database画像と同じ位置・デザイン）
          ctx.font = "bold 28px 'Segoe UI',sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#3d5a80";
          ctx.fillText(title, leftMargin + (tableW - leftMargin - rightMargin) / 2, headerH / 2);

          // オプション表示（右上）
          ctx.save();
          ctx.font = "15px 'Segoe UI',sans-serif";
          ctx.textAlign = "right";
          ctx.fillStyle = "#293241";
          const optX = canvasW - 24;
          let optY = 26;
          ctx.fillText(new Date().toLocaleString("ja-JP", { hour12: false }), optX, optY);
          ctx.fillText("Player: " + playerName, optX, optY + 24);
          ctx.fillText("Rating: " + pRating, optX, optY + 48);
          ctx.fillText("Opt.: テクチャレ" + (excludeTech === "yes" ? "除外する" : "除外しない") + " / 選曲数 " + recommendCount, optX, optY + 72);
          ctx.restore();

          // ヘッダー
          const headers = ["#", "Title", "Diff", "Lev(Const)", "☆5Cnt", "Expected Rising"];
          let x = leftMargin;
          ctx.font = "bold 16px 'Segoe UI',sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          for (let c = 0; c < headers.length; ++c) {
            ctx.fillStyle = "#3d5a80";
            ctx.fillRect(x, headerH, colW[c], rowH);
            ctx.strokeStyle = "#98c1d9";
            ctx.strokeRect(x, headerH, colW[c], rowH);
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.font = "bold 16px 'Segoe UI',sans-serif";
            ctx.fillText(headers[c], x + colW[c] / 2, headerH + rowH / 2, colW[c] - 8);
            x += colW[c];
          }

          // 本体
          ctx.font = "15px 'Segoe UI',sans-serif";
          for (let r = 0; r < finalList.length; ++r) {
            let x = leftMargin;
            const item = finalList[r];

            // 順位
            ctx.fillStyle = "#fff";
            ctx.fillRect(x, headerH + rowH * (r + 1), colW[0], rowH);
            ctx.strokeStyle = "#98c1d9";
            ctx.strokeRect(x, headerH + rowH * (r + 1), colW[0], rowH);
            ctx.fillStyle = "#293241";
            ctx.textAlign = "center";
            ctx.fillText(String(r + 1), x + colW[0] / 2, headerH + rowH * (r + 1) + rowH / 2, colW[0] - 8);
            x += colW[0];

            // Title（色分け）
            let bgColor = "#fff";
            switch (item.diff) {
              case "MASTER": bgColor = "#f3e6fa"; break;
              case "EXPERT": bgColor = "#fde6f3"; break;
              case "ADVANCED": bgColor = "#fff2e0"; break;
              case "BASIC": bgColor = "#e6fae6"; break;
              case "LUNATIC": bgColor = "#f3f3f3"; break;
            }
            ctx.fillStyle = bgColor;
            ctx.fillRect(x, headerH + rowH * (r + 1), colW[1], rowH);
            ctx.strokeStyle = "#98c1d9";
            ctx.strokeRect(x, headerH + rowH * (r + 1), colW[1], rowH);
            ctx.fillStyle = "#293241";
            ctx.textAlign = "left";
            ctx.font = "bold 15px 'Segoe UI',sans-serif";
            ctx.fillText(item.title ?? "", x + 12, headerH + rowH * (r + 1) + rowH / 2, colW[1] - 24);
            x += colW[1];

            // Diff（色分け）
            let diffColor = "#293241";
            switch (item.diff) {
              case "MASTER": diffColor = "#a259e6"; break;
              case "EXPERT": diffColor = "#e0408a"; break;
              case "ADVANCED": diffColor = "#ff9800"; break;
              case "BASIC": diffColor = "#7ed957"; break;
              case "LUNATIC": diffColor = "#222"; break;
            }
            ctx.fillStyle = "#fff";
            ctx.fillRect(x, headerH + rowH * (r + 1), colW[2], rowH);
            ctx.strokeStyle = "#98c1d9";
            ctx.strokeRect(x, headerH + rowH * (r + 1), colW[2], rowH);
            ctx.fillStyle = diffColor;
            ctx.textAlign = "center";
            ctx.font = "bold 15px 'Segoe UI',sans-serif";
            ctx.fillText(item.diff ?? "", x + colW[2] / 2, headerH + rowH * (r + 1) + rowH / 2, colW[2] - 8);
            x += colW[2];

            // Lev(Const)
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
            ctx.fillText(
              `${item.level ?? ""}${chartConstDisp ? ` (${chartConstDisp})` : ""}`,
              x + colW[3] / 2,
              headerH + rowH * (r + 1) + rowH / 2,
              colW[3] - 8
            );
            x += colW[3];

            // ☆5Count
            ctx.fillStyle = "#fff";
            ctx.fillRect(x, headerH + rowH * (r + 1), colW[4], rowH);
            ctx.strokeStyle = "#98c1d9";
            ctx.strokeRect(x, headerH + rowH * (r + 1), colW[4], rowH);
            ctx.fillStyle = "#293241";
            ctx.textAlign = "center";
            ctx.font = "bold 15px 'Segoe UI',sans-serif";
            ctx.fillText(item.ps_5_total_count ?? "", x + colW[4] / 2, headerH + rowH * (r + 1) + rowH / 2, colW[4] - 8);
            x += colW[4];

            // Expected Rising（ps{i}Rating使用）
            ctx.fillStyle = "#fff";
            ctx.fillRect(x, headerH + rowH * (r + 1), colW[5], rowH);
            ctx.strokeStyle = "#98c1d9";
            ctx.strokeRect(x, headerH + rowH * (r + 1), colW[5], rowH);
            ctx.fillStyle = "#293241";
            ctx.textAlign = "center";
            let rising = "+0.000";
            if (item[ratingKey] && !isNaN(Number(item[ratingKey]))) {
              const val = Math.round(((Number(item[ratingKey]) - minRating) / 50) * 10000) / 10000;
              rising = "+" + val.toFixed(3);
            }
            ctx.fillText(rising, x + colW[5] / 2, headerH + rowH * (r + 1) + rowH / 2, colW[5] - 8);
          }
          imgs.push(canvas.toDataURL("image/png"));
        }
        setResultImgs(imgs);
        setTableHtml("");
        setLoading(false);
      });
    } catch (e) {
      setError("情報の取得に失敗しました。");
      setLoading(false);
      setTableHtml("");
    }
  }

  function handleSave() {
    if (!resultImgs[activeTab]) return;
    
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
        action: 'save recommend image',
        localStorage: localStorageData,
        userAgent: navigator.userAgent
      }),
    });

    try {
      const file = dataUrlToFile(resultImgs[activeTab], "ongeki_recommend.png");
      const canUseShare = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
      if (canUseShare && typeof navigator.share === "function") {
        navigator.share({ files: [file], title: "おすすめ楽曲表", text: "オンゲキおすすめ楽曲表" }).catch(() => {});
      } else {
        const a = document.createElement("a");
        a.href = resultImgs[activeTab];
        a.download = "ongeki_recommend.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {}
  }

  return {
    barSliderIdx, setBarSliderIdx,
    id, setId,
    excludeTech, setExcludeTech,
    loading, setLoading,
    resultImg, setResultImg,
    error, setError,
    playerName, setPlayerName,
    ratingRange, setRatingRange,
    tableHtml, setTableHtml,
    recommendCount, setRecommendCount,
    resultImgs, setResultImgs,
    activeTab, setActiveTab,
    tableRef,
    outlierExclude, setOutlierExclude,
    showOutlierModal, setShowOutlierModal,
    modalLoading, setModalLoading,
    modalRatings, setModalRatings,
    modalError, setModalError,
    isSp,
    handleRecommendCountChange,
    handleOutlierExclude,
    handleCloseModal,
    handleModalFilter,
    handleRecommend,
    handleSave,
    toHankaku,
    escapeHtml,
    getDiffColor,
  };
}