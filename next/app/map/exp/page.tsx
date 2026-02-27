'use client';

import Header from "@/components/Header/Header";
import Title from "@/components/Title/Title";
import HeaderMeta from "@/components/HeadMeta/HeadMeta";
import style from "./page.module.css";
import { useMapExpLogic } from "./useMapExpLogic";

const MapExpPage = () => {
  const logic = useMapExpLogic();
  
  return (
    <div>
      <HeaderMeta
        title="オンゲキアドベンチャー マップ EXP - Pongeki"
        description="オンゲキアドベンチャーのマップ全容を確認できます。筐体モードで実際のゲームプレイを再現できます。"
        imagePath="/index/index_map.png"
      />
      <Header />
      <Title title="オンゲキアドベンチャー マップ NEW" />
      <section className={style.descriptionSection}>
        <p style={{ color: "red" }}>
          このページは新機能実装のβ版となります。<br />
          通常通り使用できますが、お気づきの点があれば <a href="https://x.com/Extra_Awes" target="_blank" rel="noopener noreferrer" style={{ color: "red", textDecoration: "underline" }}>管理者</a> までご連絡ください。<br /><br />
        </p>
        <p>
          <b>オンゲキアドベンチャー 修学旅行編</b> のマップ全容を確認できます。<br />
          同端末・同ブラウザであれば次回アクセス時も踏破状態は保存されます。<br /><br />
        </p>
        <p style={{ color: "red" }}>
          新機能：筐体モード<br />
          左右ボタンでカーソル移動、決定ボタンで踏破にできます。<br />
          未踏破のマスをタップすると、最短経路や必要総APを表示できます。<br />
        </p>
      </section>
      
      {/* オプションチェックボックス */}
      <div className={style.optionSection}>
        {logic.OPTION_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`${style.optionLabel} ${logic.selectedOptions.includes(item.key) ? style.optionLabelChecked : ""}`}
            onClick={() => logic.handleClickOption(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 筐体モード用ボタンとモード切替 */}
      <div className={style.kioskButtonSection}>
        <div className={style.modeToggleContainer}>
          <span className={style.modeToggleLabel}>筐体</span>
          <label className={style.modeToggleSwitch}>
            <input
              type="checkbox"
              checked={logic.isKioskMode}
              onChange={(e) => logic.setIsKioskMode(e.target.checked)}
            />
            <span className={style.modeToggleSlider}></span>
          </label>
        </div>
        
        <div className={style.kioskButtonGroup}>
          <button 
            className={style.kioskButton} 
            onClick={logic.handleLeftButton}
            disabled={!logic.isKioskMode}
          >
            ←
          </button>
          <button 
            className={`${style.kioskButton} ${style.kioskButtonDecide}`}
            onClick={logic.handleDecideButton}
            disabled={!logic.isKioskMode}
          >
            決定
          </button>
          <button 
            className={style.kioskButton}
            onClick={logic.handleRightButton}
            disabled={!logic.isKioskMode}
          >
            →
          </button>
        </div>
      </div>

      <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", overflow: "auto", paddingTop: "20px" }}>
        <svg
          ref={logic.svgRef}
          width={logic.canvasWidth}
          height={logic.canvasHeight}
          style={{
            touchAction: "none",
            borderRadius: 16,
            border: `2px solid ${logic.BORDER_COLOR}`,
            background: "#fff",
            maxWidth: "100%"
          }}
          onClick={logic.handleClick}
          onPointerDown={logic.handlePointerDown}
          onPointerMove={logic.handlePointerMove}
          onPointerUp={logic.handlePointerUp}
          onPointerLeave={logic.handlePointerUp}
          onWheel={logic.handleWheel}
        >
          <g ref={logic.cameraRef}>
            {/* 背景 */}
            <rect x={-50} y={-50} width={logic.mapSize.width + 100} height={logic.mapSize.height + 100} fill="#ecf8ffff" />
            
            {/* 道 */}
            {logic.aisles.map((aisle, idx) => {
              const fromSpace = logic.spaces.find(s => s.id === aisle.from_space_id);
              const toSpace = logic.spaces.find(s => s.id === aisle.to_space_id);
              if (!fromSpace || !toSpace) return null;
              return (
                <line
                  key={idx}
                  x1={fromSpace.x}
                  y1={fromSpace.y}
                  x2={toSpace.x}
                  y2={toSpace.y}
                  stroke="#999999ff"
                  strokeWidth={3}
                />
              );
            })}
            
            {/* マス */}
            {logic.spaces.map((space) => logic.renderSpace(space))}
          </g>
        </svg>
      </div>
      
      {/* 情報吹き出し */}
      {logic.tooltipInfo && (
        <div className={style.tooltip}>
          <p><strong>必要AP :</strong> {logic.tooltipInfo.cost}</p>
          {logic.tooltipInfo.name && <p><strong>報酬 :</strong> {logic.tooltipInfo.name}</p>}
          {logic.tooltipInfo.totalCost !== undefined && (
            <p><strong>必要総AP :</strong> {logic.tooltipInfo.totalCost}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MapExpPage;
