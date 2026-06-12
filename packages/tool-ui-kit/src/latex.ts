/** Tiny LaTeX tokenizer + preview parser — no heavyweight highlighter deps. */

export type LatexToken = { type: 'command' | 'brace' | 'comment' | 'math' | 'text'; text: string }

/** Tokenize LaTeX source for syntax highlighting. */
export const tokenizeLatex = (src: string): LatexToken[] => {
  const tokens: LatexToken[] = []
  const re = /(%[^\n]*)|(\\[a-zA-Z@]+\*?)|(\$[^$]*\$)|([{}[\]])|([^\\%{}$[\]]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    if (m[1]) tokens.push({ type: 'comment', text: m[1] })
    else if (m[2]) tokens.push({ type: 'command', text: m[2] })
    else if (m[3]) tokens.push({ type: 'math', text: m[3] })
    else if (m[4]) tokens.push({ type: 'brace', text: m[4] })
    else if (m[5]) tokens.push({ type: 'text', text: m[5] })
  }
  return tokens
}

export type LatexPreview = {
  title: string | null
  sections: { heading: string; items: string[]; paragraphs: string[] }[]
}

/** Strip inline LaTeX commands down to readable text. */
const detex = (s: string): string =>
  s
    .replace(/\\textbf\{([^}]*)\}/g, '$1')
    .replace(/\\textit\{([^}]*)\}/g, '$1')
    .replace(/\\emph\{([^}]*)\}/g, '$1')
    .replace(/\\textbullet\{?\}?/g, '•')
    .replace(/\\[a-zA-Z@]+\*?(\[[^\]]*\])?(\{[^}]*\})?/g, '')
    .replace(/[{}]/g, '')
    .replace(/\\([&%$#_])/g, '$1')
    .replace(/---?/g, '—')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Naive structural parse of a LaTeX resume into a paper-preview model:
 * sections by \section, bullets by \item, the rest as paragraphs.
 * A typeset approximation — Overleaf does the real compile.
 */
export const parseLatexPreview = (src: string): LatexPreview => {
  const body = src.split(/\\begin\{document\}/)[1]?.split(/\\end\{document\}/)[0] ?? src
  const titleMatch = body.match(/\\(?:LARGE|Huge|huge)[^{]*\{?\\?textbf\{([^}]*)\}/) ?? body.match(/\\textbf\{([^}]*)\}/)
  const title = titleMatch ? detex(titleMatch[1] ?? '') : null

  const sections: LatexPreview['sections'] = []
  const parts = body.split(/\\section\*?\{([^}]*)\}/)
  // parts: [preamble, heading1, content1, heading2, content2, …]
  for (let i = 1; i < parts.length; i += 2) {
    const heading = detex(parts[i] ?? '')
    const content = parts[i + 1] ?? ''
    const items = [...content.matchAll(/\\item\s+([\s\S]*?)(?=\\item|\\end\{itemize\}|$)/g)].map((m) => detex(m[1] ?? '')).filter(Boolean)
    const paragraphs = content
      .replace(/\\begin\{itemize\}[\s\S]*?\\end\{itemize\}/g, '')
      .split(/\n{2,}/)
      .map(detex)
      .filter((p) => p.length > 1)
    sections.push({ heading, items, paragraphs })
  }
  return { title, sections }
}
