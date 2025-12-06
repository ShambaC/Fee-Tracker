import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shambac.yogafeetracker',
  appName: 'Yoga Fee Tracker',
  webDir: 'dist',
  plugins: {
    SafeArea: {
      enabled: true,
      offset: 0,
      statusBarStyle: 'LIGHT',
    }
  },
  android: {
    adjustMarginsForEdgeToEdge: 'auto',
  }
};

export default config;
