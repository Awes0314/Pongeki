"use client";

import React from "react";
import Link from "next/link";
import styles from "./Header.module.css";
import { useHeaderLogic } from "@/components/Header/useHeaderLogic";

/**
 * メニューリンク一覧
 */
const menuLinks = [
  { href: "/", label: "トップページ" },
  { href: "/database", label: "☆獲得人数一覧" },
  { href: "/recommend", label: "Pスコア枠おすすめ曲選出" },
  { href: "/ranking", label: "理論値ランキング" },
  { href: "/map", label: "アドベンチャーマップ" },
  { href: "/map/exp", label: "アドベンチャーマップ NEW" },
  { href: "/about", label: "このサイトについて" },
];

/**
 * Headerコンポーネント
 * @returns {JSX.Element} ヘッダ―コンポーネント 
 */
const Header: React.FC = () => {
  const {
    open,
    scrolled,
    menuVisible,
    menuRef,
    buttonRef,
    handleMenuBtnClick,
  } = useHeaderLogic();

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}>
      <Link
        href="/"
        aria-label="ホーム"
        className={`${styles.logoLink} ${scrolled ? styles.logoLinkScrolled : ""}`}
      >
        <img
          src="/favicon.ico"
          alt="Pongeki Logo"
          className={styles.logoImage}
        />
      </Link>
      <button
        ref={buttonRef}
        className={`${styles.menuBtn} ${scrolled ? styles.menuBtnScrolled : ""} ${open ? styles.menuBtnOpen : ""}`}
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={open}
        onClick={handleMenuBtnClick}
        type="button"
      >
        <span className={`${styles.menuIcon} ${open ? styles.menuIconOpen : ""} ${scrolled || open ? styles.menuIconScrolled : ""}`}>
          <span />
          <span />
          <span />
        </span>
      </button>
      <div
        ref={menuRef}
        className={`${styles.spMenu} ${open ? styles.spMenuOpen : ""} ${menuVisible ? styles.spMenuVisible : ""}`}
        tabIndex={-1}
        aria-hidden={!open}
      >
        <nav className={styles.spMenuNav}>
          {menuLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.spMenuLink}
              onClick={() => handleMenuBtnClick()}
              style={{ cursor: "pointer" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
