// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: "false",
  app: {
    version: "1.0.4",
    Description: "Main tab data information feed",
    debugging: false,
    debugging_send_sms: true,
  },
  cloud: {
    // status 1 = Active; 2 = Inactive, 3 = New register
    register_status: 3,

    // Web
    // server_url : "http://100.24.58.74/"

    // Local
    server_url: "http://192.168.1.185:5000/",
    admin: "ricardogueta@gmail.com",
    padmin: "P@55w0rd$$",

    // Wifi-1E44
    // server_url : "http://192.168.0.198:5000/"

    // Eth
    // server_url : "http://192.168.1.184:5500/"

    // Wifi
    // socket_url : "ws://192.168.1.154:5500/",

    // GL-iNet
    // server_url : "http://192.168.8.164:5500/"

    // Carlitos
    // server_url : "http://192.168.43.144:5500/"
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
