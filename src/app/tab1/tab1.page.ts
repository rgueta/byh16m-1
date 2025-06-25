import { Component, Input, OnInit} from '@angular/core';
import {ModalController, AlertController,
   LoadingController, isPlatform} from '@ionic/angular/standalone';
import { environment } from "../../environments/environment";
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonLabel,
  IonButton, IonButtons,IonFab, IonFabButton,IonFabList, IonPopover,
  IonList,IonItemGroup, IonItem, IonToggle, IonRefresher,
  IonCardContent,IonCardHeader,IonCardTitle,IonCardSubtitle,
  IonCard, IonRefresherContent
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { ellipsisVerticalOutline,chevronUpOutline, chevronDownOutline,
add,personOutline, lockClosedOutline,personAddOutline,personCircleOutline,
toggleOutline
 } from 'ionicons/icons';
import { UsersPage } from "../modals/users/users.page";
import { VisitorListPage } from '../modals/visitor-list/visitor-list.page';
import { FamilyPage } from '../modals/family/family.page';
import { RequestsPage } from "../modals/requests/requests.page";
import { LocalNotifications } from "@capacitor/local-notifications";
import { DatabaseService } from '../services/database.service';
import { Router } from '@angular/router';
import { Utils } from "../tools/tools";
import { UpdUsersPage } from "../modals/upd-users/upd-users.page";
import { BackstagePage } from "../modals/backstage/backstage.page";
import { FormsModule } from '@angular/forms';
import { ToolsService } from "../services/tools.service";
import { SMS, SmsOptions } from '@ionic-native/sms/ngx';
import {
  ActionPerformed, PushNotificationSchema, PushNotifications, Token,
} from '@capacitor/push-notifications';
import { FCM } from "@capacitor-community/fcm"
import { ScreenOrientation } from "@ionic-native/screen-orientation/ngx";
 import {NetworkService} from "../services/network.service"

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone:true,
  imports: [FormsModule,IonHeader, IonToolbar, IonTitle, IonContent,IonLabel,
    CommonModule,IonIcon,IonButton, IonButtons, IonFab,IonFabButton,
    IonFabList,IonList, IonPopover, IonItemGroup,IonItem,IonToggle,
    IonRefresher, IonCard, IonCardContent,IonCardHeader,
    IonCardTitle,IonCardSubtitle,IonRefresherContent
  ]
})

export class Tab1Page implements OnInit{
  public localInfo : any = [];
  public codes: [] = [];
  @Input() msg: string = '';
  @Input() sim: string = '';
  myToast:any;
  myRoles:any;
  public MyRole : string | null= 'visitor';
  isAndroid:any;
  currentUser = '';
  public version = '';
  public coreName: string  | null = '';
  public coreId: string  | null = '';
  twilio_client : any;
  userId : string | null = '';
  id : number = 0;
  btnVisible : boolean = true;
  titleMenuButtons = 'Ocultar botones'
  
  infoPanel : any;
  myEmail: string | null =  '';
  myName : string| null = '';
  REST_API_SERVER = environment.cloud.server_url;
  iosOrAndroid: boolean = false;
  demoMode:boolean = false;
  remote:boolean = false;


  constructor(
    private sms: SMS,
    public modalController: ModalController,
    private api: DatabaseService,
    public alertCtrl: AlertController,
    private router: Router,
    private toolService: ToolsService,
    private loadingController : LoadingController,
    private screenOrientation: ScreenOrientation,
    public networkService:NetworkService
  ) {
    addIcons({ ellipsisVerticalOutline,chevronUpOutline,chevronDownOutline,
      add,personOutline, lockClosedOutline,personAddOutline,
      personCircleOutline,toggleOutline
    });
  }

  async ionViewWillEnter(){
    this.MyRole = localStorage.getItem('my-role');
    this.myEmail = localStorage.getItem('my-email');
    this.myName = localStorage.getItem('my-name');
    this.remote = await localStorage.getItem('remote') === 'true';

    if (localStorage.getItem('demoMode')){
      this.demoMode = localStorage.getItem('demoMode') == 'true' ? true : false
    }

    console.log('Valor del remote: ', this.remote);
    if (!this.remote){
      document.getElementById("infoSection")!.style.setProperty('margin-top', '15px','important') ;
      
      console.log('Si entreeeee');
    }

  }

    async ngOnInit(){
    const sim = await localStorage.getItem('my-core-sim');
    this.userId = await localStorage.getItem('my-userId');
    this.coreName = await localStorage.getItem('core-name');
    this.coreId = await localStorage.getItem('core-id')

    // -----------------firebase Push notification
    PushNotifications.requestPermissions().then(resul => {
      if(resul.receive === 'granted'){
        PushNotifications.register();
      }else{
        this.toolService.toastAlert('Push notification not granted..!',0,['Ok'],'middle');
      }
    });

    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
    });

    //  Subscribe to a specific topic
    FCM.subscribeTo({ topic: localStorage.getItem('core-id') })
    .then() 
    .catch((err) => console.log(err));


    // Enable the auto initialization of the library
    FCM.setAutoInit({ enabled: true }).then();


    PushNotifications.addListener('registrationError', (error: any) => {
      alert('Error on registration: ' + JSON.stringify(error));
    });

    // pushNotification Received event
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        this.toolService.toastAlert((notification.body!),0,['Ok'],'middle');
      },
    );

    // pushNotification clicked Action Performed event
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        // alert('Push action performed: ' + JSON.stringify(notification));
      },
    );
  
    // -----------------------------------------------------

// this.init();
    this.version = environment.app.version;
    if(isPlatform('cordova') || isPlatform('ios')){
      this.lockToPortrait();
    }else if(isPlatform('android')){
      this.isAndroid = true;
    }

    // getting info data
    if(environment.app.debugging){
      console.log('collect Info jumped, because debugging!');
      await this.toolService.toastAlert('collect Info jumped, because debugging!',0,['Ok'],'bottom');
    }else{
      this.collectInfo();
    }

    this.infoPanel = document.getElementById("infoSection");
    this.infoPanel.style.marginTop = "115px";

  }


  toggleButtons(){
    this.btnVisible = !this.btnVisible;
    
    if(this.btnVisible){
      this.titleMenuButtons = 'Ocultar botones'
      this.infoPanel.style.marginTop = "115px";
    }else{
      this.titleMenuButtons = 'Mostrar botones'
      this.infoPanel.style.marginTop = "0px";
    }

  }

  async ModalUsers(){
  const modal = await this.modalController.create({
    component: UsersPage,
    backdropDismiss: true,
    componentProps: {'CoreId' : this.coreId,
      'coreName':this.coreName}
  });

  modal.present()
}

async newVisitor(){
  const modal = await this.modalController.create({
    component: VisitorListPage,
    // cssClass:"my-modal"
  });

  modal.present()
}

async openFamily(){
    const modal = await this.modalController.create({
      component: FamilyPage,
    });
  
    modal.present()
  }

  async recoverAccount(){
  const modal = await this.modalController.create({
    component: RequestsPage,
    componentProps:{request:'UnblockAccount'}
  });
   await modal.present();
}

async deviceLost(){
  const modal = await this.modalController.create({
    component: RequestsPage,
    componentProps:{request:'deviceLost'}
  });
   await modal.present();
}

async localNotification(){
  this.scheduleBasic('Peatonal abierta');
}

async scheduleBasic(msg:any){
  await LocalNotifications.schedule({
    notifications: [
      {
        title: 'Core Alert',
        body: msg,
        id:2,
        summaryText: 'Priv. San Juan',
        extra:{
          data: 'Pass data to your handler'
        },
        iconColor:'#488AFF'
      }
    ]
  });
}

  async fcmNotification(){
    this.api.postData(`api/alerts/${localStorage.getItem('core-id')}/peatonal open/`,'')
  }


  lockToPortrait(){
    if (['android', 'ios'].indexOf(localStorage.getItem('devicePlatform')!))
    this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
  }

  async logout(){
    await this.showAlert('','', 'Deseas salir ?','btns', 'Si', 'No');
  }


  
async comentar(){
  const modal = await this.modalController.create({
    component: UpdUsersPage,
    componentProps:{
      'SourcePage': 'commentApp'
     }
  });
  
   await modal.present();
}

async modalBackstage(){
  const modal = await this.modalController.create({
    component : BackstagePage,
    componentProps:{
      'SourcePage': 'tab1NewNeighbor',
      'coreName': localStorage.getItem('core-name')
     }
  });
  return await modal.present()
}

async collectInfo(){
  let timestamp: string = '';
  if(await this.networkService.checkInternetConnection()){

    // get last api call variable
    if(!localStorage.getItem('lastInfo_updated')){
        timestamp = Utils.convDate(new Date())    
    }else{
      timestamp = await localStorage.getItem('lastInfo_updated') ?? '';
      // timestamp = '2024-01-29T00:49:49.857Z'
    }


    if(this.localInfo.length == 0 && !localStorage.getItem('info')){
      let d = new Date();
      d.setDate(d.getDate() - 180);
      timestamp = Utils.convDate(d);
    }
  
    if(this.localInfo.length == 0 && localStorage.getItem('info')){
      // commented for migration removed JSON.parse
      // this.localInfo = JSON.parse(localStorage.getItem('info'));
      this.localInfo = localStorage.getItem('info');
    }

    try{
      this.api.getData('api/info/' + this.userId + '/' + timestamp).subscribe({
          next: async result => {
            if(Object.keys(result).length > 0){
              
              // get last api call variable
              if(this.localInfo.length > 0){
                // this.localInfo = JSON.parse(localStorage.getItem('info'));

                Object.entries(result).forEach(async ([key,item]) =>{
                  this.localInfo.push(item)
                });

              }else{
                this.localInfo = result;
              }

              this.localInfo = await Utils.sortJsonVisitors(this.localInfo, 'updatedAt', false);

              // cleanup info 
              if(this.localInfo.length > 1000)
              {
                this.localInfo.splice(1000);
              }

              localStorage.setItem('info',await JSON.stringify(this.localInfo));
            }

          },
          error: error => {
            console.error('collect info error : ', error);
          }
        });

      localStorage.setItem('lastInfo_updated', await Utils.convDate(new Date()));
      
    }catch(e){
      console.error('Error api call: ', e)
    }
    
  }else{
    if(this.localInfo.length == 0 && localStorage.getItem('info')){
      // commented for migration removed JSON.parse
      // this.localInfo = JSON.parse(localStorage.getItem('info')); 
      this.localInfo = localStorage.getItem('info');
    }
    this.toolService.toastAlert('No hay acceso a internet',0,['Ok'],'middle')
  }

}

 async doRefresh(event:any){
  this.collectInfo();

  setTimeout(() => {
    event.target.complete();
  }, 2000);
}

DemoMode(){
  this.demoMode = !this.demoMode;
  localStorage.setItem('demoMode', this.demoMode.toString())
}

async openUrl(url:string){
  window.open(url)
}

async getTimestamp(){
  var myDate = new Date();
  var offset = myDate.getTimezoneOffset() * 60 * 1000;

  var withOffset = myDate.getTime();
  var withoutOffset = withOffset - offset;
  return withoutOffset;

}

// Send a text message using default options

async sendSMS(door:string){
  if(this.msg == ''){
    this.toolService.toastAlert('Message empty !',0,['Ok'],'bottom')
    return;
  }
  var options:SmsOptions={
    replaceLineBreaks:false,
    android:{
      intent:''
    }
  }

  const local_sim =  await localStorage.getItem('my-core-sim');
  const use_twilio =  await localStorage.getItem('twilio');
  const uuid =  await localStorage.getItem('device-uuid');
  // const local_sim =  await this.storage.get('my-core-sim');

  // create milliseconds block  for local timestamp -------

  // timestamp ------------------------


  this.sim = local_sim ?? '';
  this.msg = 'open,' + await this.getTimestamp() + ',' + door + ',' + uuid;

  // --------------------------------


  if(!local_sim){
    // this.toolService.toastAlert('Privada sin Sim ',0, ['Ok'], 'bottom');
    this.toolService.showAlertBasic('Alerta','Privada no tiene Sim'
      ,'',['Ok'])
    return
  }

  try{

    this.loadingController.create({
      message: 'Abriendo ...',
      translucent: true
    }).then(async (res) => {
        res.present();
        if(use_twilio == 'false'){
          // Check if user is locked
          this.api.getData('api/users/notLocked/' + this.userId)
            .subscribe({
              next: async (res) => {
                  await this.sms.send(this.sim,this.msg,options)
                  .then(() => this.loadingController.dismiss())
                  .catch((e:any) => {
                      this.loadingController.dismiss();
                      this.toolService.showAlertBasic('Alerta','Error',
                        'Falla conexion a red telefonica',['Ok']);
                  });
              },
              error:async (err) => {
                this.loadingController.dismiss();
                await this.showAlert('','', 'Usuario bloqueado','btns', 'Ok','');
              }
          });
        }else{
          this.api.postData('api/twilio/open/' + 
          this.userId + '/' + this.msg + '/' + this.sim,'');
          this.loadingController.dismiss();
        }

    });
  }
  catch(e){
    this.toolService.showAlertBasic('Aviso','Ocurrio una excepción revisar:',
      `Error: ${e}`,['Cerrar']);
    
  }
}

  // -------   toast control alerts    ---------------------

async showAlert(Header:string, subHeader:string, msg:string, btns:any,
  txtConfirm:string, txtCancel:string) {
  const alert = await this.alertCtrl.create({
    header: Header,
    subHeader: subHeader,
    message: msg,
    backdropDismiss:false,
    buttons: [
      {
      text:txtCancel,
      role: 'cancel'
    },
    {
      text:txtConfirm,
      handler: async () =>{
        await this.api.logout();
        this.router.navigateByUrl('/',{replaceUrl:true});
        Utils.cleanLocalStorage();
            }
    
    }]
  });

  await alert.present();
}
}