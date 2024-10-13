import React, { useMemo } from 'react';
import { Text, View, StyleSheet, TextStyle } from 'react-native';
import MathJaxSvg from 'react-native-mathjax-svg';

interface MixedTextProps {
  content: string;
  style?: TextStyle;
}

type Part = { type: 'text' | 'inlineLatex' | 'displayLatex'; value: string };

const MixedText: React.FC<MixedTextProps> = ({ content, style }) => {
  // Memorizar o conteúdo parseado para evitar reprocessamento se o conteúdo não mudar
  const parts = useMemo(() => parseContent(content), [content]);

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          // Lidar com quebras de linha dentro das partes de texto
          const lines = part.value.split('\n');
          return lines.map((line, lineIndex) => (
            <Text style={style} key={`${index}-${lineIndex}`}>
              {line}
              {lineIndex < lines.length - 1 && '\n'}
            </Text>
          ));
        } else if (part.type === 'inlineLatex') {
          return (
            <InlineMath
              key={index}
              math={part.value}
              fontSize={style?.fontSize || 16}
              color={style?.color?.toString() || '#000'}
            />
          );
        } else if (part.type === 'displayLatex') {
          return (
            <DisplayMath
              key={index}
              math={part.value}
              fontSize={style?.fontSize || 16}
              color={style?.color?.toString() || '#000'}
            />
          );
        } else {
          return null;
        }
      })}
    </>
  );
};

const InlineMath: React.FC<{ math: string; fontSize: number; color: string }> = ({
  math,
  fontSize,
  color,
}) => {
  return (
    <MathJaxSvg fontSize={fontSize} color={color} style={styles.inlineMath}>
      {math}
    </MathJaxSvg>
  );
};

const DisplayMath: React.FC<{ math: string; fontSize: number; color: string }> = ({
  math,
  fontSize,
  color,
}) => {
  return (
    <View style={styles.displayMathContainer}>
      <MathJaxSvg fontSize={fontSize * 1.5} color={color}>
        {math}
      </MathJaxSvg>
    </View>
  );
};

function parseContent(content: string): Part[] {
  const regex = /(\$\$.*?\$\$|\$.*?\$)/gs;
  const parts: Part[] = [];
  let lastIndex = 0;

  let match;
  while ((match = regex.exec(content)) !== null) {
    if (lastIndex < match.index) {
      parts.push({
        type: 'text',
        value: content.substring(lastIndex, match.index),
      });
    }

    const latexContent = match[0];
    if (latexContent.startsWith('$$')) {
      parts.push({
        type: 'displayLatex',
        value: latexContent.slice(2, -2),
      });
    } else {
      parts.push({
        type: 'inlineLatex',
        value: latexContent.slice(1, -1),
      });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.substring(lastIndex) });
  }

  return parts;
}

const styles = StyleSheet.create({
  inlineMath: {
    // Ajustar o alinhamento vertical para coincidir com o texto
    alignSelf: 'center',
  },
  displayMathContainer: {
    // Centralizar o LaTeX display e adicionar espaçamento vertical
    width: '100%',
    alignItems: 'center',
    marginVertical: 15,
  },
});

export default MixedText;
