'use client';

import Header from "@/components/Header/Header";
import Title from "@/components/Title/Title";
import HeaderMeta from "@/components/HeadMeta/HeadMeta";
import style from "./page.module.css";
import { useMapLogic } from "./useMapLogic";

const MapPage = () => {
  const logic = useMapLogic();
  return (
    <div>
      <HeaderMeta
        title="オンゲキアドベンチャー マップ - Pongeki"
        description="オンゲキアドベンチャーのマップ全容を確認できます。オプションで獲得報酬表示の絞り込みが可能です。拡大すると報酬の詳細がマス上に表示されます。"
        imagePath="/index/index_map.png"
      />
      <Header />
      <Title title="オンゲキアドベンチャー マップ" />
      <section className={style.descriptionSection}>
        <p>
          <b>オンゲキアドベンチャー 修学旅行編</b> のマップ全容を確認できます。<br />
          オプションで獲得報酬表示の絞り込みが可能です。<br />
          拡大すると報酬の詳細がマス上に表示されます。<br /><br />
        </p>
        <p style={{ color: "red" }}>各マスをタップで踏破済み状態の切り替えができます。<br />
        同じブラウザであれば次回アクセス時も踏破状態は保存されます。<br /></p>
      </section>
      {/* オプションチェックボックス */}
      <div className={style.optionSection}>
        {logic.OPTION_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`${style.optionLabel} ${logic.selectedOptions.includes(item.key) ? ` ${style.optionLabelChecked}` : ""}`}
            onClick={() => logic.handleClickOption(item.key)}
          >
            {item.label}
          </button>
        ))
            }
      </div>
      <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", overflow: "auto", paddingTop: "20px" }}>
        <canvas
          ref={logic.canvasRef}
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
        />
      </div>
    </div>
  );
};

export default MapPage;