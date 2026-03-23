import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function StarRating({ rating = 0, size = 14, interactive = false, onRate }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text
          key={star}
          style={{ fontSize: size, color: star <= Math.round(rating) ? COLORS.starFilled : COLORS.starEmpty }}
          onPress={interactive && onRate ? () => onRate(star) : undefined}
        >
          ★
        </Text>
      ))}
    </View>
  );
}
