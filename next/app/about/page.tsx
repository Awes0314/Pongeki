"use client";

import style from "./page.module.css";
import Title from "@/components/Title/Title";
import Header from "@/components/Header/Header";
import HeaderMeta from "@/components/HeadMeta/HeadMeta";
import { useAboutLogic } from "./useAboutLogic";

const AboutPage = () => {
	const logic = useAboutLogic();
  return (
    <>
      <HeaderMeta
        title="このサイトについて - Pongeki"
        description="オンゲキ（O.N.G.E.K.I.）に関する楽曲別ランキング集計情報を提供するファンメイドの情報サイトです。サイトの概要や使用データ、運営方針などについて説明しています。"
      />
			<Header/>
			<Title
				title="このサイトについて"
			/>
			<div className={style.container}>
				<ul className={style.toc}>
					<li><a href="#overview" className={style.tocLink}>サイトの概要</a></li>
					<li><a href="#data" className={style.tocLink}>使用しているデータについて</a></li>
					<li><a href="#operation" className={style.tocLink}>運営について</a></li>
					<li><a href="#copyright" className={style.tocLink}>著作権について</a></li>
					<li><a href="#contact" className={style.tocLink}>お問い合わせ</a></li>
				</ul>
				<div className={style.content} id="overview">
					<h2 className={style.heading}>サイトの概要</h2>
					<p className={style.paragraph}>
						本サイトは、セガ フェイブ開発・運営の音楽ゲーム「オンゲキ（O.N.G.E.K.I.）」に関する楽曲別ランキング集計情報を提供するファンメイドの情報サイトです。<br />
						プレイヤーの参考となるよう、一覧化したデータベース表示、おすすめ楽曲の自動選出機能などを備えています。
					</p>
					<p className={style.paragraph}>
            今後もオンゲキを楽しむプレイヤーの皆さまにとって便利な情報サイトを目指して、個人の趣味としてゆるやかに更新を続けていく予定です。
          </p>
				</div>
				<div className={style.content} id="data">
					<h2 className={style.heading}>使用しているデータについて</h2>
					<p className={style.paragraph}>
						以下の公開情報やサイト様のデータをもとに構成しています（敬称略・順不同）：
					</p>
					<ul className={style.list}>
            <li>オンゲキ-NET（楽曲情報・難易度・全国ランキング など）</li>
            <li>OngekiScoreLog（各プレイヤーのスコア・定数情報 など）</li>
            <li>オンゲキ譜面定数部（譜面定数・難易度 など）</li>
          </ul>
					<p className={style.paragraph}>
            データの取得や整形は自動化処理によって行っており、リアルタイムでの更新には対応していません。<br />
            また、誤情報や不足が含まれる可能性もあるため、あくまで参考情報としてご利用ください。<br />
            オンゲキアドベンチャー等の新規解禁曲は、サイト運営者の進行度依存となるため、集計が遅れる場合があります。
          </p>
				</div>
				<div className={style.content} id="operation">
					<h2 className={style.heading}>運営について</h2>
					<p className={style.paragraph}>
						本サイトはオンゲキプレイヤーによる非公式・個人運営のサイトです。<br />
            SEGA様などの公式運営会社様とは一切関係ありません。
					</p>
					<p className={style.paragraph}>
						掲載している情報・数値・表現は、公開データを元に個人が整形・集計・加工したものであり、<br />
            ゲームの仕様変更や情報更新により、実際の内容と異なる場合があります。
					</p>
				</div>
				<div className={style.content} id="copyright">
					<h2 className={style.heading}>著作権について</h2>
					<p className={style.paragraph}>
						本サイトで使用している文言やデータの一部は、公式サイトや各種情報サイト様の公開情報を元に構成しています。<br />
            ただし、画像や音声などの著作権保護対象となる素材は一切使用しておりません。<br />
            また、引用元や参考元がある場合は、できる限り明記するよう努めています。
					</p>
					<p className={style.paragraph}>
						万が一掲載内容に問題がある場合や、修正・削除のご要望がある際は、下記の連絡先までご連絡ください。
					</p>
				</div>
				<div className={style.content} id="contact">
					<h2 className={style.heading}>お問い合わせ</h2>
					<p className={style.paragraph}>
						サイト運営に関するご意見・ご質問・修正依頼などは、以下のXアカウントのDMまたはリプライにてご連絡ください。
					</p>
					<p className={style.paragraph}>
            管理人 Xアカウント : {" "}
            <a
              href="https://twitter.com/Extra_Awes"
              target="_blank"
              rel="noopener noreferrer"
							className={style.link}
            >
              @Extra_Awes
            </a>
          </p>
				</div>
			</div>
    </>
  );
};

export default AboutPage;