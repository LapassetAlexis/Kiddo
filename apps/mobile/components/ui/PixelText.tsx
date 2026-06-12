import { Text, TextProps } from 'react-native';
import { Fonts } from '@/constants/theme';

interface PixelTextProps extends TextProps {
  bold?: boolean;
}

export default function PixelText({ bold, style, ...props }: PixelTextProps) {
  return (
    <Text
      style={[{ fontFamily: bold ? Fonts.pixelBold : Fonts.pixel }, style]}
      {...props}
    />
  );
}
