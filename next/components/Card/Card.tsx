import React from 'react';
import styles from './Card.module.css';
import Link from 'next/link';

type CardProps = {
	href: string;
	hasImage?: boolean;
	imagePath?: string;
	title: string;
	description?: string;
};

/**
 * Cardコンポーネント
 * @param {string} href - カードのリンク先URL
 * @param {boolean} [hasImage] - 画像の有無
 * @param {string} [imagePath] - 画像のパス
 * @param {string} title - タイトルテキスト
 * @param {string} [description] - 説明テキスト
 * @returns {JSX.Element} カードコンポーネント
 */
const Card: React.FC<CardProps> = ({ href, hasImage, imagePath, title, description }) => {
	return (
		<Link className={styles.container} href={href}>
			{hasImage ? (
				<div className={styles.contentWithImage}>
					<div className={styles.textArea}>
						<div className={styles.titleBlue}>{title}</div>
						<div className={styles.description}>{description}</div>
					</div>
					<div className={styles.imageArea}>
						<img src={imagePath} alt={title} className={styles.image} />
					</div>
				</div>
			) : (
				<div className={styles.contentNoImage}>
					<div className={styles.titleDark}>{title}</div>
				</div>
			)}
		</Link>
	);
};

export default Card;