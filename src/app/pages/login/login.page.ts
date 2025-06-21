import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from './../../services/authentication.service';
import { FormBuilder, FormControl, FormGroup, Validators ,ReactiveFormsModule } from '@angular/forms';
import { environment } from "../../../environments/environment";
import { AlertController, LoadingController,ModalController,Platform} from "@ionic/angular/standalone";
import { ScreenOrientation } from "@ionic-native/screen-orientation/ngx"
import { Device } from "@capacitor/device";
import { Utils } from 'src/app/tools/tools';
import { RequestsPage } from "../../modals/requests/requests.page";
import { Sim } from "@ionic-native/sim/ngx"; 
import { DatabaseService } from "../../services/database.service";
import { ToolsService } from 'src/app/services/tools.service';
import { Capacitor } from "@capacitor/core";
import { UpdUsersPage } from "../../modals/upd-users/upd-users.page";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonToolbar,
  IonButton, IonIcon, IonInput, IonItem} from '@ionic/angular/standalone';

import {addIcons} from "ionicons";
import { eye, eyeOffOutline } from 'ionicons/icons';



const USER_ROLES = 'my-roles';
const USER_ROLE = 'my-role';
const VISITORS = 'visitors';
const DEVICE_UUID = 'device-uuid';
const DEVICE_PKG = 'device-pkg';
const ADMIN_DEVICE = 'admin_device';

@Component({
    selector: 'app-login',
    templateUrl: 'login.page.html',
    styleUrls: ['login.page.scss'],
    standalone: true,
    imports: [IonContent, IonHeader, IonToolbar, IonButton,
      CommonModule, FormsModule, IonIcon, IonInput, IonItem,
      ReactiveFormsModule],
})

export class LoginPage implements OnInit {
  isAndroid:any;
  credentials!: FormGroup;
  configApp! : {};

  showPassword:boolean = false;
  passwordToggleIcon:string = "eye";

  // Easy access for form fields
   get email() {
    return this.credentials.get('email')!;
  }
  
  get password() {
    return this.credentials.get('pwd')!;
  }
  
 device_info:any;

 private  REST_API_SERVER = environment.cloud.server_url;
 public version = '';
 net_status:any;
 device_uuid:string='';
 admin_device:any;
 admin_sim:[] = [];
 admin_email:[] = [];

 public myToast:any;
 
  constructor(
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private orientation:ScreenOrientation,
    private loadingController: LoadingController,
    private router: Router,
    private alertController: AlertController,
    private modalController:ModalController,
    private SIM : Sim,
    private platform: Platform,
    private api : DatabaseService,
    public toolService:ToolsService,
  ) { 
    addIcons({ eye, eyeOffOutline });
  }
     
  async ngOnInit() {
    
    if (Capacitor.getPlatform() == 'android'){
      this.isAndroid = true;
    }else if(Capacitor.getPlatform() == 'ios'){
      console.log('Es platform --> ios');
    }else if(Capacitor.getPlatform() == 'ipad'){
      console.log('Es platform --> ipad');
    }else if(Capacitor.getPlatform() == 'iphone'){
      console.log('Es platform --> iphone');
    }else if(Capacitor.getPlatform() == 'web'){
      console.log('Es platform --> web');
      this.lockToPortrait();
    }else if(Capacitor.getPlatform() == 'cordova'){
      console.log('Es platform --> cordova');
    }
    
    
    this.getConfigApp();
    Utils.cleanLocalStorage();
    this.init();
    this.version = environment.app.version;

    this.credentials = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      pwd: new FormControl('', [Validators.required, Validators.minLength(4)]),
    });

    await Device.getInfo().then(async (DeviceInfo: any) => {

      console.log('DeviceInfo:', DeviceInfo);

      this.device_info = await JSON.parse(JSON.stringify(DeviceInfo));

      // get device uuid
      await Device.getId().then(async (deviceId:any) =>{
        await localStorage.setItem(DEVICE_UUID, await (deviceId['identifier']));
        this.device_uuid = await (deviceId['identifier']);
       });

       this.device_info.uuid = await this.device_uuid;
       await localStorage.setItem(DEVICE_PKG, await JSON.stringify(this.device_info));
  
       if (this.device_info.platform === 'android') {
         try {
            delete this.device_info.memUsed
            delete this.device_info.diskFree
            delete this.device_info.diskTotal
            delete this.device_info.realDiskFree
            delete this.device_info.realDiskTotal
         } catch (e) {
           console.log('soy android con Error: ', e);
       }
     }else{
       console.log('no soy android');
     }

     localStorage.setItem('device_info',JSON.stringify(this.device_info));

    });
      
      if (this.admin_device.includes(this.device_uuid)){
        this.credentials.get('email')!.setValue('ricardogueta@gmail.com');
        this.credentials.get('pwd')!.setValue('1234567');
      }
  }


  async init(): Promise<void> {
    await this.SIM.hasReadPermission()
    .then(async (allowed:any) => {
        if(!allowed){
          await this.SIM.requestReadPermission()
          .then()
          .catch((err : any) => { console.log('Sim Permission denied: '+ err) })
        }else{
          await this.SIM.getSimInfo()
            .then((info:any) => {
              console.log('Si estoy en init() allowed :', allowed)
              console.log('Sim info: ', info)})
            .catch((err:any) => console.log('Unable to get sim info: ' + err))
        }
      })
    .catch((err:any) => {
      console.log('Sim Permission denied, ' + err)})
 }

 // get Config App ----
 async getConfigApp(){
     await this.api.getData("api/config/").subscribe(async (result:any) =>{
      this.admin_device = result[0].admin_device;
      this.admin_sim = result[0].admin_sim;
      this.admin_email = result[0].admin_email;
      await localStorage.setItem('admin_sim',JSON.stringify(result[0].admin_sim));
      await localStorage.setItem(ADMIN_DEVICE,await result[0].admin_device);
      await localStorage.setItem('admin_email',await JSON.stringify(result[0].admin_email));
    });
 }

  lockToPortrait(){
    this.orientation.lock(this.orientation.ORIENTATIONS.PORTRAIT)
  }


  async login() {

    if(! await this.toolService.verifyNetStatus())
    {
      await this.toolService.toastAlert('No hay acceso a internet',
      0,['Ok'],'middle');
      return;
    }

    const loading = await this.loadingController.create();
    await loading.present();
    this.authService.login(this.credentials.value).subscribe(
      async res => {        
        await loading.dismiss();
        const roles:any = await localStorage.getItem(USER_ROLES); // typeof object

       for(const val_myrole of JSON.parse(roles)){
          if(localStorage.getItem('locked') === 'true')
          {
            await this.lockedUser('Usuario bloqueado !');
            return;
          }
          if(val_myrole.name === 'admin' || val_myrole.name === 'neighbor'
          || val_myrole.name === 'neighborAdmin'
          ){


            this.router.navigateByUrl('/tabs', { replaceUrl: true });
          }else{
           this.router.navigateByUrl('/store', { replaceUrl: true });
          }
        };

        // get config info
        this.getConfigApp();

      },
      async err  =>{
        if (err.error.errId == 1){
          console.log('Abrir registro');
        }
        await loading.dismiss();

        let msgErr='';

        const alert = await this.alertController.create({
          header: msgErr,
          message: err.error.ErrMsg,
          buttons: [
            {
              text : 'Registro nuevo ?',
              role : 'registro',
              handler : () => {
               this.newUser();
              }
            },
            { text : 'OK'}
          ],
        });

        await alert.present();
      }
    );
  }


  togglePassword():void{
    this.showPassword = !this.showPassword;
    if(this.passwordToggleIcon == 'eye'){
      this.passwordToggleIcon = 'eye-off';
    }
    else{
      this.passwordToggleIcon = 'eye';
    }
  }

async newUser(){
    const modal = await this.modalController.create({
      component: UpdUsersPage,
      componentProps:{
        'SourcePage': 'login',
        'CoreName': '',
        'CoreId': '',
        'pathLocation': ''
      }

    });
    
     await modal.present();
  
  }
  

async lockedUser(msg:string){
  const alert = await this.alertController.create({
    // header: msgErr,
    message: msg,
    buttons: [
      {
        text : 'OK',
        role : 'registro',
        handler : () => {
          const url = '/'
          this.router.navigateByUrl(url, {replaceUrl: true});
          // this.router.navigate([url] , { state : { from : 'login'}  }); //send parameters
        }
      }
    ],
  });

  await alert.present();
}

async pwdReset(){
  const modal = await this.modalController.create({
    component: RequestsPage,
    componentProps:{request:'pwdReset'}
  });

   await modal.present();

}

async openStore(){
  this.router.navigate(['/store']);
}


// -------------- Notifications ---------------------------

async showAlert(Header:string, subHeader:string, msg:string, btns:any) {
  const alert = await this.alertController.create({
    header: Header,
    subHeader: subHeader,
    message: msg,
    buttons: btns,
  });

  await alert.present();
}

}
