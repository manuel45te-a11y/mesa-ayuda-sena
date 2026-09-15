import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { c, r, s } from '../theme';

/**
 * GlassCard – a reusable card component with glassmorphism effect.
 * It uses Expo's BlurView to create a semi‑transparent background with a subtle blur.
 * The component accepts `style` to allow overrides and `children`.
 */
export default function GlassCard({ children, style, onPress, accentColor }) {
  const containerStyle = [styles.container, accentColor && { borderColor: accentColor }, style];
  return (
    <View style={containerStyle}>
      <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: r.lg,
    borderWidth: 1,
    borderColor: c.linea,
    overflow: 'hidden',
    padding: s.lg,
    // Add a subtle shadow for depth on web/desktop
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
