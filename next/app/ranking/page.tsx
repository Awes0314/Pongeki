'use client';

import Header from "@/components/Header/Header";
import Title from "@/components/Title/Title";
import HeaderMeta from "@/components/HeadMeta/HeadMeta";
import style from "./page.module.css";
import { useDatabaseLogic } from "./useRankingLogic";

const RankingPage = () => {
  const logic = useDatabaseLogic();
  return (
    <>
      <HeaderMeta
        title="理論値ランキング - Pongeki"
        description="テクニカルスコアランキング1位理論値回数・テクニカルスコア理論値回数(2位以降も含む)・P-スコア理論値達成人数をランキング形式で閲覧できます。オンゲキ-NETの全国ランキングページに反映されているデータが対象になります。"
        imagePath="/index/index_ranking.png"
      />
      <Header />
      <Title title="理論値ランキング" />
      <section className={style.descriptionSection}>
				<p>
          <b>テクニカルスコアランキング1位理論値回数</b>
          ・
          <b>テクニカルスコア理論値回数(2位以降も含む)</b>
          ・
          <b>P-スコア理論値達成人数 </b>
          をランキング形式で閲覧できます。
        </p><br />
        <p>オンゲキ-NETの全国ランキングページに反映されているデータが対象になります。</p>
			</section>

      <section className={style.optionSection}>
        <div className={style.Tabs}>
          <button
            className={style.Tab + (logic.tab === "ts" ? ` ${style.TabActive}` : "")}
            onClick={() => logic.setTab("ts")}
          >
            TS1位理論値回数
          </button>
          <button
            className={style.Tab + (logic.tab === "ps" ? ` ${style.TabActive}` : "")}
            onClick={() => logic.setTab("ps")}
          >
            PS理論値人数
          </button>
        </div>
        <div className={style.checkboxContainer}>
          {logic.tab === "ts" ? (
            <button
              className={`${style.checkbox} ${logic.showAfter2nd ? ` ${style.checkboxChecked}` : ""}`}
              onClick={() =>
                logic.setShowAfter2nd(!logic.showAfter2nd)
              }
            >
              2位以降も表示
            </button>
          ) : (
            <></>
          )}
        </div>
      </section>

      <section className={style.rankingSection}>
        {logic.loading && (
          <div className={style.loadingArea}>
						<span className={style.loadingSpinner}></span>
						<span className={style.loadingText}>情報を取得中...</span>
					</div>
        )}
        {!logic.loading && logic.tableImageUrl && (
          <img
            src={logic.tableImageUrl}
            alt="ランキング表"
            style={{
              maxWidth: "100%",
              borderRadius: 8,
              boxShadow: "0 2px 8px #98c1d966",
            }}
          />
        )}
      </section>
    </>
  );
};

export default RankingPage;