import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Svg, { Circle, Path, Defs, LinearGradient, Stop, G } from "react-native-svg";

export interface GoldCoinProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Component Đồng Xu Vàng Anime Waifu Coin Hoàng Gia 🌟🪙
 * Thiết kế đồ họa Vector 3D sắc nét, viền dập nổi, ánh kim lấp lánh và ngôi sao hoàng kim,
 * hiển thị hoàn hảo 100% trên mọi nền tảng không bao giờ bị lỗi font ô vuông tofu.
 */
export const GoldCoin: React.FC<GoldCoinProps> = ({ size = 20, style }) => {
  return (
    <View style={[{ width: size, height: size, justifyContent: "center", alignItems: "center" }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          {/* Đổ bóng & viền ngoài đồng xu */}
          <LinearGradient id="coinBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#fef08a" />
            <Stop offset="40%" stopColor="#f59e0b" />
            <Stop offset="100%" stopColor="#b45309" />
          </LinearGradient>

          {/* Mặt trong đồng xu vàng tươi */}
          <LinearGradient id="coinBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#fde047" />
            <Stop offset="50%" stopColor="#f59e0b" />
            <Stop offset="100%" stopColor="#d97706" />
          </LinearGradient>

          {/* Vòng dập nổi bên trong */}
          <LinearGradient id="coinInnerRing" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#b45309" />
            <Stop offset="50%" stopColor="#fef08a" />
            <Stop offset="100%" stopColor="#f59e0b" />
          </LinearGradient>

          {/* Điểm sáng lấp lánh góc trên */}
          <LinearGradient id="shineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Viền ngoài dập 3D dày dặn */}
        <Circle cx="50" cy="50" r="48" fill="url(#coinBorderGrad)" />
        <Circle cx="50" cy="52" r="46" fill="#78350f" opacity="0.3" />
        <Circle cx="50" cy="50" r="44" fill="url(#coinBodyGrad)" />

        {/* Vòng kim loại dập nổi (Inner rim) */}
        <Circle cx="50" cy="50" r="37" fill="none" stroke="url(#coinInnerRing)" strokeWidth="3" />
        <Circle cx="50" cy="50" r="34" fill="#fbbf24" />

        {/* Biểu tượng Ngôi Sao Anime Hoàng Kim ở tâm đồng xu */}
        <Path
          d="M 50 25 
             L 55.5 38.5 
             L 70 39.5 
             L 59 49 
             L 62.5 63 
             L 50 55 
             L 37.5 63 
             L 41 49 
             L 30 39.5 
             L 44.5 38.5 Z"
          fill="#fffbeb"
          stroke="#b45309"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Chữ W (Waifu) dập nổi bên dưới ngôi sao */}
        <Path
          d="M 40 68 L 44 79 L 50 72 L 56 79 L 60 68"
          fill="none"
          stroke="#92400e"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Ánh kim lấp lánh trên góc 10h */}
        <Path
          d="M 22 28 C 30 18, 48 16, 62 20 C 50 20, 32 25, 22 36 Z"
          fill="url(#shineGrad)"
        />
        <Circle cx="72" cy="28" r="3.5" fill="#ffffff" opacity="0.9" />
      </Svg>
    </View>
  );
};

export default GoldCoin;
