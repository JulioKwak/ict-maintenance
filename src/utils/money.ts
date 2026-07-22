// 직접경비 입력값(숫자만 저장) ↔ 화면 표시(천단위 쉼표) 변환
export const onlyDigits = (v: string) => v.replace(/[^\d]/g, '')
export const toMoneyDisplay = (v: string) => (v ? Number(v).toLocaleString('ko-KR') : '')
