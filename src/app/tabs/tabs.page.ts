import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { settingsOutline, peopleOutline, keyOutline, timeOutline,
  homeOutline,
 } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon],
})
export class TabsPage {
  MyRole : string | null = 'visitor';
  public environmentInjector = inject(EnvironmentInjector);

  constructor() {
    addIcons({ settingsOutline, peopleOutline, keyOutline, timeOutline,homeOutline });
  }

  async ionViewWillEnter(){
    this.MyRole = localStorage.getItem('my-role');
  }
}
