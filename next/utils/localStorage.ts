// LocalStiorage関連のユーティリティ関数

/**
 * アクセス時必ず作動する関数
 * @returns {void}
 */
const initializeLocalStorageSettings = (): void => {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem("user-id")) {
    localStorage.setItem("user-id", generateUUID());
  }

  // database設定値
  if (!localStorage.getItem("database-level")) {
    localStorage.setItem("database-level", JSON.stringify([]));
  }
  if (!localStorage.getItem("database-diff")) {
    localStorage.setItem("database-diff", JSON.stringify(["MASTER", "EXPERT", "ADVANCED", "BASIC", "LUNATIC"]));
  }
  if (!localStorage.getItem("database-sort")) {
    localStorage.setItem("database-sort", "star");
  }
  if (!localStorage.getItem("database-asc-desc")) {
    localStorage.setItem("database-asc-desc", "desc");
  }
  if (!localStorage.getItem("database-tech-exclude")) {
    localStorage.setItem("database-tech-exclude", "no");
  }
  if (!localStorage.getItem("database-solo-exclude")) {
    localStorage.setItem("database-solo-exclude", "yes");
  }
  if (!localStorage.getItem("database-display-columns")) {
    localStorage.setItem("database-display-columns", JSON.stringify(["title","diff","level","chartConst","star5Count","starDistr"]));
  }

  // recommend設定値
  if (!localStorage.getItem("recommend-id")) {
    localStorage.setItem("recommend-id", "");
  }
  if (!localStorage.getItem("recommend-count")) {
    localStorage.setItem("recommend-count", "30");
  }
  if (!localStorage.getItem("recommend-tech-exclude")) {
    localStorage.setItem("recommend-tech-exclude", "no");
  }
  if (!localStorage.getItem("user-name")) {
    localStorage.setItem("user-name", "");
  }

  // ranking設定値
  if (!localStorage.getItem("ranking-type")) {
    localStorage.setItem("ranking-type", "ts");
  }
  if (!localStorage.getItem("ranking-show-after-2nd")) {
    localStorage.setItem("ranking-show-after-2nd", "false");
  }

  // map設定値
  if (!localStorage.getItem("map-id")) {
    localStorage.setItem("map-id", "1");
  }
  if (!localStorage.getItem("map-options")) {
    localStorage.setItem("map-options", JSON.stringify(["music","card","story","keydoor","plate","other","drop"]));
  }
  if (!localStorage.getItem("map-actives")) {
    localStorage.setItem("map-actives", JSON.stringify([1]));
  }
  if (!localStorage.getItem("map-scale")) {
    localStorage.setItem("map-scale", "1");
  }
  if (!localStorage.getItem("map-offsets")) {
    localStorage.setItem("map-offsets", JSON.stringify([0,0]));
  }
};


/**
 * user-id用のUUIDを生成
 * @returns {string} UUID文字列
 */
const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export { initializeLocalStorageSettings };