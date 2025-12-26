'use client';

import Title from "@/components/Title/Title";
import Header from "@/components/Header/Header";
import HeaderMeta from "@/components/HeadMeta/HeadMeta";
import { useRecommendLogic } from "./useRecommendLogic";
import style from "./page.module.css";


const RecommendPage = () => {
  const logic = useRecommendLogic();
  return (
    <>
      <HeaderMeta
        title="Pスコア枠おすすめ曲選出 - Pongeki"
        description="OngekiScoreLogと連携し、Pスコア枠更新におすすめの楽曲を自動で選出します。外れ値除外やテクニカルチャレンジ対象曲の除外など、細かな設定も可能です。"
        imagePath="/index/index_recommend.png"
      />
      <Header />
      <Title title={logic.isSp ? "Pスコア枠\nおすすめ曲選出" : "Pスコア枠おすすめ曲選出"} />

      <section className={style.descriptionSection}>
        <p>
          <a href="https://ongeki-score.net/" target="_blank" rel="noopener" style={{ color: "#3d5a80" }}>OngekiScoreLog</a> と連携し、Pスコア枠更新におすすめの楽曲を自動で選出します。
        </p>
      </section>

      {/* 外れ値除外モーダル */}
      {logic.showOutlierModal && (
        <div className={style.modalOverlay} onClick={logic.handleCloseModal}>
          <div className={style.modalContent} onClick={e => e.stopPropagation()}>
            <div className={style.modalTitle}>Pスコア枠外れ値除外</div>
            <div>
              <p><span style={{ color: "red" }}>「極端に高い値」を除外</span>することで、より適した選出が可能になる場合があります。</p>
            </div>
            {logic.modalLoading ? (
              <div className={style.modalLoading}><span className={style.spinner}></span>取得中...</div>
            ) : logic.modalError ? (
              <div className={style.modalError}>{logic.modalError}</div>
            ) : (
              <div style={{ marginBottom: 18 }}>
                {logic.modalRatings.length > 0 ? (() => {
                  const min = Math.min(...logic.modalRatings);
                  const max = Math.max(...logic.modalRatings);
                  const barAreaW = 300;
                  const barAreaH = 120;
                  const barGap = 1;
                  const n = logic.modalRatings.length;
                  const barW = n > 0 ? (barAreaW - barGap * (n - 1)) / n : 0;
                  const getBarHeight = (val: number) => {
                    if (max === min) return barAreaH * 0.5;
                    const ratio = (val - min) / (max - min);
                    return barAreaH * (0.1 + 0.8 * ratio);
                  };
                  const sortedRatings = [...logic.modalRatings].sort((a, b) => a - b);
                  // 初期値（最大値）
                  if (logic.barSliderIdx === 0 && sortedRatings.length > 0) logic.setBarSliderIdx(sortedRatings.length - 1);
                  return (
                    <div style={{ width: barAreaW, margin: "0 auto", marginBottom: 8, marginTop: 12 }}>
                      <div style={{ textAlign: "center", fontWeight: "bold", color: "#3d5a80", marginBottom: 8, fontSize: "1.05em" }}>
                        {`${min.toFixed(3)} ～ ${sortedRatings[logic.barSliderIdx]?.toFixed(3)}`}
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-end", height: barAreaH, width: barAreaW, borderBottom: "1.5px solid #98c1d9", position: "relative" }}>
                        {sortedRatings.map((r, idx) => (
                          <div key={idx} style={{
                            width: barW,
                            height: getBarHeight(r),
                            marginLeft: idx === 0 ? 0 : barGap,
                            background: idx > logic.barSliderIdx
                              ? "#ddddddff"
                              : "linear-gradient(180deg, #3d5a80 0%, #98c1d9 100%)",
                            borderRadius: "4px 4px 0 0",
                            position: "relative",
                            transition: "height 0.2s",
                          }} />
                        ))}
                      </div>
                      <div style={{ marginTop: 18, width: 300, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <input
                          type="range"
                          min={1}
                          max={sortedRatings.length - 1}
                          step={1}
                          value={logic.barSliderIdx}
                          onChange={e => logic.setBarSliderIdx(Number(e.target.value))}
                          className={style.slider}
                        />
                      </div>
                    </div>
                  );
                })() : (<div>データがありません</div>)}
              </div>
            )}
            <div className={style.modalActions}>
              <button type="button" onClick={logic.handleCloseModal} className={style.modalButton}>閉じる</button>
              <button type="button" onClick={logic.handleModalFilter} disabled={logic.modalLoading || logic.modalRatings.length === 0} className={style.modalApplyButton}>絞り込む</button>
            </div>
          </div>
        </div>
      )}

      <main className={style.mainContent}>
        <form onSubmit={logic.handleRecommend} className={style.formSection}>
          <div className={style.optionSection}>
            <div className={style.optionContentLabel}>OngekiScoreLog ID</div>
            <input
              className={style.optionContentInput}
              type="text"
              value={logic.id}
              onChange={e => logic.setId(logic.toHankaku(e.target.value).replace(/[^0-9]/g, "").slice(0, 5))}
              maxLength={5}
              pattern="[0-9]{0,5}"
              placeholder="半角数字0～5桁"
              required
              inputMode="numeric"
              autoComplete="off"
            />
          </div>
          <div className={style.optionSection}>
            <div className={style.optionContentLabel}></div>
            <div className={style.outlierExcludeContainer}>
              <button
                className={style.optionButton}
                type="button"
                onClick={logic.handleOutlierExclude}
                disabled={!logic.id}
              >
                外れ値を手動で除外
              </button>
              {logic.outlierExclude === "する" && logic.ratingRange && (
                <div className={style.outlierRange}>{`${logic.ratingRange[0].toFixed(3)} ～ ${logic.ratingRange[1].toFixed(3)}`}</div>
              )}
            </div>
          </div>
          <div className={style.optionSection}>
            <div className={style.optionContentLabel}><span>テクニカルチャレンジ<br className={style.isSp}/>対象曲を除外</span></div>
            <div className={style.optionSegments}>
              <button
                className={`${style.optionSegment} ${logic.excludeTech === "yes" ? style.optionSegmentActive : ""}`}
                type="button"
                onClick={() => logic.setExcludeTech("yes")}
              >
                する
              </button>
              <button
                className={`${style.optionSegment} ${logic.excludeTech === "no" ? style.optionSegmentActive : ""}`}
                type="button"
                onClick={() => logic.setExcludeTech("no")}
              >
                しない
              </button>
            </div>
          </div>
          <div className={style.optionSection}>
            <div className={style.optionContentLabel}><span>おすすめ楽曲数</span></div>
            <input
              className={style.optionContentInput}
              type="text"
              inputMode="numeric"
              pattern="[0-9０-９]{0,3}"
              value={logic.recommendCount === 0 ? "" : logic.recommendCount}
              onChange={logic.handleRecommendCountChange}
              min={1}
              max={100}
              placeholder="1〜100"
              required
              autoComplete="off"
            />
          </div>
          <div className={style.applySection}>
            <button className={style.applyButton} type="submit" disabled={logic.loading}>
              {logic.loading ? "選出中..." : "おすすめ楽曲を選出"}
            </button>
          </div>
        </form>
        {logic.error && (
          <div className={style.errorMsg}>{logic.error}</div>
        )}
        <div ref={logic.tableRef} dangerouslySetInnerHTML={{ __html: logic.tableHtml }} />
        {logic.resultImgs.length > 0 && (
          <div className={style.resultImages}>
            <div className={style.tabButtons}>
              {["☆5", "☆4", "☆3"].map((tab, idx) => (
                <button
                  key={tab}
                  className={logic.activeTab === idx ? style.tabActive : style.tabInactive}
                  onClick={() => logic.setActiveTab(idx)}
                  type="button"
                >
                  {tab}
                </button>
              ))}
            </div><br/>
            <button className={style.saveButton} onClick={logic.handleSave}>画像を保存・共有</button>
            <img src={logic.resultImgs[logic.activeTab]} alt="おすすめ楽曲表" className={style.resultImg} />
            <button className={style.saveButton} onClick={logic.handleSave}>画像を保存・共有</button>
          </div>
        )}
      </main>
    </>
  );
};

export default RecommendPage;