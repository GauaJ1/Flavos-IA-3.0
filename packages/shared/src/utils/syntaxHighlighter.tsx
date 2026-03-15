import React from 'react';

// Dracula Theme Colors
export const dracula = {
  bg: '#282a36',
  header: '#21222c',
  fg: '#f8f8f2',
  keyword: '#ff79c6',  // pink
  string: '#f1fa8c',   // yellow
  func: '#50fa7b',     // green
  number: '#bd93f9',   // purple
  comment: '#6272a4',  // slate
  operator: '#ff79c6', // pink
  property: '#8be9fd', // cyan
};

const keywordList = [
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'import', 'export', 'default', 'from', 'class', 'extends', 'implements',
  'async', 'await', 'switch', 'case', 'break', 'continue', 'interface', 'type',
  'new', 'this', 'true', 'false', 'null', 'undefined', 'def', 'pass', 'try', 'catch', 'finally'
];

export const getFileExtension = (lang: string) => {
  const map: Record<string, string> = {
    javascript: 'js', typescript: 'ts', python: 'py', 
    ruby: 'rb', rust: 'rs', golang: 'go', go: 'go',
    csharp: 'cs', cpp: 'cpp', 'c++': 'cpp',
    shell: 'sh', bash: 'sh', 'objective-c': 'm',
    swift: 'swift', kotlin: 'kt', java: 'java',
    json: 'json', html: 'html', css: 'css',
    markdown: 'md', yaml: 'yml', xml: 'xml', sql: 'sql',
    jsx: 'jsx', tsx: 'tsx', php: 'php', perl: 'pl'
  };
  return map[lang.toLowerCase()] || lang || 'txt';
};

/**
 * Super lightweight Regex-based Syntax Highlighter.
 * Zero dependencies, works on React Web (span) and React Native (Text).
 */
export function highlightCode(code: string, TextComponent: any) {
  // Regex that tokenizes: comments | strings | functions | keywords | numbers | properties | operators | words | whitespace
  const regex = /(\/\/.*|\/\*[\s\S]*?\*\/|#.*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b[a-zA-Z_]\w*(?=\s*\())|(\b(?:const|let|var|function|return|if|else|for|while|import|export|default|from|class|extends|implements|async|await|switch|case|break|continue|interface|type|new|this|true|false|null|undefined|def|pass|try|catch|finally)\b)|(\b\d+\.?\d*\b)|(\b[a-zA-Z_]\w*(?=\s*:))|([\{\}\(\)\[\]\.,;:\+\-\*\/=><!&\|]+)|(\s+)|([a-zA-Z_]\w*)/g;

  const elements: React.ReactNode[] = [];
  let key = 0;
  let lastIndex = 0;

  code.replace(
    regex,
    (match, comment, string, func, keyword, number, property, operator, space, word, offset) => {
      // Catch any unparsed text between matches
      if (offset > lastIndex) {
        elements.push(<TextComponent key={key++} style={{ color: dracula.fg }}>{code.slice(lastIndex, offset)}</TextComponent>);
      }
      lastIndex = offset + match.length;

      let color = dracula.fg;
      if (comment) color = dracula.comment;
      else if (string) color = dracula.string;
      else if (func) color = dracula.func;
      else if (keyword) color = dracula.keyword;
      else if (number) color = dracula.number;
      else if (property) color = dracula.property;
      else if (operator) color = dracula.operator;

      elements.push(<TextComponent key={key++} style={{ color }}>{match}</TextComponent>);
      return match;
    }
  );

  if (lastIndex < code.length) {
    elements.push(<TextComponent key={key++} style={{ color: dracula.fg }}>{code.slice(lastIndex)}</TextComponent>);
  }

  return elements;
}
