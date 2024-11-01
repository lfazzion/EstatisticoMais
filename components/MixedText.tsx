import React, { useMemo } from 'react';
import { Text, View, StyleSheet, TextStyle, StyleProp } from 'react-native';
import MathJaxSvg from 'react-native-mathjax-svg';

interface MixedTextProps {
  content: string;
  style?: StyleProp<TextStyle>;
}

type Part = { type: 'text' | 'inlineLatex' | 'displayLatex'; value: string };

const MixedText: React.FC<MixedTextProps> = ({ content, style }) => {
  const flattenedStyle = StyleSheet.flatten(style);

  const parts = useMemo(() => parseContent(content), [content]);

  const elementsToRender = [];
  let inlineElements: (string | React.ReactElement)[] = [];

  parts.forEach((part, index) => {
    if (part.type === 'text') {
      // Adicionar o texto diretamente ao array de elementos inline
      inlineElements.push(part.value);
    } else if (part.type === 'inlineLatex') {
      // Adicionar o LaTeX inline ao array de elementos inline
      inlineElements.push(
        <InlineMath
          key={`inline-${index}`}
          math={part.value}
          fontSize={flattenedStyle?.fontSize || 16}
          color={flattenedStyle?.color?.toString() || '#000'}
        />
      );
    } else if (part.type === 'displayLatex') {
      // Renderizar o conteúdo inline acumulado dentro de um componente Text
      if (inlineElements.length > 0) {
        elementsToRender.push(
          <Text key={`text-${index}`} style={style}>
            {inlineElements}
          </Text>
        );
        inlineElements = [];
      }
      // Renderizar o LaTeX display fora do componente Text
      elementsToRender.push(
        <DisplayMath
          key={`display-${index}`}
          math={part.value}
          fontSize={(flattenedStyle?.fontSize || 16) * 1.5}
          color={flattenedStyle?.color?.toString() || '#000'}
        />
      );
    }
  });

  // Renderizar quaisquer elementos inline restantes
  if (inlineElements.length > 0) {
    elementsToRender.push(
      <Text key={`text-end`} style={style}>
        {inlineElements}
      </Text>
    );
  }

  return <>{elementsToRender}</>;
};

const InlineMath: React.FC<{ math: string; fontSize: number; color: string }> = ({
  math,
  fontSize,
  color,
}) => {
  // Ajustar o estilo para o LaTeX inline
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
      <MathJaxSvg fontSize={fontSize} color={color}>
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
    // Isso pode variar dependendo das necessidades do seu projeto
    alignSelf: 'center',
  },
  displayMathContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 15,
  },
});

export default MixedText;
