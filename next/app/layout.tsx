import "./styles/globals.css";
import HeadMeta from "@/components/HeadMeta/HeadMeta";
import styles from "./layout.module.css";

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <html lang="ja">
      <HeadMeta />
      <body>
        <main className={styles.main}>
          {children}
        </main>
      </body>
    </html>
  );
};

export default RootLayout;
