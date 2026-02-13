const PERSIAN_RANGE = /[\u0600-\u06FF]/

export function containsPersian(value = '') {
  return PERSIAN_RANGE.test(value)
}

export function getSvgTextDirection(value = '') {
  return containsPersian(value) ? 'rtl' : 'ltr'
}

export function getSvgTextAnchor(value = '', fallback = 'start') {
  if (containsPersian(value)) {
    return fallback === 'start' ? 'end' : fallback
  }
  return fallback
}
