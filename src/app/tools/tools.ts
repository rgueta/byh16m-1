export const Utils = {
  convDate: function (today: Date) {
    var day: string = ("0" + today.getDate()).slice(-2);
    var month: string = ("0" + (today.getMonth() + 1)).slice(-2);
    var year: string = today.getFullYear().toString();
    var hour: string = ("0" + today.getHours()).slice(-2);
    var minutes: string = ("0" + today.getMinutes()).slice(-2);
    var seconds: string = ("0" + today.getSeconds()).slice(-2);
    var milis: string = ("0" + today.getMilliseconds()).slice(-3);

    return (
      year +
      "-" +
      month +
      "-" +
      day +
      "T" +
      hour +
      ":" +
      minutes +
      ":" +
      seconds +
      "." +
      milis
    );
  },

  convDateToday: async function () {
    var today: Date = new Date();
    var day: string = ("0" + today.getDate()).slice(-2);
    var month: string = ("0" + (today.getMonth() + 1)).slice(-2);
    var year: string = today.getFullYear().toString();
    var hour: string = ("0" + today.getHours()).slice(-2);
    var minutes: string = ("0" + today.getMinutes()).slice(-2);
    var seconds: string = ("0" + today.getSeconds()).slice(-2);
    var milis: string = ("0" + today.getMilliseconds()).slice(-3);

    return (
      year +
      "-" +
      month +
      "-" +
      day +
      "T" +
      hour +
      ":" +
      minutes +
      ":" +
      seconds +
      "." +
      milis
    );
  },

  convISODate: function (today: Date) {
    var day: string = ("0" + today.getDate()).slice(-2);
    var month: string = ("0" + (today.getMonth() + 1)).slice(-2);
    var year: string = today.getFullYear().toString();
    var hour: string = ("0" + today.getHours()).slice(-2);
    var minutes: string = ("0" + today.getMinutes()).slice(-2);
    var seconds: string = ("0" + today.getSeconds()).slice(-2);
    var milis: string = ("0" + today.getMilliseconds()).slice(-3);

    return (
      year +
      "-" +
      month +
      "-" +
      day +
      "T" +
      hour +
      ":" +
      minutes +
      ":" +
      seconds +
      "." +
      milis +
      ".000Z"
    );
  },

  sortJSON: function (arr: any, key: any, asc = true) {
    return arr.sort((a: any, b: any) => {
      let x = a["name"][key];
      let y = b["name"][key];
      if (asc) {
        return x < y ? -1 : x > y ? 1 : 0;
      } else {
        return x > y ? -1 : x < y ? 1 : 0;
      }
    });
  },

  sortJsonVisitors: function (arr: any, key: any, asc = true) {
    return arr.sort((a: any, b: any) => {
      let x = a[key];
      let y = b[key];
      if (asc) {
        return x < y ? -1 : x > y ? 1 : 0;
      } else {
        return x > y ? -1 : x < y ? 1 : 0;
      }
    });
  },

  cleanLocalStorage: async () => {
    let myVisitors: string | null = "";
    let coreId: string = "";
    let refreshToken: string = "";
    let netStatus: string | null = "";

    if (localStorage.getItem("netStatus") !== null) {
      // netStatus = await JSON.parse(localStorage.getItem('netStatus'));
      netStatus = localStorage.getItem("netStatus");
    }

    // if (localStorage.getItem("visitors") !== null) {
    if (localStorage.getItem("visitors")) {
      // myVisitors = await JSON.parse(localStorage.getItem('visitors'));

      myVisitors = localStorage.getItem("visitors")!;
    }
    // comentado por aplicar la seguridad con capacitor/preferences
    // if (localStorage.getItem("refreshToken") !== null) {
    //   let refreshToken = localStorage.getItem("refreshToken");
    // }

    if (localStorage.getItem("core-id") !== null) {
      let mycore_id = localStorage.getItem("core-id");
    }

    localStorage.clear();
    localStorage.setItem("netStatus", netStatus!);
    localStorage.setItem("visitors", myVisitors);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("coreId", coreId);
  },

  getTimestamp: async () => {
    return new Date().toISOString();
  },

  convertUTCDateToLocalDate: async (date: Date) => {
    var newDate = new Date(
      date.getTime() + date.getTimezoneOffset() * 60 * 1000
    );

    console.log("newDate antes: ", newDate);

    var offset = date.getTimezoneOffset() / 60;
    var hours = date.getHours();

    newDate.setHours(hours - offset);

    console.log("offset: ", offset);

    console.log("hours: ", hours);
    console.log("getTime : ", date.getTime());

    console.log("diff: ", newDate.setHours(hours - offset));

    console.log(
      "newDate: ",
      new Date(new Date().setHours(new Date().getHours() - offset))
    );

    return newDate;
  },

  convertLocalDateToUTCDate: (date: Date) => {
    return new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
  },
};
