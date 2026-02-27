import { Component, OnInit } from "@angular/core";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonList,
  IonLabel,
  IonItem,
  IonModal,
  IonDatetime,
  IonNote,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/angular/standalone";
import { DatabaseService } from "../services/database.service";
import { ToolsService } from "../services/tools.service";
import { addIcons } from "ionicons";
import {
  chevronUpOutline,
  chevronDownOutline,
  calendar,
  search,
  chevronForwardOutline,
} from "ionicons/icons";
import { NgStyle, DatePipe, NgFor, NgIf } from "@angular/common";
import { NetworkService } from "../services/network.service";
import { Subscriber } from "rxjs";

const USERID = "userId";
const REFRESH_TOKEN = "refreshToken";
const TOKEN = "authToken";
const CORE_SIM = "coreSim";
const netStatus = "netStatus";

@Component({
  selector: "app-tab2",
  templateUrl: "tab2.page.html",
  styleUrls: ["tab2.page.scss"],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonModal,
    IonLabel,
    IonItem,
    IonDatetime,
    IonNote,
    IonIcon,
    DatePipe,
    IonRefresher,
    IonRefresherContent,
    NgFor,
    NgIf,
  ],
})
export class Tab2Page implements OnInit {
  start: any;
  end: any;

  public EventsList: any;
  public myEventsList: any;
  automaticClose = false;
  Core_sim: any;
  public Initial: string = "";
  public Final: string = "";
  myToken: any;
  myRefreshToken: any;
  myToast: any;
  myUserId: any;

  constructor(
    public api: DatabaseService,
    private toolService: ToolsService,
    public networkService: NetworkService
  ) {
    addIcons({
      chevronUpOutline,
      chevronDownOutline,
      chevronForwardOutline,
      calendar,
      search,
    });
  }

  async ngOnInit(): Promise<void> {
    this.convertDate("Oninit", new Date(Date.now()));
    this.myUserId = await this.toolService.getSecureStorage<number>(
      "userId",
      0
    );

    this.myToken = await this.toolService.getSecureStorage<string>(
      "authToken",
      ""
    );

    this.Core_sim = await this.toolService.getSecureStorage<string>(
      "coreSim",
      ""
    );
  }

  async getEventsInitial(event: any) {
    // await this.convertDate("initial", new Date(event.detail.value));
    this.Initial = event.detail.value;
  }

  async getEventsFinal(event: any) {
    // await this.convertDate("final", new Date(event.detail.value));
    this.Final = event.detail.value;
  }

  async convertDate(pos: string, fecha: Date) {
    if (pos == "initial") {
      this.start = fecha;
    } else if (pos == "final") {
      this.end = fecha;
    } else {
      this.start = this.end = fecha;
    }

    if (this.end < this.start) {
      const temp = await this.start;
      this.start = await this.end;
      this.end = await temp;
    }

    await this.start.setHours(0, 0, 0).toLocaleString();
    await this.end.setHours(23, 59, 59).toLocaleString();

    this.Initial = new Date(
      this.start.getTime() - this.start.getTimezoneOffset() * 60000
    ).toISOString();

    this.Final = new Date(
      this.end.getTime() - this.end.getTimezoneOffset() * 60000
    ).toISOString();
  }

  toSqliteDatetime(iso: string): string {
    return iso.replace("T", " ").slice(0, 19);
  }

  // async getEvents() {
  //   this.api.getData("api/auth/info").subscribe({
  //     next: async (result: any) => {
  //       // this.EventsList = result.results;
  //     },
  //     error: (error) => {
  //       this.toolService.showAlertBasic(
  //         "Aviso",
  //         "Fallo al obtener codeEvents: ",
  //         error,
  //         ["Cerrar"]
  //       );
  //     },
  //   });
  // }

  async getEvents() {
    if (!(await this.networkService.checkInternetConnection())) {
      this.toolService.toastAlert(
        "No hay Acceso a internet",
        0,
        ["Ok"],
        "middle"
      );
      return;
    }

    try {
      this.api
        .getData(
          "api/codeEvent/" +
            this.myUserId +
            "/" +
            this.toSqliteDatetime(this.Initial) +
            "/" +
            this.toSqliteDatetime(this.Final)
        )
        .subscribe({
          next: async (result: any) => {
            this.EventsList = result.results;
            if (this.EventsList.length > 0) {
              this.EventsList.forEach(async (item: any) => {
                let d = new Date(item.createdAt.replace("Z", ""));
                item.createdAt = new Date(
                  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
                );
              });

              this.EventsList[0].open = true;
            } else {
              this.toolService.toastAlert(
                "No hay eventos para esta fecha",
                0,
                ["Ok"],
                "middle"
              );
            }
          },
          error: (error) => {
            this.toolService.showAlertBasic(
              "Aviso",
              "Fallo al obtener codeEvents: ",
              error,
              ["Cerrar"]
            );
          },
        });
    } catch (e) {
      this.toolService.showAlertBasic(
        "Aviso",
        "Ocurrio una excepción revisar:",
        `1. Acceso a la red<br>` + `2. Permiso para envio de sms`,
        ["Cerrar"]
      );
    }
  }

  async doRefresh(event: any) {
    this.EventsList = null;
    this.getEvents();
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  toggleSection(index: any) {
    this.EventsList[index].open = !this.EventsList[index].open;
    if (this.automaticClose && this.EventsList[index].open) {
      this.EventsList.filter(
        (item: {}, itemIndex: number) => itemIndex != index
      ).map((item: any) => (item.open = false));
    }
  }
}
