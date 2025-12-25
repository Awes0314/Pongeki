/**
 * ログを出力する
 * @param {string} type
 * @param {string} message
 */
export function log(type: string, message: string): void {
  const timestamp = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  switch (type) {
    case 'log':
      console.log(`[${timestamp}] [LOG] ${message}`);
      break;
    case 'info':
      console.info(`[${timestamp}] [INFO] ${message}`);
      break;
    case 'warn':
      console.warn(`[${timestamp}] [WARN] ${message}`);
      break;
    case 'error':
      console.error(`[${timestamp}] [ERROR] ${message}`);
      break;
    default:
      console.log(`[${timestamp}] [OTHER] ${message}`);
      break;
  }
}