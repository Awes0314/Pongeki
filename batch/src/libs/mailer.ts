import nodemailer from 'nodemailer';
import { log } from './logger.js';

/**
 * 通知メール送信処理
 * @param subject
 * @param text
 * @returns {Promise<void>}
 * @throws {Error}
 */
export async function sendNotificationEmail(subject: string, text: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: subject,
      text: text,
    };
    await transporter.sendMail(mailOptions);
    log('info', '通知メール送信成功');
  } catch (error) {
    log('error', `通知メール送信失敗: ${error}`);
    throw error;
  }
}

/**
 * 開始通知メール送信処理
 * @returns {Promise<void>}
 * @throws {Error}
 */
export async function sendStartEmail() {
  const subject = "Pongeki バッチ処理開始";
  const text = "Pongeki のバッチ処理が開始されました。\n\n"
    + "開始時間: " + new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) + "\n\n";

  await sendNotificationEmail(subject, text);
}

/**
 * 正常終了通知メール送信処理
 * @param {musicList:{
 *  title: string;
 *  level: string;
 *  diff: string;
 *  diffNum: string;
 *  idx: string;
 * }[]} 
 * @param {techFlagList:{
 *  title: string;
 *  diff: string;
 *  level: string;
 * }[]}
 * @param {chartConstList:{
 *  title: string;
 *  level: string;
 *  diff: string;
 *  chartConst: number;
 * }[]}
 * @param {rankingDataList:{
 *  title: string;
 *  diff: string;
 *  level: string;
 *  score: string;
 *  rank: string;
 * }[]}
 * @returns {Promise<void>}
 * @throws {Error}
 */
export async function sendCompletionEmail(
  musicList: { title: string; level: string; diff: string; diffNum: string; idx: string; }[],
  techFlagList: { title: string; diff: string; level: string }[],
  chartConstList: { title: string; diff: string; level: string; chartConst: number }[],
  rankingDataList: { title: string; diff: string; level: string; score: string; rank: string }[]
) {
  const subject = "Pongeki バッチ処理完了";
  const text = "Pongeki のバッチ処理が正常に完了しました。\n\n"
    + "開始時間: " + new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) + "\n\n"
    + "完了時間: " + new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) + "\n\n"
    + `対象楽曲数: ${musicList.length} 曲\n`
    + `テクチャレ対象楽曲数: ${techFlagList.length} 曲\n`
    + `譜面定数情報数: ${chartConstList.length} 件\n`
    + `ランキング情報数: ${rankingDataList.length} 件\n`;

  await sendNotificationEmail(subject, text);
}

/**
 * エラーメール送信処理
 * @param errorMessage
 * @returns {Promise<void>}
 */
export async function sendErrorEmail(errorMessage: string) {
  const subject = "Pongeki バッチ処理エラー発生";
  const text = "Pongeki のバッチ処理中にエラーが発生しました。\n\n"
    + "発生時間: " + new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) + "\n\n"
    + "エラーメッセージ:\n" + errorMessage + "\n";

  await sendNotificationEmail(subject, text);
}