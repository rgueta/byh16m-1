import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController, AnimationController,AlertController, LoadingController,
         IonContent, IonHeader, IonTitle, IonToolbar, IonSelectOption,
        IonSelect, IonLabel,IonItem, IonToggle,IonIcon,IonList,
      IonAccordion, IonAccordionGroup,IonInput,IonRefresher,IonRefresherContent,
    IonRouterOutlet,IonMenu,IonMenuButton,IonButtons } from '@ionic/angular/standalone';
import { UpdCoresPage } from "../../modals/upd-cores/upd-cores.page";
import { UsersPage } from '../../modals/users/users.page';
import { DatabaseService } from '../../services/database.service';
import { UpdCpusPage } from "../../modals/upd-cpus/upd-cpus.page";
import { SMS, SmsOptions } from '@ionic-native/sms/ngx';
import { InfoPage } from "../../modals/info/info.page";
import { ToolsService } from "../../services/tools.service";
import { UpdUsersPage } from "../../modals/upd-users/upd-users.page";
import { BackstagePage } from "../../modals/backstage/backstage.page";
import { NgFor, NgIf } from '@angular/common';
import { addIcons } from 'ionicons';
import { chevronUpOutline, chevronDownOutline, 
  addOutline, chevronForwardOutline,people, trashOutline} from 'ionicons/icons';

const TWILIO = 'twilio';
const EMAIL_TO_VISITOR = 'emailToVisitor'
const EMAIL_TO_CORE = 'emailToCore'

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports:[
    IonContent, IonHeader, IonTitle, IonToolbar,
    CommonModule, FormsModule,NgFor, NgIf, IonSelectOption,IonSelect,
    IonLabel,IonItem, IonToggle,IonIcon,IonList,IonAccordion,IonAccordionGroup,
    IonInput,IonRefresher,IonRefresherContent,IonRouterOutlet,IonMenu,
    IonMenuButton,IonButtons

  ]
})
export class AdminPage implements OnInit {

  // #region data options menu -----------------
  routineOptions = [
    {'cmd':'ModuleRST','name':'Reboot module','confirm':'Reboot module ?'},
    {'cmd':'getSIMstatus','name':'Module status','confirm':'Request module status?'},
    {'cmd':'getConfig','name':'Config status','confirm':'Request config status?'},
    {'cmd':'RestraintStatus','name':'Restraint status','confirm':'Request restraint status?'},
    {'cmd':'status,extrange','name':'Extrange status','confirm':'Request extrange status?'},
    {'cmd':'getActiveCodes','name':'Active codes SMS','confirm':'Request active codes?'},
    {'cmd':'uploadEvents','name':'Upload events','confirm':'Upload events?'},
    {'cmd':'uploadRestraint','name':'Upload restraint','confirm':'Upload restraint?'},
    {'cmd':'uploadCodes','name':'Upload codes','confirm':'Upload codes?'},
    {'cmd':'uploadExtrange','name':'Upload extrange','confirm':'Upload extrange?'},
    {'cmd':'uploadNFC','name':'Upload NFC','confirm':'Upload NFC?'},
    {'cmd':'getHouseNFC','input':true,'option1':'house-nfc','option2':'House Number',
        'name':'House NFC','confirm':'get House NFC?'},

    {'cmd':'cfgCHG','option1':'app','option2':'coreId','option3':'',
      'name':'Change core Id','confirm':'Change core Id?'},

    {'cmd':'cfgCHG','option1':'app','option2':'openByCode','option3':'gate',
      'name':'Code open Gate','confirm':'Open gate with code?'},

    {'cmd':'cfgCHG','option1':'app','option2':'openByCode','option3':'magnet',
      'name':'Code open Magnet','confirm':'Open magnet with code?'},

    {'cmd':'cfgCHG','option1':'keypad_matrix','option2':'default','option3':'flex',
      'name':'Set Keypad flex','confirm':'Set keypad flex?'},

    {'cmd':'cfgCHG','option1':'keypad_matrix','option2':'default','option3':'hardPlastic',
      'name':'Set Keypad hard plastic','confirm':'Set keypad hardPlastic?'},

    {'cmd':'cfgCHG','option1':'app','option2':'debugging','option3':'true',
      'name':'Set debug mode','confirm':'Set debug On?'},

    {'cmd':'cfgCHG','option1':'app','option2':'debugging','option3':'false',
      'name':'Remove debug mode','confirm':'Set debug Off?'},

    {'cmd':'cfgCHG','input':true,'option1':'app','option2':'settingsCode',
      'name':'Change settings Code','confirm':'Change settingsCode ?'},

    {'cmd':'cfgCHG','input':true,'option1':'app','option2':'pwdRST',
      'name':'Change pwdRST','confirm':'Change pwdRST ?'},

    {'cmd':'cfgCHG','option1':'app','option2':'demo','option3':'true',
      'name':'Set demo mode','confirm':'Set demo On?'},

    {'cmd':'cfgCHG','option1':'app','option2':'demo','option3':'false',
      'name':'Remove demo mode','confirm':'Set demo Off?'},

    {'cmd':'cfgCHG','option1':'app','option2':'rotate','option3':'true',
      'name':'Set rotate mode','confirm':'Set rotate On?'},

    {'cmd':'cfgCHG','option1':'app','option2':'rotate','option3':'false',
      'name':'Remove rotate mode','confirm':'Set rotate Off?'},

    {'cmd':'cfgCHG','option1':'sim','option2':'sendCodeEvents','option3':'true',
      'name':'Save code events','confirm':'Yes save code events?'},

    {'cmd':'cfgCHG','option1':'sim','option2':'sendCodeEvents','option3':'false',
      'name':'Not save code events','confirm':'Not save code events?'},
  ]
  // #endregion data options menu


 public SourcePage:string = 'admin';
  public CoresList:any;
  public myUserList:any;
  automaticClose = false;
  public userId : any;
  myToast:any;
  public routineOpen=false;
  localenable:boolean=true;
  visitorId:string='';
  emailToVisitor: boolean = true;
  public simSectionOpen = false;
  sim:string = '';
  public core_sim:string = '';
  public routine_byh16s:string = '';
  input: boolean = false;
  backstageList:any;
  RoleList:any;
  demoMode:boolean = false;

  constructor(
        public animationController : AnimationController,
        public modalController : ModalController,
        public api : DatabaseService,
        private sms: SMS,
        // private toast: ToastController,
        public alertCtrl: AlertController,
        // public routerOutlet :IonRouterOutlet 
        private toolService:ToolsService,
        private loadingController : LoadingController
    ) {
      addIcons({chevronUpOutline,chevronDownOutline,chevronForwardOutline,
       people,trashOutline
    });
    }

  
  async ngOnInit() {
    console.log('Llegue al init de admin...');

  }


  async ngOnInit_() {
    console.log('Llegue al init de admin...');
    this.core_sim = await localStorage.getItem('my-core-sim')!;
    this.userId = await localStorage.getItem('my-userId')!;
    this.emailToVisitor = await (localStorage.getItem('emailToVisitor') === 'true');
    this.getCores();
    if(!localStorage.getItem('roles')){
      this.getRoles();
    }

    if (localStorage.getItem('demoMode')){
      this.demoMode = localStorage.getItem('demoMode') == 'true' ? true : false
    }
    
  }

  DemoMode(){
    this.demoMode = !this.demoMode;
    localStorage.setItem('demoMode', this.demoMode.toString())
  }

  async getCores(){
    await this.api.getData('api/cores/admin/'  + this.userId).subscribe(async result =>{
      this.CoresList = await result;
      this.CoresList[0].open = true;
    },error => {
      console.log('Error response --> ', JSON.stringify(error))
    });
  }

  async getRoles(){
    this.api.getData('api/roles/' + localStorage.getItem('my-userId'))
      .subscribe(async (result: any) => {
        this.RoleList = await result;
        localStorage.setItem('roles',JSON.stringify(result));
      }, (error:any) => {
        console.log('Error response --> ', JSON.stringify(error));
      });
  }


  async clicked(item:string){
    console.log('clicked: ', item);
  }

  async doRefresh(event:any){
    this.getCores();

    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  async closeModal(){
    await this.modalController.dismiss({'msg':'just to call onDidDismiss'});
  } 

  async addNewUser(CoreId:string,CoreName:string, pathLocation:string){
    const modal = await this.modalController.create({
      component: UpdUsersPage,
      componentProps:{
        'SourcePage': 'adminNew',
        'CoreName': CoreName,
        'CoreId': CoreId,
        'pathLocation': pathLocation
       }
    });
    
     await modal.present();
  
  }

  

  async modalUpdCores() {
    const modal = await this.modalController.create({
      component: UpdCoresPage,
      backdropDismiss: true,
      componentProps: {retorno: Boolean}
    });

    modal.onDidDismiss()
    .then(async (data) =>{
      if(data.data) {
        this.getCores();
      }
    });
  
    modal.present();
  
  }

  async modalUpdCpus() {
    const modal = await this.modalController.create({
      component: UpdCpusPage,
    });
    return await modal.present();
  
  }

  async modalUpdInfo(){
    const modal = await this.modalController.create({
      component : InfoPage
    });
    return await modal.present()
  }

  async modalBackstage(){
    const modal = await this.modalController.create({
      component : BackstagePage
    });
    return await modal.present()
  }


  async routineSelected(event:any, index:number, item:any){
    if(this.routineOptions[index]['input']){
      this.input = true;
    }else{
      this.input = false;
    }

    if(this.routineOptions[index]['option1']){
      item['option1'] = this.routineOptions[index]['option1'];
    }

    if(this.routineOptions[index]['option2']){
      item['option2'] = this.routineOptions[index]['option2'];
    }

    if(this.routineOptions[index]['option3']){
      item['option3'] = this.routineOptions[index]['option3'];
    }

    this.alertCtrlEvent(event, item,'Confirm', 
      this.routineOptions[index]['confirm'],
      this.routineOptions[index]['cmd'], 'Yes', 'Cancel',index);
  }

  
  async simChange(event:any,item:any){
   this.alertCtrlEvent(event,item,'Confirm','New sim: '+ this.sim + 
    ' ?', 'simChange', 'Yes','Cancel');
 }

async setupCode(visitorId:string){

}

async newExtrange(CoreId:string,CoreName:string, pathLocation:string){
   const modal = await this.modalController.create({
      component: UpdUsersPage,
      componentProps:{
        'SourcePage': 'adminNewExtrange',
        'CoreName': CoreName,
        'CoreId': CoreId,
        'pathLocation': pathLocation
       }
    });
    
     await modal.present();
}

  async collectUsers(coreId:string,core:string) {
    const modal = await this.modalController.create({
      component: UsersPage,
      backdropDismiss: true,
      componentProps: {'CoreId' : coreId,'coreName':core}
    });

    modal.onDidDismiss()
    modal.present();
  }

  async collectBackstage(id:string,name:string){
    console.log(`Id ${id}, name: ${name}`)
  }


  async chgRemoteButton(event:any,item:any) {
    let titleMsg = ' Remote to false: ';

    if(event.target.checked)
    {
      titleMsg = 'Remote to true: ';
    }

    if(event.target.checked != item.remote){
      this.alertCtrlEvent(event,item,'Confirm', titleMsg + ' ' + item.name + ' ?',
       'chgRemoteButtons', 'Yes', 'Cancel')
    }
  }

  async chgStatusCore(event:any,item:any) {
    let titleMsg = 'Disable ';

    if(event.target.checked)
    {
      titleMsg = 'Enable ';
    }

    if(event.target.checked != item.enable){
      this.alertCtrlEvent(event,item,'Confirm', titleMsg + ' ' + item.name + ' ?',
       'chgStatusCore', 'Yes', 'Cancel')
    }
  }

  async TwilioToggleEven($event:any){
    if($event.detail.checked){
      console.log('Usar twilio');
      await localStorage.setItem(TWILIO,'true');
    }else{
      console.log('Usar Sim');
      await localStorage.setItem(TWILIO,'false');
    }
  }

  async EmailVisitorToggleEven($event:any){
    if($event.detail.checked){
      await localStorage.setItem(EMAIL_TO_VISITOR,'true');
    }else{
      await localStorage.setItem(EMAIL_TO_VISITOR,'false');
    }
  }

  async EmailCoreToggleEven($event:any){
    if($event.detail.checked){
      await localStorage.setItem(EMAIL_TO_CORE,'true');
    }else{
      await localStorage.setItem(EMAIL_TO_CORE,'false');
    }
  }

  async modalUpdCity(){
    this.toolService
    this.toolService.toastAlert('Process new city ',0, ['Ok'], 'bottom');
  }

// region Main Accordion list  --------------------------------------

  toggleSection(index:number){
    this.CoresList[index].open = !this.CoresList[index].open;
    if(this.automaticClose && this.CoresList[index].open){
      this.CoresList
      .filter((item:{}, itemIndex:number) => itemIndex != index)
      .map((item:any) => item.open = false);
    }
  }

  toggleItem(index:number, childIndex:number){
    this.CoresList[index].children[childIndex].open = !this.CoresList[index].open;
  }

// end region

// region Routines Accordion list  --------------------------------------

toggleSectionRoutines(){
  this.routineOpen = !this.routineOpen
}

// end region

// region sim Section Routine -------------------------------
toggleSectionSim(){
  this.simSectionOpen = !this.simSectionOpen
}

// endregion   --------------------------------------------

async getTimestamp(){
  var myDate = new Date();
  var offset = myDate.getTimezoneOffset() * 60 * 1000;

  var withOffset = myDate.getTime();
  var withoutOffset = withOffset - offset;
  return withoutOffset
}

//region ------- alert controlers region   ---------------------

  async alertCtrlEvent(event:any,item:any,titleMsg:string,Message:string,
    option:string, txtConfirm:string, txtCancel:string, index: number = 0){
    
    let element = <HTMLInputElement> document.getElementById(event.srcElement.id);

    let inputs = [{name: 'inputValue',placeholder: item.option2}];

    if(!this.input){
      inputs = [];
    }

    let alert = await this.alertCtrl.create({
      header: titleMsg,
      message: Message,
      inputs : inputs,
      buttons: [
        {
          text: txtCancel,
          role: 'cancel',
          cssClass: 'icon-color',
          handler: () => {
            switch(option){
              case 'chgStatusCore':
              case 'chgRemoteButtons':
                element.checked = !event.target.checked;
                break;
              default:
                break;
            }
          }
        },
        {
          text: txtConfirm,
          cssClass: 'icon-color',
          handler: async data => {
            switch(option){
              case 'chgStatusCore':
              case 'chgRemoteButtons':
                  if(await this.toolService.verifyNetStatus()){
                    let jsonItem : any;
                    let valueItem = '';
                    switch(option){
                      case 'chgStatusCore':
                       valueItem = 'enable';
                        break
                      case 'chgRemoteButtons':
                        valueItem = 'remote';
                        break
                    }
                    const strJson = '{"coreId" : "' + item._id + '","item" : { "' 
                      + valueItem + '" : ' +  event.target.checked + '}}';

                    jsonItem = JSON.parse(strJson);

                    await this.api.postData('api/cores/chgItem/' + this.userId,
                      jsonItem).then(async (onResolve) =>{
                      if(option == 'chgRemoteButtons'){
                        localStorage.setItem('remote',event.target.checked.toString())
                      }

                      await this.getCores();
                    },
                    (onReject) =>{
                      this.toolService.toastAlert('Can not enable core, error: <br>' + 
                        JSON.stringify(onReject),0,['Ok'],'bottom');
                    });


                  }else{
                    this.toolService.toastAlert('No hay Acceso a internet',0,['Ok'],'middle');
                  }
                break;
              case 'simChange':

                this.loadingController.create({
                message: 'Cambiando numero sim...',
                translucent: true
                }).then(async (res) => {
                  res.present();

                  localStorage.setItem('my-core-sim',this.sim)

                  try{
                    if (this.sim.length >= 10 ){
                      if(await this.toolService.verifyNetStatus()){

                        await this.api.postData('api/cores/chgSim/' + this.userId ,
                          {'coreId':item._id, 'newSim':this.sim})
                          .then(async (result) => {
                            // Change sim on pcb
                            var options:SmsOptions={
                              replaceLineBreaks:false,
                              android:{
                                intent:''
                              }
                            } 
                            await this.sms.send(item.Sim,'cfgCHG,' + await this.getTimestamp() + 
                              ',sim,value,' + this.sim, options)
                            .then(() =>{
                              this.sim = '';
                              this.getCores();
                              this.simSectionOpen = false;
                              this.toolService.toastAlert('Sim cambiado ' +
                                this.sim,0, ['Ok'], 'bottom')
                            })
                            .catch((err) =>{
                              this.loadingController.dismiss();
                              this.toolService.toastAlert('Falla conexion a red telefonica'
                                ,0, ['Ok'], 'bottom')
                                return
                            })
                            
                        })
                          .catch((error) => {
                            this.loadingController.dismiss();
                            this.toolService.toastAlert('chgSim API error: <br>' +
                            JSON.stringify(error),0,['Ok'],'bottom');
                            return
                          });

                          this.loadingController.dismiss();

                      }else{
                        this.loadingController.dismiss();
                        this.toolService.toastAlert('No hay Acceso a internet',0,['Ok'],'middle');
                      }
                    }else{
                      this.loadingController.dismiss();
                      this.toolService.toastAlert('Formato Invalido',0, ['Ok'], 'bottom')
                    }
        
                  }catch(e){
                    this.loadingController.dismiss();
                    this.toolService.toastAlert('Sim no cambiado, error:<br>' 
                      + JSON.stringify(e),0, ['Ok'], 'bottom');
                  }
                });
                break;
              case 'getSIMstatus':
                  this.sendSms(item.Sim, 'status,' + await this.getTimestamp() + ',gral')
                break;
              
              case 'getConfig':
                  this.sendSms(item.Sim, 'status,' + await this.getTimestamp() + ',getConfig')
                break;
              case 'getHouseNFC':
                if(data.inputValue == ''){
                  this.toolService.showAlertBasic('Alerta','Error, ' + option,
                    'informacion incompleta',['Ok']);
                }else{
                this.sendSms(item.Sim, option + ',' + await this.getTimestamp() + ',' + data.inputValue);
                }
                break;
              case 'RestraintStatus':
                    await this.sendSms(item.Sim,'status,' + await this.getTimestamp() + ',restraint');
                  break;
              
              case 'status,extrange':
                  await this.sendSms(item.Sim, option);
                break;

              case 'ModuleRST':
                  await this.sendSms(item.Sim,'rst,' + await this.getTimestamp());
                break;
              case 'getActiveCodes':
                  await this.sendSms(item.Sim,'active_codes,' + await this.getTimestamp());
                break;

              case 'uploadEvents':
              case 'uploadRestraint':
              case 'uploadCodes':
              case 'uploadExtrange':
              case 'uploadNFC':
                  await this.sendSms(item.Sim,option + ',' + await this.getTimestamp());
                break;

              case 'setOpen':
                  await this.sendSms(item.Sim,'setOpenCode,' + await this.getTimestamp() 
                      + ',' + item.option1);
                break;
              case 'setKeypad':
                  await this.sendSms(item.Sim,'setKeypad,' + await this.getTimestamp() 
                      + ',' + item.option1);
                break;
              case 'cfgCHG':
                try{

                  if(this.input){
                    if(data.inputValue == ''){
                      this.toolService.showAlertBasic('Alerta','Error, ' + option,
                        'informacion incompleta',['Ok']);
                    }else{
                      await this.sendSms(item.Sim,'cfgCHG,' + await this.getTimestamp() + ',' + 
                        item.option1 + ',' + item.option2 + ',' + data.inputValue);
                    }
                  }else{
                    if (this.routineOptions[index]['option2'] == 'coreId'){
                      await this.sendSms(item.Sim,'cfgCHG,' + await this.getTimestamp() + ',' + 
                        item.option1 + ',' + item.option2 + ',' + item._id);

                    }else{
                      await this.sendSms(item.Sim,'cfgCHG,' + await this.getTimestamp() + ',' + 
                        item.option1 + ',' + item.option2 + ',' + item.option3);
                    }
                  }
                }
                catch(e){
                    this.toolService.toastAlert('No enviado, error:<br>' + 
                        JSON.stringify(e),0, ['Ok'], 'bottom');
                  }
                break;
            }
          }
        }
      ]
    });

    await alert.present();

  }

  async sendSms(sim:string, cmd:any){
    const options:SmsOptions={
      replaceLineBreaks:false,
      android:{
        intent:''
      }
    }

    this.loadingController.create({
      message: 'Espere un momento ...',
      translucent: true
    }).then(async (res) => {
      res.present();

      try{
        await this.sms.send(sim, cmd ,options)
                  .then(() => this.loadingController.dismiss())
                  .catch((e:any) => {
                    this.loadingController.dismiss();
                    this.toolService.showAlertBasic('Alerta','Falla conexion a red telefonica'
                    ,'',['Ok'])
                  });
        this.toolService.toastAlert('Msg. enviado a ' + sim,0, ['Ok'], 'bottom');
      }catch(e){
        this.loadingController.dismiss()
        this.toolService.toastAlert('No se envio, error: <br>' + JSON.stringify(e),0, ['Ok'], 'bottom');
      }
      
    });

  }
  


  showLoading(duration:number, msg:string) {
    this.loadingController.create({
        message: msg,
        duration: duration,
        translucent: true
    }).then((res) => {
        res.present();
    });
}


}
