import Title from "@/components/Title/Title";
import Card from "@/components/Card/Card";
import styles from "./page.module.css";

const Home = () => {
  return (
    <>
      <Title
        title="Pongeki"
        description="オンゲキ Pスコア情報管理サイト"
      />
      <div className={styles.cardContainer}>
        <Card
          href="/database"
          hasImage={true}
          imagePath="/index/index_database.png"
          title="☆獲得人数一覧"
          description="各楽曲の☆獲得人数を一覧で確認できます。"
        />
        <Card
          href="/recommend"
          hasImage={true}
          imagePath="/index/index_recommend.png"
          title="Pスコア枠おすすめ曲選出"
          description="Pスコア枠におすすめの楽曲を自動で選出します。"
        />
        <Card
          href="/ranking"
          hasImage={true}
          imagePath="/index/index_ranking.png"
          title="理論値ランキング"
          description="楽曲ごとの理論値ランキングを確認できます。"
        />
        <Card
          href="/map"
          hasImage={true}
          imagePath="/index/index_map.png"
          title="アドベンチャーマップ"
          description="オンゲキアドベンチャーマップの情報を確認できます。"
        />
      </div>
      <div className={styles.aboutContainer}>
        <Card
          href="/about"
          hasImage={false}
          title="このサイトについて"
        />
      </div>
    </>
  );
};

export default Home;
