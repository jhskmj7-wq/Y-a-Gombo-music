const config = {
  appId: 'com.afritrust.app',
  appName: 'AFRIGOMBO',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'ais-dev-ft4dcfebiheopao5youqan-162624868358.europe-west3.run.app',
      'ais-pre-ft4dcfebiheopao5youqan-162624868358.europe-west3.run.app'
    ]
  },
  plugins: {
    FirebaseAuthentication: {
      providers: ['google.com', 'facebook.com'],
      skipNativeAuth: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
