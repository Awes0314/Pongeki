"use client";

import { initializeLocalStorageSettings } from "@/utils/localStorage";
import React, { useEffect, useRef, useState } from "react";
import { spaces as spaceData } from "./space";
import { aisles } from "./aisle";

export const useMapLogic = () => {
  const HEX_SIZE = 30; // 六角形の一辺の長さ
  const HEX_COLOR = "#f3f03dff"; // 六角形の塗りつぶし色
  const HEX_ACTIVE_COLOR = "#666666ff"; // 六角形のアクティブ時の塗りつぶし色
  const TEXT_COLOR = "#293241"; // テキストの色
  const BORDER_COLOR = "#5f3213ff"; // ボーダーの色
  const ACTIVE_BORDER_COLOR = "#666666ff"; // アクティブ時のボーダーの色
  const COST_COLOR = "#0059ffff"; // コストの色
  const COST_BORDER_COLOR = "#d8e5ffff"; // コストのボーダーの色
  const COST_ACTIVE_COLOR = "#666666ff"; // コストのアクティブ時の色
  const NAME_COLOR = "#000"; // 名前の色
  const NAME_BORDER_COLOR = "#fff"; // 名前のボーダーの色

  interface Reward {
    type: string;
    name?: string;
    color?: string;
  }

  interface Space {
    id: number;
    x: number;
    y: number;
    cost?: number;
    reward: Reward;
  }

  // マス情報からマップサイズを計算
  function getMapSize(spaces: Space[]) {
    if (spaces.length === 0) return { width: 100, height: 100 };
    // 最大値・最小値と六角形の辺長から、長方形のサイズを返す
    const maxX = Math.max(...spaces.map((s) => s.x));
    const maxY = Math.max(...spaces.map((s) => s.y));
    const minX = Math.min(...spaces.map((s) => s.x));
    const minY = Math.min(...spaces.map((s) => s.y));
    const width = maxX - minX + HEX_SIZE * 2 + 150;
    const height = maxY - minY + HEX_SIZE * 2 + 150;
    return { width, height };
  }

  // SVG画像パス一覧
  const iconPaths: { [key: string]: string } = {
    music:       "./images/icon_music.svg",
    card:        "./images/icon_exclamation.svg",
    story:       "./images/icon_exclamation.svg",
    plate:       "./images/icon_exclamation.svg",
    key_blue:    "./images/icon_key_blue.svg",
    key_pink:    "./images/icon_key_pink.svg",
    key_yellow:  "./images/icon_key_yellow.svg",
    door_blue:   "./images/icon_door_blue.svg",
    door_pink:   "./images/icon_door_pink.svg",
    door_yellow: "./images/icon_door_yellow.svg",
    drop:        "./images/icon_other.svg",
    other:       "./images/icon_other.svg",
  };

  // typeとcolorからアイコンパスを取得する関数
  function getIconPath(type: string, color?: string) {
    if (type === "key" || type === "door") {
      if (color === "blue" || color === "pink" || color === "yellow") {
        return iconPaths[`${type}_${color}`];
      }
    }
    return iconPaths[type] || iconPaths.other;
  }

  // 六角形マスを描画
  function drawHexagon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    active: boolean,
    reward: Reward,
    iconCache: { [key: string]: HTMLImageElement },
    scale: number,
    optionVisible: boolean,
    cost?: number
  ) {
    ctx.save();
    ctx.translate(x, y);
    // 六角形描画
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i;
      const px = HEX_SIZE * Math.cos(angle);
      const py = HEX_SIZE * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    // showIconが非表示の時は薄い黄色
    const showIcon = !active && reward?.type && reward.type !== "none" && optionVisible;
    ctx.fillStyle = active
      ? HEX_ACTIVE_COLOR
      : showIcon
        ? HEX_COLOR
        : "#fffbdaff"; // showIconが非表示の時は薄い黄色
    ctx.strokeStyle = active ? ACTIVE_BORDER_COLOR : BORDER_COLOR;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // SVG画像表示（type: none以外）
    // active時は非表示
    // HEX_SIZE*scale>=20時は半透明+name表示
    const showName = !active && scale * HEX_SIZE >= 20 && optionVisible;
    const showCost = !active;
    if (showIcon) {
      const iconPath = getIconPath(reward.type, reward.color);
      const img = iconCache[iconPath];
      if (img && img.complete) {
        ctx.save();
        ctx.globalAlpha = showName ? 0.3 : 1;
        ctx.drawImage(img, -18, -18, 36, 36);
        ctx.restore();
      }
    }
    // HEX_SIZE*scale>=100時はnameを中央に表示
    if (showName) {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = NAME_COLOR;
      ctx.fillText(reward?.name ?? "", 0, 6);
      ctx.lineWidth = 0.3;
      ctx.strokeStyle = NAME_BORDER_COLOR;
      ctx.strokeText(reward?.name ?? "", 0, 6);
    }
    // コスト（右下、太字、縁取り有、はみ出す位置）
    if (showCost && cost !== undefined && cost !== null) {
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = COST_COLOR;
      ctx.fillText(`${cost}`, HEX_SIZE * 1, HEX_SIZE * 1.1);
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = COST_BORDER_COLOR;
      ctx.strokeText(`${cost}`, HEX_SIZE * 1, HEX_SIZE * 1.1);
    }
    ctx.restore();
  }

  // 点が六角形内にあるか判定
  function isPointInHexagon(
    cx: number,
    cy: number,
    px: number,
    py: number,
    size: number
  ) {
    const dx = Math.abs(px - cx);
    const dy = Math.abs(py - cy);
    if ((dx * dx + dy * dy) > (size * size)) return false;
    return true;
  }

  // マウス座標から六角形マスを取得
  const getHexAt = (spaces: Space[], mx: number, my: number) => {
    for (let i = 0; i < spaces.length; i++) {
      const { x, y } = spaces[i];
      if (isPointInHexagon(x, y, mx, my, HEX_SIZE))
        return i;
    }
    return -1;
  };

  // キャンバスサイズは画面サイズに応じて決定
  const MAX_CANVAS_WIDTH = 600; // PC等の最大幅
  const MAX_CANVAS_HEIGHT = 800; // PC等の最大高さ
  // fillRect領域の範囲（描画領域）
  const DRAW_LEFT = -50;
  const DRAW_TOP = -50;
  // DRAW_WIDTH, DRAW_HEIGHTはuseEffect内で定義

  // オプション項目
  const OPTION_ITEMS = [
    { key: "music", label: "曲" },
    { key: "card", label: "カード" },
    { key: "story", label: "ストーリー" },
    { key: "keydoor", label: "鍵・扉" },
    { key: "plate", label: "プレート" },
    { key: "drop", label: "しずく" },
    { key: "other", label: "その他" },
  ];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [active, setActive] = useState<{ [id: number]: boolean }>(getInitialActive());
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [scale, setScale] = useState(getInitialScale());
  const [offset, setOffset] = useState(getInitialOffset());
  const [mapSize, setMapSize] = useState({ width: 100, height: 100 });
  const [canvasWidth, setCanvasWidth] = useState(370);
  const [canvasHeight, setCanvasHeight] = useState(600);

  // LocalStorage初期化
  useEffect(() => {
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
        action: 'visit map page',
        localStorage: localStorageData,
        userAgent: navigator.userAgent
      }),
    });
  }, []);

  // LocalStorage初期値取得
  function getInitialActive() {
    if (typeof window === "undefined" || !window.localStorage) return {};
    const arr = JSON.parse(localStorage.getItem("map-actives") || "[]");
    const obj: { [id: number]: boolean } = {};
    arr.forEach((id: number) => { obj[id] = true; });
    return obj;
  }
  function getInitialOptions() {
    if (typeof window === "undefined" || !window.localStorage) return OPTION_ITEMS.map(item => item.key);
    return JSON.parse(localStorage.getItem("map-options") || JSON.stringify(OPTION_ITEMS.map(item => item.key)));
  }
  function getInitialScale() {
    if (typeof window === "undefined" || !window.localStorage) return 0.67;
    return Number(localStorage.getItem("map-scale") || 0.67);
  }
  function getInitialOffset() {
    if (typeof window === "undefined" || !window.localStorage) return { x: -954, y: -987 };
    const arr = JSON.parse(localStorage.getItem("map-offsets") || "[-954, -987]");
    return { x: arr[0], y: arr[1] };
  }
  useEffect(() => {
    const stored = localStorage.getItem("map-options");
    if (stored) {
      setSelectedOptions(JSON.parse(stored));
    } else {
      setSelectedOptions(OPTION_ITEMS.map(item => item.key));
    }
  }, []);

  const handleClickOption = (key: string) => {
    setSelectedOptions((prev) => {
      const newOptions = prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key];
      localStorage.setItem("map-options", JSON.stringify(newOptions));
      return newOptions;
    });
  };

  // 画面サイズに応じてcanvasサイズを更新
  useEffect(() => {
    function updateCanvasSize() {
      const w = Math.min(window.innerWidth * 0.9, MAX_CANVAS_WIDTH);
      const h = Math.min(window.innerHeight * 0.7, MAX_CANVAS_HEIGHT);
      setCanvasWidth(Math.floor(w));
      setCanvasHeight(Math.floor(h));
    }
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);
  const [iconCache, setIconCache] = useState<{ [key: string]: HTMLImageElement }>({});
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDist = useRef<number | null>(null);
  const lastPinchMid = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const fingerIds = useRef<number[] | null>(null);

  // 画像プリロード（クライアントのみ）
  useEffect(() => {
    const cache: { [key: string]: HTMLImageElement } = {};
    Object.values(iconPaths).forEach((path) => {
      const img = new window.Image();
      img.src = path;
      cache[path] = img;
    });
    setIconCache(cache);
  }, []);

  useEffect(() => {
    // cost: null を undefined に変換
    const fixedSpaces = (spaceData as any[]).map(s => ({ ...s, cost: s.cost === null ? undefined : s.cost }));
    setSpaces(fixedSpaces);
    setMapSize(getMapSize(fixedSpaces));
    // LocalStorage初期化
    if (typeof window !== "undefined" && window.localStorage) {
      if (!localStorage.getItem("map-id")) localStorage.setItem("map-id", "1");
      if (!localStorage.getItem("map-options")) localStorage.setItem("map-options", JSON.stringify(OPTION_ITEMS.map(item => item.key)));
      if (!localStorage.getItem("map-actives")) localStorage.setItem("map-actives", "[]");
      if (!localStorage.getItem("map-scale")) localStorage.setItem("map-scale", "1");
      if (!localStorage.getItem("map-offsets")) localStorage.setItem("map-offsets", "[0,0]");
    }
  }, []);

  // typeごとに表示可否判定
  function isOptionVisible(type: string) {
    if (selectedOptions.includes("music") && type === "music") return true;
    if (selectedOptions.includes("card") && type === "card") return true;
    if (selectedOptions.includes("story") && type === "story") return true;
    if (selectedOptions.includes("plate") && type === "plate") return true;
    if (selectedOptions.includes("drop") && type === "drop") return true;
    if (selectedOptions.includes("other") && type === "other") return true;
    if (selectedOptions.includes("keydoor") && (type === "key" || type === "door")) return true;
    return false;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || spaces.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ecf8ffff";
    ctx.fillRect(-50, -50, mapSize.width + 100, mapSize.height + 100);

    // --- 背面に線を描画 ---
    ctx.save();
    ctx.strokeStyle = "#999999ff";
    ctx.lineWidth = 3;
    aisles.forEach(({ from, to }) => {
      const fromSpace = spaces.find(s => s.id === from);
      const toSpace = spaces.find(s => s.id === to);
      if (fromSpace && toSpace) {
        ctx.beginPath();
        ctx.moveTo(fromSpace.x, fromSpace.y);
        ctx.lineTo(toSpace.x, toSpace.y);
        ctx.stroke();
      }
    });
    ctx.restore();

    // --- マス描画 ---
    spaces.forEach((s) => {
      drawHexagon(
        ctx,
        s.x,
        s.y,
        !!active[s.id],
  s.reward,
  iconCache,
  scale,
  isOptionVisible(s.reward.type),
  s.cost
      );
    });
    ctx.restore();
  }, [spaces, active, offset, scale, selectedOptions]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // キャンバス上のマウス座標を取得
    const rect = canvas.getBoundingClientRect();
    // マウス座標（キャンバス内のピクセル座標）
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // 逆変換して「論理座標」に戻す
    const lx = (mx - offset.x) / scale;
    const ly = (my - offset.y) / scale;

    // 論理座標で判定
    const idx = getHexAt(spaces, lx, ly);
    if (idx !== -1) {
      const id = spaces[idx].id;
      setActive((prev) => {
        const newActive = { ...prev, [id]: !prev[id] };
        // activeなid配列をLocalStorageへ
        const arr = Object.keys(newActive).filter(k => newActive[Number(k)]).map(Number);
        localStorage.setItem("map-actives", JSON.stringify(arr));
        return newActive;
      });
    }
  };


  // ドラッグ/スワイプで移動
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging.current && lastPointer.current) {
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      setOffset((prev) => {
        const DRAW_WIDTH = mapSize.width + 100;
        const DRAW_HEIGHT = mapSize.height + 100;
        const minX = -DRAW_LEFT * scale;
        const minY = -DRAW_TOP * scale;
  const maxX = canvasWidth - (DRAW_LEFT + DRAW_WIDTH) * scale;
  const maxY = canvasHeight - (DRAW_TOP + DRAW_HEIGHT) * scale;
        let newX = prev.x + dx;
        let newY = prev.y + dy;
        newX = Math.min(minX, Math.max(maxX, newX));
        newY = Math.min(minY, Math.max(maxY, newY));
        return { x: newX, y: newY };
      });
      lastPointer.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    lastPointer.current = null;
    // ドラッグ終了時にoffset保存
    localStorage.setItem("map-offsets", JSON.stringify([offset.x, offset.y]));
  };

  const scaleRef = useRef(scale);
const offsetRef = useRef(offset);

useEffect(() => {
  scaleRef.current = scale;
}, [scale]);

useEffect(() => {
  offsetRef.current = offset;
}, [offset]);
  // ピンチで拡大縮小（中点基準で補正）
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  // Declare pinch zoom state variables
  let startDist: number | null = null;
  let startMid: { x: number; y: number } | null = null;
  let startScale: number | null = null;
  let startOffset: { x: number; y: number } | null = null; // ← 追加

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 2) {
      const [t1, t2] = e.touches;
      startDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      startMid = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
      startScale = scaleRef.current;
      startOffset = { ...offsetRef.current }; // ← 初期offsetを保存
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (e.touches.length === 2 && startDist && startMid && startScale !== null && startOffset) {
      const [t1, t2] = e.touches;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / startDist;
      const newScale = Math.max(0.101, Math.min(3, startScale * ratio));
      // startMidを基準に補正（初期offsetを使用）
      const canvasRect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
      const baseX = (startMid.x - canvasRect.left - startOffset.x) / startScale;
      const baseY = (startMid.y - canvasRect.top - startOffset.y) / startScale;

      // 限界値計算
      const DRAW_WIDTH = mapSize.width + 100;
      const DRAW_HEIGHT = mapSize.height + 100;
      let newOffsetX = startMid.x - canvasRect.left - baseX * newScale;
      let newOffsetY = startMid.y - canvasRect.top - baseY * newScale;
      const minX = -DRAW_LEFT * newScale;
      const minY = -DRAW_TOP * newScale;
  const maxX = canvasWidth - (DRAW_LEFT + DRAW_WIDTH) * newScale;
  const maxY = canvasHeight - (DRAW_TOP + DRAW_HEIGHT) * newScale;
      newOffsetX = Math.min(minX, Math.max(maxX, newOffsetX));
      newOffsetY = Math.min(minY, Math.max(maxY, newOffsetY));
      
      setScale(newScale);
      setOffset({ x: newOffsetX, y: newOffsetY });
    }
  }

  function onTouchEnd(e: TouchEvent) {
    if (e.touches.length < 2) {
      startDist = null;
      startMid = null;
      startScale = null;
      startOffset = null; // ← リセット
      // ピンチ終了時にscale/offset保存
      localStorage.setItem("map-scale", String(scaleRef.current));
      localStorage.setItem("map-offsets", JSON.stringify([offsetRef.current.x, offsetRef.current.y]));
    }
  }

  canvas.addEventListener("touchstart", onTouchStart);
  canvas.addEventListener("touchmove", onTouchMove);
  canvas.addEventListener("touchend", onTouchEnd);
  
  return () => {
    canvas.removeEventListener("touchstart", onTouchStart);
    canvas.removeEventListener("touchmove", onTouchMove);
    canvas.removeEventListener("touchend", onTouchEnd);
  };
}, [mapSize.width, mapSize.height]);

  // ホイールで拡大縮小（中心基準）
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    // PC環境のみページスクロール抑制
    const isPC = !('ontouchstart' in window) && navigator.userAgent.match(/Windows|Macintosh|Linux/);
    if (isPC) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setScale((prevScale) => {
      const delta = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.max(0.173, Math.min(3, prevScale * delta));
      setOffset((prevOffset) => {
        const DRAW_WIDTH = mapSize.width + 100;
        const DRAW_HEIGHT = mapSize.height + 100;
        const baseX = (mouseX - prevOffset.x) / prevScale;
        const baseY = (mouseY - prevOffset.y) / prevScale;
        let newOffsetX = mouseX - baseX * newScale;
        let newOffsetY = mouseY - baseY * newScale;
        const minX = -DRAW_LEFT * newScale;
        const minY = -DRAW_TOP * newScale;
        const maxX = canvasWidth - (DRAW_LEFT + DRAW_WIDTH) * newScale;
        const maxY = canvasHeight - (DRAW_TOP + DRAW_HEIGHT) * newScale;
        newOffsetX = Math.min(minX, Math.max(maxX, newOffsetX));
        newOffsetY = Math.min(minY, Math.max(maxY, newOffsetY));
        // ホイール終了時にscale/offset保存
        localStorage.setItem("map-scale", String(newScale));
        localStorage.setItem("map-offsets", JSON.stringify([newOffsetX, newOffsetY]));
        return { x: newOffsetX, y: newOffsetY };
      });
      return newScale;
    });
  };

  return {
    canvasRef,
    canvasWidth,
    canvasHeight,
    OPTION_ITEMS,
    BORDER_COLOR,
    selectedOptions,
    setSelectedOptions,
    handleClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleClickOption,
  };
}

