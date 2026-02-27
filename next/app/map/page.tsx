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
      
      {/* 新機能のお知らせ */}
      <div style={{ 
        margin: "20px auto", 
        maxWidth: "600px", 
        padding: "15px 20px", 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        textAlign: "center"
      }}>
        <p style={{ 
          color: "#fff", 
          fontSize: "16px", 
          fontWeight: "bold", 
          margin: "0 0 10px 0" 
        }}>
          新機能：筐体モード
        </p>
        <p style={{ 
          color: "#fff", 
          fontSize: "14px", 
          margin: "0 0 15px 0", 
          textAlign: "left"
        }}>
          現在の踏破状況管理に加え、<br />
          ・筐体の操作によるカーソル移動再現<br />
          ・最短経路と必要AP数の表示<br />
          ができるβ用ページを作成しました。<br />
          踏破状況は自動で今のページと共有されますので、お気軽にお試しください。
        </p>
        <a 
          href="/map/exp" 
          style={{
            display: "inline-block",
            padding: "10px 30px",
            background: "#fff",
            color: "#667eea",
            borderRadius: "25px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "15px",
            transition: "transform 0.2s",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          新しいマップを試す →
        </a>
      </div>
      
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