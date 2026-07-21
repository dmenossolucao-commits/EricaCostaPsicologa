import React from 'react';

// Properties defined in the visual editor
export interface DesignerElementStyles {
  // Text
  color?: string;
  fontFamily?: string;
  fontSize?: number; // in pixels
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number | string;
  letterSpacing?: number; // in pixels

  // Background
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  opacity?: number;

  // Spacing
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;

  // Borders
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRadius?: number;

  // Shadows
  boxShadow?: string;

  // Button-specifics
  buttonHoverBg?: string;
  buttonHoverColor?: string;
  buttonWidth?: string;

  // Image-specifics
  zoom?: number;
  crop?: 'cover' | 'contain' | 'fill';
  positioning?: string;
}

/**
 * Converts stored designer styles into a React.CSSProperties object
 */
export function getStylesForElement(siteContent: any, elementId: string): React.CSSProperties {
  const styles: DesignerElementStyles = siteContent?.designer_styles?.[elementId] || {};
  const inlineStyles: React.CSSProperties = {};

  // Text
  if (styles.color) inlineStyles.color = styles.color;
  if (styles.fontFamily) inlineStyles.fontFamily = styles.fontFamily;
  if (styles.fontSize !== undefined) inlineStyles.fontSize = `${styles.fontSize}px`;
  if (styles.fontWeight) inlineStyles.fontWeight = styles.fontWeight;
  if (styles.textAlign) inlineStyles.textAlign = styles.textAlign;
  if (styles.lineHeight !== undefined) inlineStyles.lineHeight = styles.lineHeight;
  if (styles.letterSpacing !== undefined) inlineStyles.letterSpacing = `${styles.letterSpacing}px`;

  // Background
  if (styles.backgroundGradient) {
    inlineStyles.background = styles.backgroundGradient;
  } else if (styles.backgroundColor) {
    inlineStyles.backgroundColor = styles.backgroundColor;
  }
  if (styles.backgroundImage) {
    inlineStyles.backgroundImage = `url(${styles.backgroundImage})`;
    inlineStyles.backgroundSize = styles.crop || 'cover';
    inlineStyles.backgroundPosition = styles.positioning || 'center';
  }
  if (styles.opacity !== undefined) inlineStyles.opacity = styles.opacity;

  // Spacing
  if (styles.marginTop !== undefined) inlineStyles.marginTop = `${styles.marginTop}px`;
  if (styles.marginBottom !== undefined) inlineStyles.marginBottom = `${styles.marginBottom}px`;
  if (styles.marginLeft !== undefined) inlineStyles.marginLeft = `${styles.marginLeft}px`;
  if (styles.marginRight !== undefined) inlineStyles.marginRight = `${styles.marginRight}px`;
  if (styles.paddingTop !== undefined) inlineStyles.paddingTop = `${styles.paddingTop}px`;
  if (styles.paddingBottom !== undefined) inlineStyles.paddingBottom = `${styles.paddingBottom}px`;
  if (styles.paddingLeft !== undefined) inlineStyles.paddingLeft = `${styles.paddingLeft}px`;
  if (styles.paddingRight !== undefined) inlineStyles.paddingRight = `${styles.paddingRight}px`;

  // Borders
  if (styles.borderWidth !== undefined) inlineStyles.borderWidth = `${styles.borderWidth}px`;
  if (styles.borderColor) inlineStyles.borderColor = styles.borderColor;
  if (styles.borderStyle) inlineStyles.borderStyle = styles.borderStyle;
  if (styles.borderRadius !== undefined) inlineStyles.borderRadius = `${styles.borderRadius}px`;

  // Shadows
  if (styles.boxShadow) {
    inlineStyles.boxShadow = styles.boxShadow;
  }

  // Button specials
  if (styles.buttonWidth) {
    inlineStyles.width = styles.buttonWidth;
  }

  // Image specials
  if (styles.zoom !== undefined && styles.zoom !== 1) {
    inlineStyles.transform = `scale(${styles.zoom})`;
  }

  return inlineStyles;
}

/**
 * Helper to register designer properties to an element
 */
export function getDesignerProps(siteContent: any, elementId: string, isDesignerMode = false, selectedId = '') {
  const isSelected = isDesignerMode && selectedId === elementId;
  const style = getStylesForElement(siteContent, elementId);
  
  return {
    'data-designer-id': elementId,
    style,
    className: isDesignerMode 
      ? `transition-all duration-200 cursor-pointer hover:outline-2 hover:outline-dashed hover:outline-blue-400/60 ${isSelected ? 'outline-2 outline-blue-500 hover:outline-blue-500 shadow-md ring-2 ring-blue-500/20' : ''}`
      : ''
  };
}
