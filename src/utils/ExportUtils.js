function triggerDownload(blob, filename) {
  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(blobUrl)
}

function parseSvgSize(svgNode) {
  const viewBox = svgNode.getAttribute('viewBox')
  if (viewBox) {
    const [, , width, height] = viewBox.split(/\s+/).map(Number)
    if (Number.isFinite(width) && Number.isFinite(height)) {
      return { width, height }
    }
  }

  const width = svgNode.clientWidth || Number(svgNode.getAttribute('width')) || 1200
  const height = svgNode.clientHeight || Number(svgNode.getAttribute('height')) || 800
  return { width, height }
}

function getSvgNode(containerOrSvg) {
  if (!containerOrSvg) {
    return null
  }

  if (containerOrSvg instanceof SVGSVGElement) {
    return containerOrSvg
  }

  return containerOrSvg.querySelector('svg')
}

function serializeSvg(svgNode) {
  const cloned = svgNode.cloneNode(true)
  const { width, height } = parseSvgSize(svgNode)

  cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  cloned.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  cloned.setAttribute('width', String(width))
  cloned.setAttribute('height', String(height))

  if (!cloned.getAttribute('viewBox')) {
    cloned.setAttribute('viewBox', `0 0 ${width} ${height}`)
  }

  return {
    svgText: new XMLSerializer().serializeToString(cloned),
    width,
    height,
  }
}

export function exportDiagramAsSvg(containerOrSvg, filename = 'diagram.svg') {
  const svgNode = getSvgNode(containerOrSvg)
  if (!svgNode) {
    throw new Error('No SVG diagram found to export.')
  }

  const { svgText } = serializeSvg(svgNode)
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
  triggerDownload(blob, filename.endsWith('.svg') ? filename : `${filename}.svg`)
}

export async function exportDiagramAsPng(containerOrSvg, filename = 'diagram.png') {
  const svgNode = getSvgNode(containerOrSvg)
  if (!svgNode) {
    throw new Error('No SVG diagram found to export.')
  }

  const { svgText, width, height } = serializeSvg(svgNode)
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to convert SVG to PNG.'))
      img.src = svgUrl
    })

    const scale = Math.max(window.devicePixelRatio || 1, 2)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Cannot access canvas context for PNG export.')
    }

    context.scale(scale, scale)
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)

    const pngBlob = await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('PNG export failed.'))
        }
      }, 'image/png')
    })

    triggerDownload(
      pngBlob,
      filename.endsWith('.png') ? filename : `${filename}.png`,
    )
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}
