// components/MixedText.tsx

import React, { useMemo, useContext } from 'react';
import {
  Text,
  View,
  StyleSheet,
  StyleProp,
  TextStyle,
} from 'react-native';
import MathJaxSvg from 'react-native-mathjax-svg'; // Biblioteca para renderizar LaTeX em SVG
import { ThemeContext } from '../contexts/ThemeContext'; // Importa o contexto de tema

// Interface que define as props esperadas pelo componente MixedText
interface MixedTextProps {
  content: string; // O conteúdo que será exibido, pode incluir texto e LaTeX
  style?: StyleProp<TextStyle>; // Estilo opcional aplicado ao texto
}

// Definição do tipo de partes do conteúdo, que podem ser texto, LaTeX inline ou display
type Part = { type: 'text' | 'inlineLatex' | 'displayLatex'; value: string };

// Componente principal para renderizar texto misturado com LaTeX
const MixedText: React.FC<MixedTextProps> = ({ content, style }) => {
  const { darkModeEnabled } = useContext(ThemeContext); // Obtém a preferência de tema

  // Usa useMemo para evitar que o conteúdo seja reprocessado em cada renderização se o conteúdo não mudar
  const parts = useMemo(() => parseContent(content), [content]);

  return (
    <View style={styles.container}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          // Divisão de linhas de texto para lidar com quebras de linha dentro de partes de texto
          const lines = part.value.split('\n');
          return lines.map((line, lineIndex) => (
            <Text
              key={`${index}-${lineIndex}`}
              style={[style, darkModeEnabled ? styles.darkText : styles.lightText]}
            >
              {line}
              {lineIndex < lines.length - 1 && '\n'} {/* Adiciona uma nova linha se não for a última */}
            </Text>
          ));
        } else if (part.type === 'inlineLatex') {
          // Renderização de LaTeX inline
          return (
            <MathJaxSvg
              key={index}
              fontSize={((style as TextStyle)?.fontSize) || 16} // Tamanho da fonte padrão 16
              color={darkModeEnabled ? '#fff' : '#000'} // Cor condicional baseada no tema
              style={styles.inlineMath}
            >
              {part.value}
            </MathJaxSvg>
          );
        } else if (part.type === 'displayLatex') {
          // Renderização de LaTeX em modo display
          return (
            <View key={index} style={styles.displayMathContainer}>
              <MathJaxSvg
                fontSize={((style as TextStyle)?.fontSize || 16) * 1.5}
                color={darkModeEnabled ? '#fff' : '#000'}
              >
                {part.value}
              </MathJaxSvg>
            </View>
          );
        } else {
          return null;
        }
      })}
    </View>
  );
};

// Função para analisar e dividir o conteúdo em partes de texto e LaTeX
function parseContent(content: string): Part[] {
  const regex = /(\$\$.*?\$\$|\$.*?\$)/gs; // Regex para encontrar LaTeX inline ($) e display ($$)
  const parts: Part[] = [];
  let lastIndex = 0;

  let match;
  while ((match = regex.exec(content)) !== null) {
    if (lastIndex < match.index) {
      parts.push({
        type: 'text',
        value: content.substring(lastIndex, match.index), // Parte de texto antes do LaTeX encontrado
      });
    }

    const latexContent = match[0];
    if (latexContent.startsWith('$$')) {
      parts.push({
        type: 'displayLatex',
        value: latexContent.slice(2, -2), // Remove $$ ao redor do LaTeX
      });
    } else {
      parts.push({
        type: 'inlineLatex',
        value: latexContent.slice(1, -1), // Remove $ ao redor do LaTeX
      });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.substring(lastIndex) }); // Resto do texto após o último LaTeX
  }

  return parts;
}

// Estilos para os componentes e elementos
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  lightText: {
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  inlineMath: {
    // Ajusta o alinhamento vertical para combinar com o texto ao redor
    alignSelf: 'center',
    marginVertical: 2,
  },
  displayMathContainer: {
    // Centraliza o display math e adiciona espaçamento vertical
    width: '100%',
    alignItems: 'center',
    marginVertical: 15,
  },
});

// Exportação do componente MixedText
export default MixedText;