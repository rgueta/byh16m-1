import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bytheg.byh16m",
  appName: "byh16m",
  webDir: "www",
  server: {
    url: "http://192.168.1.170:8100", //  <-- pc Ip address
    cleartext: true,
  },

  // server: {
  //   androidScheme: "https",
  //   cleartext: true, // Solo para desarrollo
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000, // reduce si quieres que dure menos
      launchAutoHide: true,
      backgroundColor: "#FFFFFF", // pon el color exacto del fondo de tu splash
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_INSIDE", // prueba también FIT_CENTER
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
