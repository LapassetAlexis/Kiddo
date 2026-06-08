import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export function useTour(key: string) {
  const [checked, setChecked] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(`@kiddo:tour:${key}`).then(v => {
      if (!v) setActive(true);
      setChecked(true);
    });
  }, []);

  async function finish() {
    setActive(false);
    await AsyncStorage.setItem(`@kiddo:tour:${key}`, '1');
  }

  return { checked, active, finish };
}
