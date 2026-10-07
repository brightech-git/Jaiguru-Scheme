import React, { forwardRef } from 'react';
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextProps,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { BOLD, BODY, LIGHT, MEDIUM, SEMIBOLD } from '../../Utills/Fonts';

// Select a bundled font file rather than synthesizing a weight on Android.
export function resolveFontStyle(style: TextStyle | undefined): TextStyle {
  const weight = style?.fontWeight;
  let fontFamily = style?.fontFamily || BODY;
  if (weight) {
    const numericWeight = weight === 'bold' ? 700 : weight === 'normal' ? 400 : Number(weight);
    fontFamily = numericWeight >= 700 ? BOLD
      : numericWeight >= 600 ? SEMIBOLD
      : numericWeight >= 500 ? MEDIUM
      : numericWeight <= 300 ? LIGHT : BODY;
  }
  return { fontFamily, fontWeight: 'normal' };
}

export type Text = NativeText;
export const Text = forwardRef<NativeText, TextProps>(function FontText({ style, ...props }, ref) {
  return <NativeText ref={ref} {...props} style={[style, resolveFontStyle(StyleSheet.flatten(style))]} />;
});

export type TextInput = NativeTextInput;
export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function FontTextInput({ style, ...props }, ref) {
  return <NativeTextInput ref={ref} {...props} style={[style, resolveFontStyle(StyleSheet.flatten(style))]} />;
});
