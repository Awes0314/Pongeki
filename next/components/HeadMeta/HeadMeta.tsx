import Script from "next/script";
import { JSX } from "react";

type HeadMetaProps = {
  title?: string;
  description?: string;
  imagePath?: string;
};

/**
 * HeadMetaコンポーネント
 * @param {HeadMetaProps} props
 * @returns {JSX.Element}
 */
const HeadMeta = ({ title, description, imagePath }: HeadMetaProps): JSX.Element => {
  const baseUrl = "https://pongeki.awes.jp";
  const defaultTitle = "Pongeki オンゲキ Pスコア情報管理サイト";
  const defaultDescription = "Pongekiは、オンゲキ（O.N.G.E.K.I.）のPスコア・理論値・☆獲得人数などのランキングやおすすめ楽曲選出など、プレイヤーのための集計・分析情報を提供する非公式ファンサイトです。オンゲキの楽曲別データベースや自動おすすめ機能も搭載。データはオンゲキ-NETやOngekiScoreLog等の公開情報を元にしています。";
  const defaultImagePath = "/og-image.png";
  
  // 画像パスを絶対URLに変換
  const fullImageUrl = imagePath 
    ? (imagePath.startsWith('http') ? imagePath : `${baseUrl}${imagePath}`)
    : `${baseUrl}${defaultImagePath}`;
  return (
    <>
      <title>{title || defaultTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      <meta property="og:title" content={title || defaultTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content="https://pongeki.awes.jp/" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title || defaultTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={fullImageUrl} />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/favicon.ico" />
      <link rel="canonical" href="https://pongeki.awes.jp/" />
      {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-TFCKF21GWZ"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-TFCKF21GWZ', { page_path: window.location.pathname });
          `}
        </Script>
    </>
  );
}

export default HeadMeta;