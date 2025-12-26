"use client";

import Title from "@/components/Title/Title";
import Header from "@/components/Header/Header";
import HeaderMeta from "@/components/HeadMeta/HeadMeta";
import { useDatabaseLogic } from "./useDatabaseLogic";
import style from "./page.module.css";

const DatabasePage = () => {
	const logic = useDatabaseLogic();
	return (
		<>
			<HeaderMeta
				title="☆獲得人数一覧 - Pongeki"
				description="各楽曲の☆獲得人数を一覧表で閲覧できます。オンゲキ-NETの全国ランキングページに反映されているデータが対象になります。"
				imagePath="/index/index_database.png"
			/>
			<Header />
			<Title title="☆獲得人数一覧" />
			<section className={style.descriptionSection}>
				<p>各楽曲の☆獲得人数を一覧表で閲覧できます。<br />
				オンゲキ-NETの全国ランキングページに反映されているデータが対象になります。</p>
			</section>

			<section className={style.optionSection}>
				{logic.isSpState ? (
					<>
						<div className={style.optionSpContainer}>
							<button
								className={style.optionSpButton}
								onClick={() => { logic.setModalOpen("level"); logic.setModalTab("level"); }}
							>
								レベル・難易度選択
							</button>
							<button
								className={style.optionSpButton}
								onClick={() => { logic.setModalOpen("other"); logic.setModalTab("other"); }}
							>
								その他オプション
							</button>
						</div>
						{logic.modalOpen && (
							<>
								<style>{`body { overflow: hidden !important; }`}</style>
								<div className={style.modalOverlay}>
									<div className={style.modalContainer}>
										<div className={style.modalTabs}>
											<button
												className={style.modalTab + (logic.modalTab === "level" ? ` ${style.modalTabActive}` : "")}
												onClick={() => logic.setModalTab("level")}
											>
												レベル・難易度選択
											</button>
											<button
												className={style.modalTab + (logic.modalTab === "other" ? ` ${style.modalTabActive}` : "")}
												onClick={() => logic.setModalTab("other")}
											>
												その他オプション
											</button>
										</div>
										<div className={style.modalInnerArea}>
											{logic.modalTab === "level" ? (
												<>
													<div className={style.modalInnerContentArea}>
														<div className={style.modalInnerTitle}>レベル選択</div>
														<div className={style.modalInnerButtonsArea}>
															{logic.LEVELS.map(level => (
																<label
																	className={`${style.modalCheckbox} ${logic.selectedLevels.includes(level) ? ` ${style.modalCheckboxChecked}` : ""}`}
																	key={level}
																>
																	<input
																		type="checkbox"
																		checked={logic.selectedLevels.includes(level)}
																		onChange={() =>
																			logic.setSelectedLevels(logic.selectedLevels.includes(level)
																				? logic.selectedLevels.filter(l => l !== level)
																				: [...logic.selectedLevels, level])
																		}
																		style={{ display: "none" }}
																	/>
																	{level}
																</label>
															))}
														</div>
													</div>
													<div className={style.modalDivider}/>
													<div className={style.modalInnerContentArea}>
														<div className={style.modalInnerTitle}>難易度選択</div>
														<div className={style.modalInnerButtonsArea}>
															{logic.DIFF.map(diff => (
																<label
																	className={`${style.modalCheckbox} ${logic.selectedDiffs.includes(diff) ? ` ${style.modalCheckboxChecked}` : ""}`}
																	key={diff}
																>
																	<input
																		type="checkbox"
																		checked={logic.selectedDiffs.includes(diff)}
																		onChange={() =>
																			logic.setSelectedDiffs(logic.selectedDiffs.includes(diff)
																				? logic.selectedDiffs.filter(d => d !== diff)
																				: [...logic.selectedDiffs, diff])
																		}
																		style={{ display: "none" }}
																	/>
																	{diff}
																</label>
															))}
														</div>
													</div>
												</>
											) : (
												<>
													<div className={style.modalInnerContentArea}>
														<div className={style.modalInnerTitle}>ソート順</div>
														<div className={style.modalSegments}>
															{logic.SORTS.map(opt => (
																<button
																	key={opt.value}
																	className={`${style.modalSegment} ${(logic.sort === opt.value) ? ` ${style.modalSegmentSelected}` : ""}`}
																	onClick={() => logic.setSort(opt.value)}
																	type="button"
																>
																	{opt.label}
																</button>
															))}
														</div>
													</div>
													<div className={style.modalInnerContentArea}>
														<div className={style.modalInnerTitle}>降順／昇順</div>
														<div className={style.modalSegments}>
															{logic.ORDERS.map(opt => (
																<button
																	key={opt.value}
																	className={`${style.modalSegment} ${(logic.order === opt.value) ? ` ${style.modalSegmentSelected}` : ""}`}
																	onClick={() => logic.setOrder(opt.value)}
																	type="button"
																>
																	{opt.label}
																</button>
															))}
														</div>
													</div>
													<div className={style.modalDivider}/>
													<div className={style.modalInnerContentArea}>
														<div className={style.modalInnerTitle}>テクニカルチャレンジ対象曲を除外</div>
														<div className={style.modalSegments}>
															{logic.TECH_EXCLUDE.map(opt => (
																<button
																	key={opt.value}
																	className={`${style.modalSegment} ${(logic.techExclude === opt.value) ? ` ${style.modalSegmentSelected}` : ""}`}
																	onClick={() => logic.setTechExclude(opt.value)}
																	type="button"
																>
																	{opt.label}
																</button>
															))}
														</div>
													</div>
													<div className={style.modalInnerContentArea}>
														<div className={style.modalInnerTitle}>ソロver.を除外</div>
														<div className={style.modalSegments}>
															{logic.SOLO_EXCLUDE.map(opt => (
																<button
																	key={opt.value}
																	className={`${style.modalSegment} ${(logic.soloExclude === opt.value) ? ` ${style.modalSegmentSelected}` : ""}`}
																	onClick={() => logic.setSoloExclude(opt.value)}
																	type="button"
																>
																	{opt.label}
																</button>
															))}
														</div>
													</div>
													<div className={style.modalDivider}/>
													<div className={style.modalInnerContentArea}>
														<div className={style.modalInnerTitle}>表示する項目</div>
														<div className={style.modalInnerColumnButtonsArea}>
															{logic.DISPLAY_COLUMNS.map(column => (
																<label
																	className={`${style.modalSegment} ${logic.displayColumns.includes(column.value) ? ` ${style.modalSegmentSelected}` : ""}`}
																	key={column.value}
																>
																	<input
																		type="checkbox"
																		checked={logic.displayColumns.includes(column.value)}
																		onChange={() =>
																			logic.setDisplayColumns(logic.displayColumns.includes(column.value)
																				? logic.displayColumns.filter(d => d !== column.value)
																				: [...logic.displayColumns, column.value])
																		}
																		style={{ display: "none" }}
																	/>
																	{column.label}
																</label>
															))}
														</div>
													</div>
												</>
											)}
										</div>
										<div className={style.modalButtonsArea}>
											<button
												className={style.modalApplyButton}
												onClick={() => {
													logic.setModalOpen(null);
													logic.handleApplyOptions();
												}}
											>
												オプションを適用
											</button>
											<button
												className={style.modalCloseButton}
												onClick={() => logic.setModalOpen(null)}
											>
												×
											</button>
										</div>
									</div>
									<div
										style={{
											position: "fixed",
											top: 0, left: 0, width: "100vw", height: "100vh",
											zIndex: 100,
										}}
										onClick={() => logic.setModalOpen(null)}
									/>
								</div>
							</>
						)}
					</>
				) : (
					<section className={style.optionsSection}>
						<div>
							<div className={style.pcOptionGroup}>
								<div className={style.modalInnerTitle}>レベル選択</div>
								<div className={style.modalInnerButtonsArea}>
									{logic.LEVELS.map(level => (
										<label
											className={`${style.modalCheckbox} ${logic.selectedLevels.includes(level) ? ` ${style.modalCheckboxChecked}` : ""}`}
											key={level}
										>
											<input
												type="checkbox"
												checked={logic.selectedLevels.includes(level)}
												onChange={() =>
													logic.setSelectedLevels(logic.selectedLevels.includes(level)
														? logic.selectedLevels.filter(l => l !== level)
														: [...logic.selectedLevels, level])
												}
												style={{ display: "none" }}
											/>
											{level}
										</label>
									))}
								</div>
							</div>
							<div className={style.pcOptionGroup}>
								<div className={style.modalInnerTitle}>難易度選択</div>
								<div className={style.modalInnerButtonsArea}>
									{logic.DIFF.map(diff => (
										<label
											className={`${style.modalCheckbox} ${logic.selectedDiffs.includes(diff) ? ` ${style.modalCheckboxChecked}` : ""}`}
											key={diff}
										>
											<input
												type="checkbox"
												checked={logic.selectedDiffs.includes(diff)}
												onChange={() =>
													logic.setSelectedDiffs(logic.selectedDiffs.includes(diff)
														? logic.selectedDiffs.filter(d => d !== diff)
														: [...logic.selectedDiffs, diff])
												}
												style={{ display: "none" }}
											/>
											{diff}
										</label>
									))}
								</div>
							</div>
							{/* 区切り線 */}
							<div className={style.modalDivider} />
							<div className={style.pcOptionGroup}>
								<div className={style.modalInnerTitle}>ソート順</div>
								<div className={style.modalSegments}>
									{logic.SORTS.map(opt => (
										<button
											key={opt.value}
											className={`${style.modalSegment} ${(logic.sort === opt.value) ? ` ${style.modalSegmentSelected}` : ""}`}
											onClick={() => logic.setSort(opt.value)}
											type="button"
										>
											{opt.label}
										</button>
									))}
								</div>
							</div>
							<div className={style.pcOptionGroup}>
        				<div className={style.modalInnerTitle}>降順／昇順</div>
								<div className={style.modalSegments}>
									{logic.ORDERS.map(opt => (
										<button
											key={opt.value}
											className={`${style.modalSegment} ${(logic.order === opt.value) ? ` ${style.modalSegmentSelected}` : ""}`}
											onClick={() => logic.setOrder(opt.value)}
											type="button"
										>
											{opt.label}
										</button>
									))}
								</div>
							</div>
							<div className={style.pcOptionGroup}>
								<div className={style.modalInnerTitle}>テクニカルチャレンジ対象曲を除外</div>
								<div className={style.modalSegments}>
									{logic.TECH_EXCLUDE.map(opt => (
										<button
											key={opt.value}
											className={`${style.modalSegment} ${(logic.techExclude === opt.value) ? ` ${style.modalSegmentSelected}` : ""}`}
											onClick={() => logic.setTechExclude(opt.value)}
											type="button"
										>
											{opt.label}
										</button>
									))}
								</div>
							</div>
							<div className={style.pcOptionGroup}>
          			<div className={style.modalInnerTitle}>ソロver.を除外</div>
								<div className={style.modalSegments}>
									{logic.SOLO_EXCLUDE.map(opt => (
										<button
											key={opt.value}
											className={`${style.modalSegment} ${(logic.soloExclude === opt.value) ? ` ${style.modalSegmentSelected}` : ""}`}
											onClick={() => logic.setSoloExclude(opt.value)}
											type="button"
										>
											{opt.label}
										</button>
									))}
								</div>
							</div>
							{/* 区切り線 */}
							<div className={style.modalDivider} />
							<div className={style.pcOptionGroup}>
								<div className={style.modalInnerTitle}>表示する項目</div>
								<div className={style.modalSegments}>
									{logic.DISPLAY_COLUMNS.map(column => (
										<label
											className={`${style.modalSegment} ${logic.displayColumns.includes(column.value) ? ` ${style.modalSegmentSelected}` : ""}`}
											key={column.value}
										>
											<input
												type="checkbox"
												checked={logic.displayColumns.includes(column.value)}
												onChange={() =>
													logic.setDisplayColumns(logic.displayColumns.includes(column.value)
														? logic.displayColumns.filter(d => d !== column.value)
														: [...logic.displayColumns, column.value])
												}
												style={{ display: "none" }}
											/>
											{column.label}
										</label>
									))}
								</div>
							</div>
      				<button
								className={style.modalApplyButton}
								onClick={() => {
									logic.setModalOpen(null);
									logic.handleApplyOptions();
								}}
							>
								オプションを適用
							</button>
    				</div>
					</section>
				)}
			</section>

			<section className={style.tableSection}>
				{logic.errorMsg && (
					<div className={style.errorMessage}>
						<p>{logic.errorMsg}</p>
					</div>
				)}
				{logic.loading && (
					<div className={style.loadingArea}>
						<span className={style.loadingSpinner}></span>
						<span className={style.loadingText}>情報を取得中...</span>
					</div>
				)}
				{logic.tableImageUrl && (
          <img className={style.tableImage} src={logic.tableImageUrl} alt="☆獲得人数一覧表"/>
        )}
			</section>
		</>
	);
};

export default DatabasePage;