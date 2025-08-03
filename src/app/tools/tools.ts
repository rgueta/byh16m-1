import { Injectable } from "@angular/core";
import { ToolsService } from "../services/tools.service";

@Injectable({
  providedIn: "root",
})
export class Utils {
  constructor(private toolsService: ToolsService) {}

  convDate(today: Date) {
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
  }

  sortJSON(arr: any, key: any, asc = true) {
    return arr.sort((a: any, b: any) => {
      let x = a["name"][key];
      let y = b["name"][key];
      if (asc) {
        return x < y ? -1 : x > y ? 1 : 0;
      } else {
        return x > y ? -1 : x < y ? 1 : 0;
      }
    });
  }

  sortJsonVisitors(arr: any, key: any, asc = true) {
    return arr.sort((a: any, b: any) => {
      let x = a[key];
      let y = b[key];
      if (asc) {
        return x < y ? -1 : x > y ? 1 : 0;
      } else {
        return x > y ? -1 : x < y ? 1 : 0;
      }
    });
  }

  cleanLocalStorage() {
    let myVisitors: string | null = "";
    let coreId: string = "";
    let refreshToken: string = "";
    let netStatus: string | null = "";

    if (localStorage.getItem("netStatus") !== null) {
      netStatus = localStorage.getItem("netStatus");
    }

    if (localStorage.getItem("visitors")) {
      myVisitors = localStorage.getItem("visitors")!;
    }

    if (localStorage.getItem("core-id") !== null) {
      let mycore_id = localStorage.getItem("core-id");
    }

    localStorage.clear();
    localStorage.setItem("netStatus", netStatus!);
    localStorage.setItem("visitors", myVisitors);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("coreId", coreId);
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  async convertUTCDateToLocalDate(date: Date) {
    var newDate = new Date(
      date.getTime() + date.getTimezoneOffset() * 60 * 1000
    );

    var offset = date.getTimezoneOffset() / 60;
    var hours = date.getHours();

    newDate.setHours(hours - offset);
    return newDate;
  }

  convertLocalDateToUTCDate(date: Date) {
    return new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
  }
}
