"use client";
import { useState, useEffect, useRef } from 'react';

const useHeaderLogic = () => {
	const [scrolled, setScrolled] = useState(false);
	const [open, setOpen] = useState(false);
	const [menuVisible, setMenuVisible] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	/**
	 * ページ最上部でない場合にscrolledをtrueに設定
	 * @returns {void}
	 */
	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 0);
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	/**
	 * メニュー・ボタン外クリック時にメニュー閉鎖
	 * @returns {void}
	 */
	useEffect(() => {
		if (!open) return;
		const handleClick = (e: MouseEvent) => {
			const target = e.target as Node;
			if (
				menuRef.current &&
				!menuRef.current.contains(target) &&
				buttonRef.current &&
				!buttonRef.current.contains(target)
			) {
				if (menuRef.current) {
					menuRef.current.classList.add('spMenuClosing');
				}
				setOpen(false);
				setTimeout(() => {
					if (menuRef.current) {
						menuRef.current.classList.remove('spMenuClosing');
					}
				}, 300);
			}
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [open]);

	/**
	 * メニュー表示時にbodyのスクロールを無効化
	 * @returns {void}
	 */
	useEffect(() => {
		if (open) {
			setMenuVisible(true);
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
			const timer = setTimeout(() => setMenuVisible(false), 300);
			return () => clearTimeout(timer);
		}
	}, [open]);

	/**
	 * メニューボタンクリック処理
	 * @returns {void}
	 */
	const handleMenuBtnClick = () => {
		if (open) {
			if (menuRef.current) {
				menuRef.current.classList.add('spMenuClosing');
			}
			setOpen(false);
			setTimeout(() => {
				if (menuRef.current) {
					menuRef.current.classList.remove('spMenuClosing');
				}
			}, 300);
		} else {
			setMenuVisible(true);
			setTimeout(() => setOpen(true), 10);
		}
	};

	return {
		open,
		scrolled,
		menuVisible,
		menuRef,
		buttonRef,
		handleMenuBtnClick,
	};
};

export { useHeaderLogic };