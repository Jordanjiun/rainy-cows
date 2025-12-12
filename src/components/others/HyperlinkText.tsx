import { extend } from '@pixi/react';
import { FederatedPointerEvent, Text, TextStyle } from 'pixi.js';
import { useState } from 'react';
import type { ComponentProps } from 'react';

extend({ Text });

interface HyperlinkTextProps extends Partial<ComponentProps<'pixiText'>> {
  text: string;
  url: string;
  x?: number;
  y?: number;
  anchor?: { x: number; y: number };
  color?: string;
  hoverColor?: string;
  fontFamily?: string;
  fontSize?: number;
}

export const HyperlinkText = ({
  text,
  url,
  x = 0,
  y = 0,
  anchor = { x: 1, y: 0 },
  color = '#337ab7',
  hoverColor = '#23527c',
  fontFamily = 'pixelFont',
  fontSize = 16,
  ...props
}: HyperlinkTextProps) => {
  const [isHover, setIsHover] = useState(false);

  const style = new TextStyle({
    fill: isHover ? hoverColor : color,
    fontFamily,
    fontSize,
  });

  const openLink = () => {
    window.open(url, '_blank');
  };

  return (
    <pixiText
      text={text}
      x={x}
      y={y}
      anchor={anchor}
      style={style}
      interactive={true}
      onPointerDown={openLink}
      onPointerOver={(e: FederatedPointerEvent) => {
        setIsHover(true);
        (e.currentTarget as any).cursor = 'pointer';
      }}
      onPointerOut={(e: FederatedPointerEvent) => {
        setIsHover(false);
        (e.currentTarget as any).cursor = 'default';
      }}
      {...props}
    />
  );
};
