import React from 'react';
import MathJaxSvg from 'react-native-mathjax-svg';

interface MathTextProps {
  math: string;
  fontSize?: number;
  color?: string;
}

export default function MathText({ math, fontSize = 18, color = '#333' }: MathTextProps) {
  return (
    <MathJaxSvg fontSize={fontSize} color={color}>
      {math}
    </MathJaxSvg>
  );
}
