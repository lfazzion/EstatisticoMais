import React from 'react';
import { View, StyleSheet } from 'react-native';
import MathJax from 'react-native-mathjax-svg';
import Markdown from 'react-native-markdown-display';

interface MixedTextProps {
  content: string;
  style?: any;
}

export default function MixedText({ content, style }: MixedTextProps) {
  if (!content) return null;

  // Função para limpar delimitadores extras
  const cleanMathExpression = (expr: string) => {
    return expr
      .replace(/\\n/g, '') // Remove \n
      .replace(/\\\(/g, '') // Remove \(
      .replace(/\\\)/g, '') // Remove \)
      .trim();
  };

  // Dividir por expressões matemáticas, incluindo aquelas com \n
  const parts = content.split(/(\\n?\\\([^\\]*\\\)\\n?|\$\$[^$]*\$\$)/);

  const elements = parts.map((part, index) => {
    // Verifica se é uma expressão matemática display ($$...$$)
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const math = part.slice(2, -2).trim();
      return (
        <View key={`math-block-${index}`} style={styles.mathBlock}>
          <MathJax
            fontSize={style?.fontSize || 16}
            color={style?.color || '#000'}
          >
            {`\\[${math}\\]`}
          </MathJax>
        </View>
      );
    }
    // Verifica se é uma expressão matemática inline com possíveis \n
    else if (part.includes('\\(') && part.includes('\\)')) {
      const math = cleanMathExpression(part);
      return (
        <View key={`math-inline-${index}`} style={styles.mathInline}>
          <MathJax
            fontSize={(style?.fontSize || 16) * 0.9}
            color={style?.color || '#000'}
          >
            {`\\(${math}\\)`}
          </MathJax>
        </View>
      );
    }
    // Texto normal - processa com Markdown
    else {
      return part.trim() ? (
        <Markdown
          key={`text-${index}`}
          style={{
            body: {
              ...style,
              color: style?.color || '#000',
              fontSize: style?.fontSize || 16,
            }
          }}
        >
          {part}
        </Markdown>
      ) : null;
    }
  });

  return (
    <View style={[styles.container, style]}>
      {elements}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mathBlock: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  mathInline: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap'
  }
});