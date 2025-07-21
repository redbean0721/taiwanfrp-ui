let privacyIconRef = null

export function goTerms() {
	window.location.href = '/terms'
}

export function updatePrivacyIconPosition() {
	if (!privacyIconRef?.value) return
    const icon = privacyIconRef.value
	const { scrollX = 0, scrollY = 0 } = window
	const { innerWidth: w, innerHeight: h } = window

	const iconWidth = Number(import.meta.env.VITE_ICON_WIDTH) || 56
	const iconHeight = Number(import.meta.env.VITE_ICON_HEIGH) || 56
	const marginRight = Number(import.meta.env.VITE_MARGIN_RIGHT) || 24
	const marginBottom = Number(import.meta.env.VITE_MARGIN_BOTTOM) || 80

	const top = Math.max(scrollY + h - iconHeight - marginBottom, 0)
	const left = Math.max(scrollX + w - iconWidth - marginRight, 0)
	// 確保圖標不會超出視窗邊界
	// 這裡的 Math.max 確保圖標不會超出視窗邊界
	// 如果計算出來的 top 或 left 小於 0，就將其設置為 0
	// 這樣可以確保圖標始終在視窗內部顯示

	icon.style.position = 'absolute'
	icon.style.top = top + 'px'
	icon.style.left = left + 'px'
}

export function initPrivacyIcon(ref) {
    privacyIconRef = ref
    updatePrivacyIconPosition()
    window.addEventListener('scroll', updatePrivacyIconPosition)
    window.addEventListener('resize', updatePrivacyIconPosition)
}

export function destroyPrivacyIcon() {
    window.removeEventListener('scroll', updatePrivacyIconPosition)
    window.removeEventListener('resize', updatePrivacyIconPosition)
    privacyIconRef = null
}
