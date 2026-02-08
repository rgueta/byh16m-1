import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bytheg.byh16m",
  appName: "byh16m",
  webDir: "www",
  // server: {
  //   url: "http://localhost:8100", //  <-- pc Ip address
  //   cleartext: true,
  // },

  server: {
    androidScheme: "https",
    cleartext: true, // Solo para desarrollo
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
