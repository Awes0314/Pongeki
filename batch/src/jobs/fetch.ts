import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import {
  SINGULARITY_ORDER_ONGEKI_NET,
  SINGULARITY_ORDER_TECHFLAG,
  SINGULARITY_ORDER_CHARTCONST,
  DIFFS,
  DIFF_MAP
} from '../libs/var.js';
import { log } from '../libs/logger.js';

/**
 * ログイン処理にて取得したcookie情報
 * （login()実行後、毎回上書きする）
 * @typedef {{ _t: string; userId: string; friendCodeList: string; }} LoginCookies
 */
let _loginCookies: { _t: string; userId: string; friendCodeList: string; } | null = null;
const _userAgent: string = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

/**
 * ログイン処理
 * @returns {Promise<{page: puppeteer.Page,}>}
 * @throws {Error}
 */
export async function login () {
  log('info', 'ログイン処理開始');

  const browserOngekiNet = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  try {
    const username = process.env.ONGEKI_NET_USER;
    const password = process.env.ONGEKI_NET_PASS;
    if (!username || !password) {
      log('error', '環境変数が設定されていません');
      throw new Error('environment variable not set');
    }

    const urlLogin = 'https://ongeki-net.com/ongeki-mobile/';
    const urlAimeList = 'https://ongeki-net.com/ongeki-mobile/aimeList/submit/';

    const page = await browserOngekiNet.newPage();
    await page.setUserAgent(_userAgent);
    await page.goto(urlLogin, { waitUntil: 'networkidle2', timeout: 120000 });
    await page.type('input[name="segaId"]', username);
    await page.type('input[name="password"]', password);
    await Promise.all([
      page.click('button[type="submit"].btn_login_block'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 })
    ]);

    const loginError = await page.$('.login_block');
    if (loginError) {
      log('error', 'ログインに失敗しました');
      throw new Error('login failed');
    }

    await Promise.all([
      page.click(`form[action="${urlAimeList}"] button[type="submit"]`),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 })
    ]);

    const userData = await page.$('.user_data_container');
    if (!userData) {
      log('error', 'ユーザ情報の取得に失敗しました');
      throw new Error('failed to get user data');
    }

    const cookies = await page.cookies();
    let _t = '';
    let userId = '';
    let friendCodeList = '';
    for (const c of cookies) {
      if (c.name === '_t') _t = c.value;
      if (c.name === 'userId') userId = c.value;
      if (c.name === 'friendCodeList') friendCodeList = c.value;
    }
    _loginCookies = { _t, userId, friendCodeList };

    await page.close();
    await browserOngekiNet.close();
    log('info', 'ログイン処理完了');

    return { _t, userId, friendCodeList };
  } catch (err) {
    log('error', `login関数でエラー: ${err}`);
    console.error(err);
    if (browserOngekiNet) {
      await browserOngekiNet.close();
      log('info', 'エラー発生のためブラウザを閉じました');
    }

    log('error', 'ログイン処理失敗により処理を中断します');
    process.exit(1);
  }
}

/**
 * 対象となる全楽曲を取得する
 * @returns {Promise<{musicList:{
 *  title: string;
 *  level: string;
 *  diff: string;
 *  diffNum: string;
 *  idx: string;
 * }[]}>}
 * @throws {Error}
 */
export async function getAllMusic() {
  log('info', '全楽曲取得処理開始');

  try {
    const _t = _loginCookies?._t || '';
    const userId = _loginCookies?.userId || '';
    const friendCodeList = _loginCookies?.friendCodeList || '';
    const userAgent = _userAgent || 'Mozilla/5.0';

    const allMusic: {
      title: string;
      level: string;
      diff: string;
      diffNum: string;
      idx: string;
    }[] = [];

    const urlBase = 'https://ongeki-net.com/ongeki-mobile/ranking/search/?genre=99&scoreType=2&rankingType=99';

    for (const diff of DIFFS) {
      const url = `${urlBase}&diff=${diff}`;
      const res = await fetch(url, {
        headers: {
          'Cookie': `_t=${_t}; userId=${userId}; friendCodeList=${friendCodeList}`,
          'User-Agent': userAgent,
        },
      });
      const html = await res.text();
      const $ = cheerio.load(html);

      const musicList: {
        title: string;
        level: string;
        diff: string;
        idx: string;
      }[] = [];

      $('div[class*="_score_back"]').each((_, node) => {
        const title = $(node).find('.music_label').text().trim();
        const level = $(node).find('.score_level').text().trim();
        const rawIdx = $(node).find('input[name="idx"]').val() as string || '';
        const idx = encodeURIComponent(rawIdx);
        const diffValue = $(node).find('input[name="diff"]').val() as string || '';
        musicList.push({ title, level, diff: diffValue, idx });
      });

      for (const music of musicList) {
        allMusic.push({
          title: music.title,
          level: music.level,
          diff: DIFF_MAP[Number(music.diff)] ?? music.diff,
          diffNum: music.diff,
          idx: music.idx,
        });
      }

      if (diff !== 10) {
        const singularityIndexes = allMusic
          .map((m, i) => (m.title === 'Singularity' && m.diff === DIFF_MAP[diff]) ? i : -1)
          .filter(i => i !== -1);
        if (singularityIndexes.length === SINGULARITY_ORDER_ONGEKI_NET.length) {
          singularityIndexes.forEach((musicIdx, orderIdx) => {
            allMusic[musicIdx].title = SINGULARITY_ORDER_ONGEKI_NET[orderIdx];
          });
        } else if (singularityIndexes.length > 0) {
          log('warn', `Singularityの数が想定外です (${singularityIndexes.length})`);
        }
      }
    }

    // allMusicをlevelでフィルタリング（配列に一致するもののみ）
    // const filter = ["15", "14+", "0"];
    // const filteredMusic = allMusic.filter(music => filter.includes(music.level));

    log('info', `全楽曲数: ${allMusic.length}`);
    log('info', '全楽曲取得処理完了');
    return allMusic;
  } catch (err) {
    log('error', `getAllMusic関数でエラー: ${err}`);
    console.error(err);
    throw err;
  }
}

/**
 * テクチャレ対象楽曲を取得する
 * @returns {Promise<{title: string; diff: string; level: string}[]>}
 * @throws {Error}
 */
export async function getTechFlag() {
  log('info', 'テクチャレ対象楽曲取得処理開始');

  try {
    const _t = _loginCookies?._t || '';
    const userId = _loginCookies?.userId || '';
    const friendCodeList = _loginCookies?.friendCodeList || '';
    const userAgent = _userAgent || 'Mozilla/5.0';

    const techMusicList: {
      title: string;
      diff: string;
      level: string;
    }[] = [];

    const eventlogUrl = 'https://ongeki-net.com/ongeki-mobile/record/eventlog/';
    const eventlogRes = await fetch(eventlogUrl, {
      headers: {
        'Cookie': `_t=${_t}; userId=${userId}; friendCodeList=${friendCodeList}`,
        'User-Agent': userAgent,
      },
    });
    const eventlogHtml = await eventlogRes.text();
    const $eventlog = cheerio.load(eventlogHtml);
    const pastEventIdxList: string[] = [];
    $eventlog('div.basic_btn.event_back.m_15.f_0').each((_, card) => {
      const form = $eventlog(card).find('form');
      const text = $eventlog(card).text();
      if (!form.length) return;
      if (!text.includes('テクニカルチャレンジ開催期間')) return;
      const idxInput = form.find('input[name="idx"]').val() as string || '';
      if (idxInput) pastEventIdxList.push(idxInput);
    });

    for (const idx of pastEventIdxList) {
      log('info', `過去イベントidx=${idx}の楽曲情報取得開始`);

      const url = `https://ongeki-net.com/ongeki-mobile/record/eventlogTech/?idx=${idx}`;
      const res = await fetch(url, {
        headers: {
          'Cookie': `_t=${_t}; userId=${userId}; friendCodeList=${friendCodeList}`,
          'User-Agent': userAgent,
        },
      });
      const html = await res.text();
      const $ = cheerio.load(html);
      const musicList: { title: string; diff: string; level: string }[] = [];
      $('div.basic_btn').each((_, node) => {
        let diff = '';
        if ($(node).hasClass('basic_score_back')) diff = 'BASIC';
        else if ($(node).hasClass('advanced_score_back')) diff = 'ADVANCED';
        else if ($(node).hasClass('expert_score_back')) diff = 'EXPERT';
        else if ($(node).hasClass('master_score_back')) diff = 'MASTER';
        else if ($(node).hasClass('lunatic_score_back')) diff = 'LUNATIC';
        else return;
        const title = $(node).find('.music_label').text().trim();
        const level = $(node).find('.score_level').text().trim();
        if (!title || !level) return;
        musicList.push({ title, diff, level });
      });

      const singularityIndexes = musicList
        .map((m, i) => (m.title === 'Singularity') ? i : -1)
        .filter(i => i !== -1);
      if (singularityIndexes.length === SINGULARITY_ORDER_TECHFLAG.length) {
        singularityIndexes.forEach((musicIdx, orderIdx) => {
          musicList[musicIdx].title = SINGULARITY_ORDER_TECHFLAG[orderIdx];
        });
      } else if (singularityIndexes.length > 0) {
        log('warn', `Singularityの数が想定外です (${singularityIndexes.length})`);
      }

      techMusicList.push(...musicList);

      if (musicList.length > 0) {
        musicList.forEach(music => {
          log('info', `${music.title} - ${music.diff} - ${music.level}`);
        });
      } else {
        log('info', '対象楽曲なし');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const eventUrl = 'https://ongeki-net.com/ongeki-mobile/event/';
    const eventRes = await fetch(eventUrl, {
      headers: {
        'Cookie': `_t=${_t}; userId=${userId}; friendCodeList=${friendCodeList}`,
        'User-Agent': userAgent,
      },
    });
    const eventHtml = await eventRes.text();
    const $event = cheerio.load(eventHtml);
    const currentEventIdxList: string[] = [];
    $event('div.basic_btn.event_back.m_15.f_0').each((_, card) => {
      const form = $event(card).find('form');
      const text = $event(card).text();
      if (!form.length) return;
      if (!text.includes('テクニカルチャレンジ開催期間')) return;
      const idxInput = form.find('input[name="idx"]').val() as string || '';
      if (idxInput) currentEventIdxList.push(idxInput);
    });

    for (const idx of currentEventIdxList) {
      log('info', `現行イベントidx=${idx}の楽曲情報取得開始`);

      const url = `https://ongeki-net.com/ongeki-mobile/event/techChallenge/?idx=${idx}`;
      const res = await fetch(url, {
        headers: {
          'Cookie': `_t=${_t}; userId=${userId}; friendCodeList=${friendCodeList}`,
          'User-Agent': userAgent,
        },
      });
      const html = await res.text();
      const $ = cheerio.load(html);

      const musicList: {
        title: string;
        diff: string;
        level: string
      }[] = [];

      $('div.basic_btn').each((_, node) => {
        let diff = '';
        if ($(node).hasClass('basic_score_back')) diff = 'BASIC';
        else if ($(node).hasClass('advanced_score_back')) diff = 'ADVANCED';
        else if ($(node).hasClass('expert_score_back')) diff = 'EXPERT';
        else if ($(node).hasClass('master_score_back')) diff = 'MASTER';
        else if ($(node).hasClass('lunatic_score_back')) diff = 'LUNATIC';
        else return;
        const title = $(node).find('.music_label').text().trim();
        const level = $(node).find('.score_level').text().trim();
        if (!title || !level) return;
        musicList.push({ title, diff, level });
      });

      if (musicList.length > 0) {
        musicList.forEach(music => {
          log('info', `${music.title} - ${music.diff} - ${music.level}`);
        });
      } else {
        log('info', '対象楽曲なし');
      }
      
      techMusicList.push(...musicList);

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    log('info', `テクチャレ対象楽曲数: ${techMusicList.length}`);
    log('info', 'テクチャレ対象楽曲取得処理完了');
    return techMusicList;
  } catch (err) {
    log('error', `getTechFlag関数でエラー: ${err}`);
    console.error(err);
    throw err;
  }
}

/**
 * 譜面定数情報一覧を取得する
 * @returns {Promise<{
 *  title: string;
 *  diff: string;
 *  level: string;
 *  chartConst: number;
 *  ps5Rating: number;
 *  ps4Rating: number;
 *  ps3Rating: number;
 *  ps2Rating: number;
 *  ps1Rating: number;
 * }[]>}
 * @throws {Error}
 */
export async function getChartConstList() {
  log('info', '譜面定数情報一覧取得処理開始');

  try {
    const url = 'https://ongeki-score.net/music';
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    const chartConstList: {
      title: string;
      diff: string;
      level: string;
      chartConst: number;
      ps5Rating: number;
      ps4Rating: number;
      ps3Rating: number;
      ps2Rating: number;
      ps1Rating: number;
    }[] = [];

    $('table tbody tr').each((_, row) => {
      const tds = $(row).find('td');
      const title = tds.eq(0).find('span.sort-key').text().trim() || '';
      const diff = (tds.eq(1).text().trim() || '').toUpperCase();
      const level = tds.eq(2).text().trim() || '';
      const chartConstStr = tds.eq(4).text().trim() || '';
      const chartConstValue = Number(chartConstStr);
      const ps5Rating = Math.round((chartConstValue * chartConstValue * 5 / 1000) * 1000) / 1000;
      const ps4Rating = Math.round((chartConstValue * chartConstValue * 4 / 1000) * 1000) / 1000;
      const ps3Rating = Math.round((chartConstValue * chartConstValue * 3 / 1000) * 1000) / 1000;
      const ps2Rating = Math.round((chartConstValue * chartConstValue * 2 / 1000) * 1000) / 1000;
      const ps1Rating = Math.round((chartConstValue * chartConstValue * 1 / 1000) * 1000) / 1000;
      chartConstList.push({ title, diff, level, chartConst: chartConstValue, ps5Rating, ps4Rating, ps3Rating, ps2Rating, ps1Rating });
    });

    const singularityIndexes = chartConstList
      .map((m, i) => (m.title === 'Singularity') ? i : -1)
      .filter(i => i !== -1);
    if (singularityIndexes.length === SINGULARITY_ORDER_CHARTCONST.length) {
      singularityIndexes.forEach((musicIdx, orderIdx) => {
        chartConstList[musicIdx].title = SINGULARITY_ORDER_CHARTCONST[orderIdx];
        log('info', `Singularity楽曲名変更: index=${musicIdx} title=${chartConstList[musicIdx].title} chartConst=${chartConstList[musicIdx].chartConst}`);  
      });
    } else if (singularityIndexes.length > 0) {
      log('warn', `Singularityの数が想定外です (${singularityIndexes.length})`);
    }

    log('info', `譜面定数情報数: ${chartConstList.length}`);
    log('info', '譜面定数情報一覧取得処理完了');
    return chartConstList;
  } catch (err) {
    log('error', `getChartConstList関数でエラー: ${err}`);
    console.error(err);
    throw err;
  }
}

/**
 * ランキング詳細ページからランキングデータを取得する
 * @param {{title: string; level: string; diff: string; diffNum: string; idx: string;}[]} musicList
 * @returns {Promise<{
 *  title: string;
 *  level: string;
 *  diff: string;
 *  tsTheoryCounts: number[];
 *  psTheoryScore: number;
 *  ps5RainbowCount: number;
 *  ps5Count: number;
 *  ps4Count: number;
 *  ps3Count: number;
 *  ps2Count: number;
 *  ps1Count: number;
 *  psTheoryCount: number;
 *  ps5Tolerance: number;
 *  ps5MinScore: number;
 * }[]>}
 */
export async function getRankingData(musicList: {title: string; level: string; diff: string; diffNum: string; idx: string;}[]) {
  log('info', 'ランキングデータ取得処理開始');

  const results: any[] = [];
  let lastIndex = 0;
  let retryCount = 0;
  const maxRetry = 50;
  const BATCH_SIZE = 3;

  while (lastIndex < musicList.length) {
    try {
      if (!_loginCookies) {
        throw new Error('not logged in');
      }

      const _t = _loginCookies._t || '';
      const userId = _loginCookies.userId || '';
      const friendCodeList = _loginCookies.friendCodeList || '';
      const userAgent = _userAgent || 'Mozilla/5.0';

      while (lastIndex < musicList.length) {
        const batch = musicList.slice(lastIndex, lastIndex + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(async (music, batchIdx) => {
          const { idx, diffNum, title, level, diff } = music;
          // TSページ
          let tsTheoryCounts: number[] = [];
          try {
            const tsUrl = `https://ongeki-net.com/ongeki-mobile/ranking/musicRankingDetail/?idx=${idx}&scoreType=2&rankingType=99&diff=${diffNum}`;
            const tsRes = await fetch(tsUrl, {
              headers: {
                'Cookie': `_t=${_t}; userId=${userId}; friendCodeList=${friendCodeList}`,
                'User-Agent': userAgent,
              },
            });
            const tsHtml = await tsRes.text();
            const $ts = cheerio.load(tsHtml);
            tsTheoryCounts = [];
            $ts('table.music_detail_ranking_inner_table table tbody tr').each((_, tr) => {
              const theoryBlock = $ts(tr).find('.theory_block .theory_text_block');
              if (theoryBlock.length) {
                const nums = theoryBlock.text().split(/\s+|,/).map(s => Number(s)).filter(n => !isNaN(n) && n >= 10);
                tsTheoryCounts.push(...nums);
              }
            });
          } catch (err) {
            log('warning', `TSページ取得失敗: ${title} (${diff} ${level}) ${err}`);
          }

          // PSページ
          let psTheoryScore = 0;
          let psRankingRows: { star: number; rainbow: boolean; score: number|null }[] = [];
          try {
            const psUrl = `https://ongeki-net.com/ongeki-mobile/ranking/musicRankingDetail/?idx=${idx}&scoreType=5&rankingType=99&diff=${diffNum}`;
            const psRes = await fetch(psUrl, {
              headers: {
                'Cookie': `_t=${_t}; userId=${userId}; friendCodeList=${friendCodeList}`,
                'User-Agent': userAgent,
              },
            });
            const psHtml = await psRes.text();
            const $ps = cheerio.load(psHtml);
            const psDiv = $ps(`div.border_block.${diff.toLowerCase()}_score_back.m_15.p_5.t_l`);
            const psText = psDiv.find('.platinum_score_text_block').text();
            const m = psText.match(/([\d,]+)\s*$/);
            psTheoryScore = m ? Number(m[1].replace(/,/g, '')) : 0;

            psRankingRows = [];
            $ps('table.music_ranking_inner_table table tbody tr').each((_, tr) => {
              let star = 0;
              let rainbow = false;
              const $tr = $ps(tr);
              const starR = $tr.find('.platinum_score_star_r_block');
              const starN = $tr.find('.platinum_score_star_block');
              if (starR.length) {
                star = Number(starR.text().replace(/[^\d]/g, ''));
                rainbow = true;
              } else if (starN.length) {
                star = Number(starN.text().replace(/[^\d]/g, ''));
              }
              const scoreBlock = $tr.find('.platinum_score_text_block');
              let score: number|null = null;
              if (scoreBlock.length) {
                score = Number((scoreBlock.text() || '').replace(/[^\d]/g, ''));
              }
              psRankingRows.push({ star, rainbow, score });
            });
          } catch (err) {
            log('warning', `PSページ取得失敗: ${title} (${diff} ${level}) ${err}`);
          }

          let ps5RainbowCount = 0, ps5Count = 0, ps4Count = 0, ps3Count = 0, ps2Count = 0, ps1Count = 0, psTheoryCount = 0;
          for (const row of psRankingRows) {
            if (row.rainbow && row.star === 5) ps5RainbowCount++;
            else if (row.star === 5) ps5Count++;
            else if (row.star === 4) ps4Count++;
            else if (row.star === 3) ps3Count++;
            else if (row.star === 2) ps2Count++;
            else if (row.star === 1) ps1Count++;
            if (psTheoryScore && row.score === psTheoryScore) psTheoryCount++;
          }

          const ps5Tolerance = psTheoryScore ? Math.floor(psTheoryScore * 0.02) : 0;
          const ps5MinScore = psTheoryScore ? psTheoryScore - ps5Tolerance : 0;

          log('info', ` [${lastIndex + batchIdx + 1}] ${title} (${diff} ${level}) | TS理: [${tsTheoryCounts.join(', ')}] | PS理: ${psTheoryScore} | PS数: [${ps5RainbowCount}, ${ps5Count}, ${ps4Count}, ${ps3Count}, ${ps2Count}, ${ps1Count}] | PS理数: ${psTheoryCount}`);

          if (psTheoryScore === 0) {
            log('error', `PS理論値が0のため処理中断: ${title} (${diff} ${level})`);
            throw new Error('RELOGIN_REQUIRED');
          }

          const psTotalCount = ps5RainbowCount + ps5Count + ps4Count + ps3Count + ps2Count + ps1Count;
          if (psTotalCount >= 101) {
            log('warn', `PS数の合計が101以上です: ${title} (${diff} ${level}) 合計=${psTotalCount}`);
          }

          return {
            title,
            level,
            diff,
            tsTheoryCounts,
            psTheoryScore,
            ps5RainbowCount,
            ps5Count,
            ps4Count,
            ps3Count,
            ps2Count,
            ps1Count,
            psTheoryCount,
            ps5Tolerance,
            ps5MinScore,
          };
        }));

        batchResults.sort((a, b) => {
          const aIndex = musicList.findIndex(m => m.title === a.title && m.level === a.level && m.diff === a.diff);
          const bIndex = musicList.findIndex(m => m.title === b.title && m.level === b.level && m.diff === b.diff);
          return aIndex - bIndex;
        });

        for (const result of batchResults) {
          results.push(result);
        }
        lastIndex += batch.length;
        await new Promise(res => setTimeout(res, 1000));
      }
      break;
    } catch (err) {
      retryCount++;
      log('warn', `エラー発生。リトライ ${retryCount}/${maxRetry} (lastIndex=${lastIndex}) ${err}`);
      if (retryCount > maxRetry) {
        console.error(`error: 最大リトライ回数超過。処理中断 (lastIndex=${lastIndex})`);
        throw err;
      }
      try {
        await login();
      } catch (loginErr) {
        throw loginErr;
      }
    }
  }

  log('info', 'ランキングデータ取得処理完了');
  return results;
}