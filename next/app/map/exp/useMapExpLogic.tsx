"use client";

import { initializeLocalStorageSettings } from "@/utils/localStorage";
import React, { useEffect, useRef, useState } from "react";

interface Space {
  id: number;
  x: number;
  y: number;
  cost: number;
  reward_type: string;
  reward_name: string | null;
  reward_color: string | null;
}

interface Aisle {
  id: number;
  from_space_id: number;
  to_space_id: number;
}

export const useMapExpLogic = () => {
  const HEX_SIZE = 30;
  const BORDER_COLOR = "#5f3213ff";
  
  const OPTION_ITEMS = [
    { key: "music", label: "曲" },
    { key: "card", label: "カード" },
    { key: "story", label: "ストーリー" },
    { key: "keydoor", label: "鍵・扉" },
    { key: "plate", label: "プレート" },
    { key: "drop", label: "しずく" },
    { key: "other", label: "その他" },
  ];

  const MAX_CANVAS_WIDTH = 600;
  const MAX_CANVAS_HEIGHT = 800;

  const svgRef = useRef<SVGSVGElement>(null);
  const cameraRef = useRef<SVGGElement>(null);
  
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [aisles, setAisles] = useState<Aisle[]>([]);
  const [active, setActive] = useState<{ [id: number]: boolean }>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [scale, setScale] = useState(0.67);
  const [offset, setOffset] = useState({ x: -954, y: -987 });
  const [mapSize, setMapSize] = useState({ width: 100, height: 100 });
  const [canvasWidth, setCanvasWidth] = useState(370);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [cursorSpaceId, setCursorSpaceId] = useState<number | null>(null);
  const [selectableSpaces, setSelectableSpaces] = useState<number[]>([]);
  const [tooltipInfo, setTooltipInfo] = useState<{ cost: number; name?: string; totalCost?: number } | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<number[]>([]);

  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeLocalStorageSettings();
    
    const storedActive = JSON.parse(localStorage.getItem("map-actives") || "[]");
    const activeObj: { [id: number]: boolean } = {};
    storedActive.forEach((id: number) => { activeObj[id] = true; });
    setActive(activeObj);
    
    const storedOptions = JSON.parse(localStorage.getItem("map-options") || JSON.stringify(OPTION_ITEMS.map(item => item.key)));
    setSelectedOptions(storedOptions);
    
    const storedScale = Number(localStorage.getItem("map-scale") || 0.67);
    setScale(storedScale);
    
    const storedOffset = JSON.parse(localStorage.getItem("map-offsets") || "[-954, -987]");
    setOffset({ x: storedOffset[0], y: storedOffset[1] });
    
    const storedCursor = Number(localStorage.getItem("map-cursor") || "0");
    if (storedCursor > 0) setCursorSpaceId(storedCursor);
    
    // ログ送信
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
        action: 'visit map exp page',
        localStorage: localStorageData,
        userAgent: navigator.userAgent
      }),
    });
    
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log("Supabase URL:", supabaseUrl);
      console.log("Supabase Key exists:", !!supabaseKey);
      
      if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase環境変数が設定されていません - フォールバックデータを使用します");
        loadFallbackData();
        return;
      }

      console.log("Fetching SPACE data...");
      const spaceRes = await fetch(`${supabaseUrl}/rest/v1/SPACE?select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      console.log("SPACE response status:", spaceRes.status);
      
      if (!spaceRes.ok) {
        console.error("SPACE fetch failed, using fallback data");
        loadFallbackData();
        return;
      }
      
      const spaceData: Space[] = await spaceRes.json();
      console.log("SPACE data count:", spaceData.length);
      console.log("SPACE data sample:", spaceData.slice(0, 3));
      
      if (spaceData.length === 0) {
        console.warn("No space data received, using fallback data");
        loadFallbackData();
        return;
      }
      
      setSpaces(spaceData);
      
      console.log("Fetching AISLE data...");
      const aisleRes = await fetch(`${supabaseUrl}/rest/v1/AISLE?select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      console.log("AISLE response status:", aisleRes.status);
      const aisleData: Aisle[] = await aisleRes.json();
      console.log("AISLE data count:", aisleData.length);
      console.log("AISLE data sample:", aisleData.slice(0, 3));
      setAisles(aisleData);
      
      if (spaceData.length > 0) {
        const maxX = Math.max(...spaceData.map(s => s.x));
        const maxY = Math.max(...spaceData.map(s => s.y));
        const minX = Math.min(...spaceData.map(s => s.x));
        const minY = Math.min(...spaceData.map(s => s.y));
        const calculatedSize = {
          width: maxX - minX + HEX_SIZE * 2 + 150,
          height: maxY - minY + HEX_SIZE * 2 + 150
        };
        console.log("Map size calculated:", calculatedSize);
        setMapSize(calculatedSize);
      }
    } catch (error) {
      console.error("マップデータの取得に失敗しました:", error);
      console.log("Using fallback data");
      loadFallbackData();
    }
  };

  const loadFallbackData = async () => {
    try {
      // 既存のspace.jsとaisle.jsからデータを取得
      const spaceModule = await import('../space');
      const aisleModule = await import('../aisle');
      
      // space.jsのデータをSpace型に変換
      const convertedSpaces: Space[] = spaceModule.spaces.map((s: any) => ({
        id: s.id,
        x: s.x,
        y: s.y,
        cost: s.cost === null ? 0 : s.cost,
        reward_type: s.reward?.type || 'none',
        reward_name: s.reward?.name || null,
        reward_color: s.reward?.color || null
      }));
      
      // aisle.jsのデータをAisle型に変換
      const convertedAisles: Aisle[] = aisleModule.aisles.map((a: any, index: number) => ({
        id: index + 1,
        from_space_id: a.from,
        to_space_id: a.to
      }));
      
      console.log("Fallback data loaded - spaces:", convertedSpaces.length, "aisles:", convertedAisles.length);
      
      setSpaces(convertedSpaces);
      setAisles(convertedAisles);
      
      if (convertedSpaces.length > 0) {
        const maxX = Math.max(...convertedSpaces.map(s => s.x));
        const maxY = Math.max(...convertedSpaces.map(s => s.y));
        const minX = Math.min(...convertedSpaces.map(s => s.x));
        const minY = Math.min(...convertedSpaces.map(s => s.y));
        setMapSize({
          width: maxX - minX + HEX_SIZE * 2 + 150,
          height: maxY - minY + HEX_SIZE * 2 + 150
        });
      }
    } catch (error) {
      console.error("フォールバックデータの読み込みに失敗しました:", error);
    }
  };

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

  useEffect(() => {
    if (!isKioskMode) return;
    
    const selectable: number[] = [];
    const activeIds = Object.keys(active).filter(k => active[Number(k)]).map(Number);
    
    if (activeIds.length === 0) {
      const startSpace = spaces.find(s => s.id === 1);
      if (startSpace) {
        setActive({ 1: true });
        localStorage.setItem("map-actives", JSON.stringify([1]));
        return;
      }
    }
    
    spaces.forEach(space => {
      if (active[space.id]) return;
      
      const hasActiveNeighbor = aisles.some(aisle => {
        return (aisle.from_space_id === space.id && activeIds.includes(aisle.to_space_id)) ||
               (aisle.to_space_id === space.id && activeIds.includes(aisle.from_space_id));
      });
      
      if (hasActiveNeighbor) {
        selectable.push(space.id);
      }
    });
    
    setSelectableSpaces(selectable);
    
    if (selectable.length > 0 && (!cursorSpaceId || !selectable.includes(cursorSpaceId))) {
      setCursorSpaceId(selectable[0]);
      localStorage.setItem("map-cursor", String(selectable[0]));
    }
  }, [active, isKioskMode, spaces, aisles, cursorSpaceId]);

  const handleClickOption = (key: string) => {
    setSelectedOptions((prev) => {
      const newOptions = prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key];
      localStorage.setItem("map-options", JSON.stringify(newOptions));
      return newOptions;
    });
  };

  // 選択可能マスから目的地までの最短経路を計算（ダイクストラ法）
  const findPathFromSelectableSpaces = (targetId: number, startIds: number[]): { cost: number; path: number[] } | null => {
    const distances: { [id: number]: number } = {};
    const previous: { [id: number]: number | null } = {};
    const unvisited = new Set<number>();
    
    spaces.forEach(space => {
      distances[space.id] = Infinity;
      previous[space.id] = null;
      unvisited.add(space.id);
    });
    
    // 開始地点（選択可能マス）を0コストで設定
    startIds.forEach(id => {
      distances[id] = 0;
    });
    
    while (unvisited.size > 0) {
      let minDist = Infinity;
      let current: number | null = null;
      unvisited.forEach(id => {
        if (distances[id] < minDist) {
          minDist = distances[id];
          current = id;
        }
      });
      
      if (current === null || minDist === Infinity) break;
      if (current === targetId) break;
      
      unvisited.delete(current);
      
      aisles.forEach(aisle => {
        let neighbor: number | null = null;
        if (aisle.from_space_id === current) neighbor = aisle.to_space_id;
        if (aisle.to_space_id === current) neighbor = aisle.from_space_id;
        
        if (neighbor && unvisited.has(neighbor)) {
          const neighborSpace = spaces.find(s => s.id === neighbor);
          if (!neighborSpace) return;
          
          // 開始地点以外のコストを加算
          const costToAdd = startIds.includes(current!) ? neighborSpace.cost : neighborSpace.cost;
          const alt = distances[current!] + costToAdd;
          
          if (alt < distances[neighbor]) {
            distances[neighbor] = alt;
            previous[neighbor] = current;
          }
        }
      });
    }
    
    if (distances[targetId] === Infinity) return null;
    
    // パスを再構築（開始地点も含める）
    const path: number[] = [];
    let current: number | null = targetId;
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }
    
    // 開始地点が含まれているか確認し、含まれていなければ追加
    const startInPath = startIds.find(id => path.includes(id));
    if (startInPath && !path.includes(startInPath)) {
      path.unshift(startInPath);
    }
    
    return { cost: distances[targetId], path };
  };

  // 経路内の扉をチェックして、必要な鍵の経路を再帰的に計算
  const findShortestPathWithKeys = (
    targetId: number,
    selectableIds: number[],
    activeIds: number[],
    visitedKeys: Set<number> = new Set()
  ): { cost: number; paths: number[][]; totalCost: number } | null => {
    // 選択可能マスから目的地までの最短経路を計算
    const mainPath = findPathFromSelectableSpaces(targetId, selectableIds);
    if (!mainPath) return null;
    
    const allPaths: number[][] = [mainPath.path];
    let totalCost = mainPath.cost;
    
    // 経路内の扉をチェック
    const doorsInPath = mainPath.path.filter(id => {
      const space = spaces.find(s => s.id === id);
      return space && space.reward_type === "door";
    });
    
    // 各扉について、対応する鍵が必要か確認
    for (const doorId of doorsInPath) {
      const doorSpace = spaces.find(s => s.id === doorId);
      if (!doorSpace || !doorSpace.reward_color) continue;
      
      // 対応する鍵が踏破済みか確認
      const keyAlreadyActive = activeIds.some(id => {
        const space = spaces.find(s => s.id === id);
        return space && space.reward_type === "key" && space.reward_color === doorSpace.reward_color;
      });
      
      if (keyAlreadyActive) continue; // 鍵は既に持っている
      
      // 未踏破の鍵を探す
      const keySpace = spaces.find(s => 
        s.reward_type === "key" && 
        s.reward_color === doorSpace.reward_color &&
        !activeIds.includes(s.id)
      );
      
      if (!keySpace) continue; // 鍵が見つからない（エラー状態）
      
      // 循環参照を防ぐ
      if (visitedKeys.has(keySpace.id)) continue;
      visitedKeys.add(keySpace.id);
      
      // 鍵までの経路を再帰的に計算
      const keyResult = findShortestPathWithKeys(
        keySpace.id,
        selectableIds,
        activeIds,
        visitedKeys
      );
      
      if (keyResult) {
        allPaths.push(...keyResult.paths);
        totalCost += keyResult.totalCost;
      }
    }
    
    return { cost: mainPath.cost, paths: allPaths, totalCost };
  };

  const findShortestPath = (targetId: number): { cost: number; path: number[]; totalCost: number } | null => {
    const activeIds = Object.keys(active).filter(k => active[Number(k)]).map(Number);
    if (activeIds.length === 0) return null;
    
    // 現在の選択可能マスを取得
    const currentSelectableSpaces: number[] = [];
    spaces.forEach(space => {
      if (active[space.id]) return; // 踏破済は除外
      
      const hasActiveNeighbor = aisles.some(aisle => {
        return (aisle.from_space_id === space.id && activeIds.includes(aisle.to_space_id)) ||
               (aisle.to_space_id === space.id && activeIds.includes(aisle.from_space_id));
      });
      
      if (hasActiveNeighbor) {
        currentSelectableSpaces.push(space.id);
      }
    });
    
    if (currentSelectableSpaces.length === 0) return null;
    
    // 目的地とつながっている選択可能マスを探す
    const connectedSelectableSpaces: number[] = [];
    
    for (const selectableId of currentSelectableSpaces) {
      // この選択可能マスから目的地まで到達可能か確認
      const testPath = findPathFromSelectableSpaces(targetId, [selectableId]);
      if (testPath) {
        connectedSelectableSpaces.push(selectableId);
      }
    }
    
    if (connectedSelectableSpaces.length === 0) return null;
    
    // すべての接続された選択可能マスから最短経路を試す
    let bestResult: { cost: number; paths: number[][]; totalCost: number } | null = null;
    
    for (const selectableId of connectedSelectableSpaces) {
      const result = findShortestPathWithKeys(targetId, [selectableId], activeIds);
      
      if (result && (!bestResult || result.totalCost < bestResult.totalCost)) {
        bestResult = result;
      }
    }
    
    if (!bestResult) return null;
    
    // すべての経路を1つの配列に統合
    const allPathIds = Array.from(new Set(bestResult.paths.flat()));
    
    return {
      cost: bestResult.cost,
      path: allPathIds,
      totalCost: bestResult.totalCost
    };
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    const camera = cameraRef.current;
    if (!camera) return;
    
    const ctm = camera.getScreenCTM();
    if (!ctm) return;
    
    const transformed = pt.matrixTransform(ctm.inverse());
    
    const clickedSpace = spaces.find(space => {
      const dx = transformed.x - space.x;
      const dy = transformed.y - space.y;
      return Math.sqrt(dx * dx + dy * dy) < HEX_SIZE;
    });
    
    if (clickedSpace) {
      if (isKioskMode) {
        if (!active[clickedSpace.id]) {
          const result = findShortestPath(clickedSpace.id);
          if (result) {
            setTooltipInfo({
              cost: clickedSpace.cost,
              name: clickedSpace.reward_name || undefined,
              totalCost: result.totalCost
            });
            setHighlightedPath(result.path);
          } else {
            setTooltipInfo({
              cost: clickedSpace.cost,
              name: clickedSpace.reward_name || undefined,
              totalCost: undefined
            });
            setHighlightedPath([]);
          }
        }
      } else {
        toggleActive(clickedSpace.id);
      }
    } else {
      // 何もないエリアをタップした場合、吹き出しと経路表示をクリア
      setTooltipInfo(null);
      setHighlightedPath([]);
    }
  };

  const toggleActive = (id: number) => {
    setActive((prev) => {
      const newActive = { ...prev, [id]: !prev[id] };
      const arr = Object.keys(newActive).filter(k => newActive[Number(k)]).map(Number);
      localStorage.setItem("map-actives", JSON.stringify(arr));
      return newActive;
    });
  };

  const handleLeftButton = () => {
    if (selectableSpaces.length === 0 || !cursorSpaceId) return;
    
    // 吹き出しと経路表示をクリア
    setTooltipInfo(null);
    setHighlightedPath([]);
    
    const sortedSpaces = selectableSpaces.map(id => spaces.find(s => s.id === id)!).sort((a, b) => {
      if (a.x === b.x) return a.y - b.y;
      return a.x - b.x;
    });
    
    const currentSortedIdx = sortedSpaces.findIndex(s => s.id === cursorSpaceId);
    const newIdx = currentSortedIdx > 0 ? currentSortedIdx - 1 : sortedSpaces.length - 1;
    const newCursor = sortedSpaces[newIdx].id;
    
    setCursorSpaceId(newCursor);
    localStorage.setItem("map-cursor", String(newCursor));
  };

  const handleRightButton = () => {
    if (selectableSpaces.length === 0 || !cursorSpaceId) return;
    
    // 吹き出しと経路表示をクリア
    setTooltipInfo(null);
    setHighlightedPath([]);
    
    const sortedSpaces = selectableSpaces.map(id => spaces.find(s => s.id === id)!).sort((a, b) => {
      if (a.x === b.x) return a.y - b.y;
      return a.x - b.x;
    });
    
    const currentSortedIdx = sortedSpaces.findIndex(s => s.id === cursorSpaceId);
    const newIdx = currentSortedIdx < sortedSpaces.length - 1 ? currentSortedIdx + 1 : 0;
    const newCursor = sortedSpaces[newIdx].id;
    
    setCursorSpaceId(newCursor);
    localStorage.setItem("map-cursor", String(newCursor));
  };

  const handleDecideButton = () => {
    if (!cursorSpaceId || !selectableSpaces.includes(cursorSpaceId)) return;
    
    // 吹き出しと経路表示をクリア
    setTooltipInfo(null);
    setHighlightedPath([]);
    
    const currentCursorId = cursorSpaceId;
    
    setActive((prev) => {
      const newActive = { ...prev, [currentCursorId]: true };
      const arr = Object.keys(newActive).filter(k => newActive[Number(k)]).map(Number);
      localStorage.setItem("map-actives", JSON.stringify(arr));
      
      const newSelectableSpaces: number[] = [];
      spaces.forEach(space => {
        if (newActive[space.id]) return;
        
        const hasActiveNeighbor = aisles.some(aisle => {
          return (aisle.from_space_id === space.id && arr.includes(aisle.to_space_id)) ||
                 (aisle.to_space_id === space.id && arr.includes(aisle.from_space_id));
        });
        
        if (hasActiveNeighbor) {
          newSelectableSpaces.push(space.id);
        }
      });
      
      const adjacentSelectable = newSelectableSpaces.filter(id => {
        return aisles.some(aisle => {
          return (aisle.from_space_id === currentCursorId && aisle.to_space_id === id) ||
                 (aisle.to_space_id === currentCursorId && aisle.from_space_id === id);
        });
      });
      
      if (adjacentSelectable.length > 0) {
        const sorted = adjacentSelectable.map(id => spaces.find(s => s.id === id)!).sort((a, b) => {
          if (a.x === b.x) return a.y - b.y;
          return a.x - b.x;
        });
        setCursorSpaceId(sorted[0].id);
        localStorage.setItem("map-cursor", String(sorted[0].id));
      } else if (newSelectableSpaces.length > 0) {
        setCursorSpaceId(newSelectableSpaces[0]);
        localStorage.setItem("map-cursor", String(newSelectableSpaces[0]));
      } else {
        setCursorSpaceId(null);
        localStorage.removeItem("map-cursor");
      }
      
      return newActive;
    });
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    
    if (!isKioskMode) {
      const svg = svgRef.current;
      const camera = cameraRef.current;
      if (!svg || !camera) return;
      
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      
      const ctm = camera.getScreenCTM();
      if (!ctm) return;
      
      const transformed = pt.matrixTransform(ctm.inverse());
      
      const clickedSpace = spaces.find(space => {
        const dx = transformed.x - space.x;
        const dy = transformed.y - space.y;
        return Math.sqrt(dx * dx + dy * dy) < HEX_SIZE;
      });
      
      if (clickedSpace) {
        longPressTimer.current = setTimeout(() => {
          setTooltipInfo({
            cost: clickedSpace.cost,
            name: clickedSpace.reward_name || undefined
          });
        }, 500);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDragging.current && lastPointer.current) {
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
      
      setOffset((prev) => {
        const newX = prev.x + dx;
        const newY = prev.y + dy;
        
        // マップの端を超えないように制限（余白は表示しない）
        const DRAW_WIDTH = mapSize.width + 100;
        const DRAW_HEIGHT = mapSize.height + 100;
        
        const minX = canvasWidth - DRAW_WIDTH * scale;
        const maxX = 0;
        const minY = canvasHeight - DRAW_HEIGHT * scale;
        const maxY = 0;
        
        const clampedX = Math.max(minX, Math.min(maxX, newX));
        const clampedY = Math.max(minY, Math.min(maxY, newY));
        
        return { x: clampedX, y: clampedY };
      });
      lastPointer.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    lastPointer.current = null;
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    localStorage.setItem("map-offsets", JSON.stringify([offset.x, offset.y]));
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    
    const svg = svgRef.current;
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setScale((prevScale) => {
      // マップ全体が表示される最小スケールを計算
      const DRAW_WIDTH = mapSize.width + 100;
      const DRAW_HEIGHT = mapSize.height + 100;
      
      // 幅と高さそれぞれで、マップ全体が収まる最小スケールを計算
      const minScaleX = canvasWidth / DRAW_WIDTH;
      const minScaleY = canvasHeight / DRAW_HEIGHT;
      
      // 大きい方を採用（両方の辺がキャンバスに収まる）
      const minScaleForFullView = Math.max(minScaleX, minScaleY);
      
      const newScale = Math.max(minScaleForFullView, Math.min(3, prevScale * delta));
      
      setOffset((prevOffset) => {
        // マウス位置を中心にズーム
        const baseX = (mouseX - prevOffset.x) / prevScale;
        const baseY = (mouseY - prevOffset.y) / prevScale;
        
        let newX = mouseX - baseX * newScale;
        let newY = mouseY - baseY * newScale;
        
        // マップの端を超えないように制限（余白は表示しない）
        const minX = canvasWidth - DRAW_WIDTH * newScale;
        const maxX = 0;
        const minY = canvasHeight - DRAW_HEIGHT * newScale;
        const maxY = 0;
        
        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));
        
        localStorage.setItem("map-offsets", JSON.stringify([newX, newY]));
        return { x: newX, y: newY };
      });
      
      localStorage.setItem("map-scale", String(newScale));
      return newScale;
    });
  };

  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);
  const mapSizeRef = useRef(mapSize);
  const canvasWidthRef = useRef(canvasWidth);
  const canvasHeightRef = useRef(canvasHeight);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    mapSizeRef.current = mapSize;
  }, [mapSize]);

  useEffect(() => {
    canvasWidthRef.current = canvasWidth;
  }, [canvasWidth]);

  useEffect(() => {
    canvasHeightRef.current = canvasHeight;
  }, [canvasHeight]);

  // ピンチで拡大縮小（既存mapと同じ処理）
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    
    let startDist: number | null = null;
    let startMid: { x: number; y: number } | null = null;
    let startScale: number | null = null;
    let startOffset: { x: number; y: number } | null = null;

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        const [t1, t2] = e.touches;
        startDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        startMid = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
        startScale = scaleRef.current;
        startOffset = { ...offsetRef.current };
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length === 2 && startDist && startMid && startScale !== null && startOffset && svg) {
        e.preventDefault();
        const [t1, t2] = e.touches;
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const ratio = dist / startDist;
        
        // マップ全体が表示される最小スケールを計算
        const DRAW_WIDTH = mapSizeRef.current.width + 100;
        const DRAW_HEIGHT = mapSizeRef.current.height + 100;
        
        // 幅と高さそれぞれで、マップ全体が収まる最小スケールを計算
        const minScaleX = canvasWidthRef.current / DRAW_WIDTH;
        const minScaleY = canvasHeightRef.current / DRAW_HEIGHT;
        
        // 大きい方を採用（両方の辺がキャンバスに収まる）
        const minScaleForFullView = Math.max(minScaleX, minScaleY);
        
        const newScale = Math.max(minScaleForFullView, Math.min(3, startScale * ratio));
        
        const svgRect = svg.getBoundingClientRect();
        const baseX = (startMid.x - svgRect.left - startOffset.x) / startScale;
        const baseY = (startMid.y - svgRect.top - startOffset.y) / startScale;

        let newOffsetX = startMid.x - svgRect.left - baseX * newScale;
        let newOffsetY = startMid.y - svgRect.top - baseY * newScale;
        
        // マップの端を超えないように制限（余白は表示しない）
        const minX = canvasWidthRef.current - DRAW_WIDTH * newScale;
        const maxX = 0;
        const minY = canvasHeightRef.current - DRAW_HEIGHT * newScale;
        const maxY = 0;
        
        newOffsetX = Math.max(minX, Math.min(maxX, newOffsetX));
        newOffsetY = Math.max(minY, Math.min(maxY, newOffsetY));
        
        setScale(newScale);
        setOffset({ x: newOffsetX, y: newOffsetY });
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) {
        startDist = null;
        startMid = null;
        startScale = null;
        startOffset = null;
        localStorage.setItem("map-scale", String(scaleRef.current));
        localStorage.setItem("map-offsets", JSON.stringify([offsetRef.current.x, offsetRef.current.y]));
      }
    }

    svg.addEventListener("touchstart", onTouchStart, { passive: false });
    svg.addEventListener("touchmove", onTouchMove, { passive: false });
    svg.addEventListener("touchend", onTouchEnd);
    
    return () => {
      svg.removeEventListener("touchstart", onTouchStart);
      svg.removeEventListener("touchmove", onTouchMove);
      svg.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.setAttribute("transform", `translate(${offset.x}, ${offset.y}) scale(${scale})`);
    }
  }, [offset, scale]);

  useEffect(() => {
    if (isKioskMode && cursorSpaceId && !tooltipInfo) {
      const cursorSpace = spaces.find(s => s.id === cursorSpaceId);
      if (cursorSpace) {
        setTooltipInfo({
          cost: cursorSpace.cost,
          name: cursorSpace.reward_name || undefined
        });
      }
    } else if (!isKioskMode) {
      setTooltipInfo(null);
      setHighlightedPath([]);
    }
  }, [isKioskMode, cursorSpaceId, spaces]);

  const isOptionVisible = (type: string) => {
    if (selectedOptions.includes("music") && type === "music") return true;
    if (selectedOptions.includes("card") && type === "card") return true;
    if (selectedOptions.includes("story") && type === "story") return true;
    if (selectedOptions.includes("plate") && type === "plate") return true;
    if (selectedOptions.includes("drop") && type === "drop") return true;
    if (selectedOptions.includes("other") && type === "other") return true;
    if (selectedOptions.includes("keydoor") && (type === "key" || type === "door")) return true;
    return false;
  };

  const getIconPath = (type: string, color?: string | null) => {
    if (type === "key" || type === "door") {
      if (color === "blue" || color === "pink" || color === "yellow") {
        return `/images/icon_${type}_${color}.svg`;
      }
    }
    const iconMap: { [key: string]: string } = {
      music: "/images/icon_music.svg",
      card: "/images/icon_exclamation.svg",
      story: "/images/icon_exclamation.svg",
      plate: "/images/icon_exclamation.svg",
      drop: "/images/icon_other.svg",
      other: "/images/icon_other.svg",
    };
    return iconMap[type] || "/images/icon_other.svg";
  };

  const renderSpace = (space: Space) => {
    const isActive = active[space.id];
    const isSelectable = isKioskMode && selectableSpaces.includes(space.id);
    const isCursor = isKioskMode && cursorSpaceId === space.id;
    const isHighlighted = highlightedPath.includes(space.id);
    const showIcon = !isActive && space.reward_type && space.reward_type !== "none" && isOptionVisible(space.reward_type);
    
    let fillColor = "#fffbdaff";
    let strokeColor = "#c4b896ff";
    let strokeWidth = 2;
    
    if (isActive) {
      fillColor = "#666666ff";
      strokeColor = "#666666ff";
    } else if (isHighlighted) {
      fillColor = "#4dabf7";
      strokeColor = "#1971c2";
      strokeWidth = 3;
    } else if (isSelectable) {
      fillColor = "#f3f03dff";
      strokeColor = "#ff6600";
    } else if (showIcon) {
      fillColor = "#f3f03dff";
      strokeColor = BORDER_COLOR;
    }
    
    if (isCursor) {
      strokeColor = "#ff0000";
      strokeWidth = 8;
    }
    
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i;
      const px = space.x + HEX_SIZE * Math.cos(angle);
      const py = space.y + HEX_SIZE * Math.sin(angle);
      points.push(`${px},${py}`);
    }
    
    return (
      <g key={space.id}>
        <polygon
          points={points.join(" ")}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        
        {showIcon && !isHighlighted && (
          <image
            href={getIconPath(space.reward_type, space.reward_color)}
            x={space.x - 18}
            y={space.y - 18}
            width={36}
            height={36}
            opacity={scale * HEX_SIZE >= 20 ? 0.3 : 1}
          />
        )}
        
        {showIcon && !isHighlighted && scale * HEX_SIZE >= 20 && space.reward_name && (
          <text
            x={space.x}
            y={space.y + 6}
            textAnchor="middle"
            fontSize={12}
            fontWeight="bold"
            fill="#000"
            stroke="#fff"
            strokeWidth={0.3}
          >
            {space.reward_name}
          </text>
        )}
        
        {!isActive && space.cost !== null && (
          <text
            x={space.x + HEX_SIZE * 1}
            y={space.y + HEX_SIZE * 1.1}
            textAnchor="middle"
            fontSize={16}
            fontWeight="bold"
            fill="#0059ffff"
            stroke="#d8e5ffff"
            strokeWidth={0.7}
          >
            {space.cost}
          </text>
        )}
      </g>
    );
  };

  return {
    svgRef,
    cameraRef,
    canvasWidth,
    canvasHeight,
    OPTION_ITEMS,
    BORDER_COLOR,
    selectedOptions,
    handleClickOption,
    handleClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    isKioskMode,
    setIsKioskMode,
    handleLeftButton,
    handleRightButton,
    handleDecideButton,
    spaces,
    aisles,
    mapSize,
    renderSpace,
    tooltipInfo,
  };
};
