import React from 'react';
import styles from './Title.module.css';

type TitleProps = {
  title: string;
  description?: string;
};

/**
 * Titleコンポーネント
 * @param {string} title - タイトルテキスト
 * @param {string} [description] - 説明テキスト（オプション）
 * @returns {JSX.Element} タイトルコンポーネント
 */
const Title: React.FC<TitleProps> = ({ title, description }) => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
};

export default Title;