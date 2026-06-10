import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

export async function registerForPushNotifications(): Promise<string | null> {
  if (isExpoGo) {
    console.warn('[FCM] Push notifications not supported in Expo Go');
    return null;
  }

  // Dynamic import so the module never loads in Expo Go
  const Notifications = await import('expo-notifications');

  if (!Device.isDevice) {
    console.warn('[FCM] Push notifications require a physical device');
    return null;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert:  true,
      shouldPlaySound:  true,
      shouldSetBadge:   true,
      shouldShowBanner: true,
      shouldShowList:   true,
    }),
  });

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[FCM] Push notification permission denied');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFB300',
    });
  }

  try {
    const token = await Notifications.getDevicePushTokenAsync();
    return token.data;
  } catch (err) {
    console.error('[FCM] getDevicePushTokenAsync failed:', err);
    return null;
  }
}
