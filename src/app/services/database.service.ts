import { Injectable } from '@angular/core';
import { environment } from "../../environments/environment";
import { BehaviorSubject,from,of,Observable, throwError } from "rxjs";
import { tap, switchMap } from "rxjs/operators";
import { HttpClient, HttpHandler, HttpHeaders, HttpParams } from '@angular/common/http';
import {Router} from '@angular/router';
import { Utils } from "../tools/tools";

const REFRESH_TOKEN_KEY = 'my-refresh-token';
const TOKEN_KEY = 'my-token';
const TOKEN_EXP = 'token-exp';
const TOKEN_IAT = 'token-iat';
const USERID = 'my-userId';
const USER_ROLES = 'my-roles';
const CORE_SIM = 'my-core-sim';
const CORE_NAME = 'core-name';
const LOCATION = 'location';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public currentAccessToken: any;

  private  REST_API_SERVER = environment.cloud.server_url;
  collection : String = '';
  public roles:any;
  tokens!: { token: ''; refreshtoken: ''; coreName: ''; location: ''; };

  constructor(private http: HttpClient,
              private router: Router) {
                this.loadToken();
               }

      // Load accessToken on startup
  async loadToken() {
    const token = await localStorage.getItem(TOKEN_KEY);    
    if (token) {
      
      this.currentAccessToken = token;
      this.isAuthenticated.next(true);
    } else {
      this.isAuthenticated.next(false);
    }
  }



  // Potentially perform a logout operation inside your API
  // or simply remove all local tokens and navigate to login
  logout() {
    return this.http.post(`${this.REST_API_SERVER}api/auth/logout`, {}).pipe(
      switchMap(_ => {
        this.currentAccessToken = null;
        // Remove all stored tokens
        const deleteAccess = localStorage.removeItem(TOKEN_KEY);
        const deleteRefresh = localStorage.removeItem(REFRESH_TOKEN_KEY);
        return from(Promise.all([deleteAccess, deleteRefresh]));
      }),
      tap(_ => {
        this.isAuthenticated.next(false);
        this.router.navigateByUrl('', { replaceUrl: true });
      })
    ).subscribe();
  }


  // Load the refresh token from storage
  // then attach it as the header for one specific API call
  getNewAccessToken() {
    // const refreshToken = from<string>(localStorage.getItem(REFRESH_TOKEN_KEY));
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (localStorage.getItem(REFRESH_TOKEN_KEY)) {
        const httpOptions = {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`
          })
        }
        return this.http.get(`${this.REST_API_SERVER}api/auth/refresh`, httpOptions);
      } else {
        // No stored refresh token
        var modals = document.getElementsByTagName("ion-modal");
        [].forEach.call(modals, function (el:any) {
            el.parentNode.removeChild(el);
        });
        this.router.navigateByUrl('', { replaceUrl: true });
        return of(null);
      }
  }
  // Store a new access token
  storeAccessToken(token:any) {
    this.currentAccessToken = token.accessToken;
    localStorage.setItem('my-token', token.accessToken);
    localStorage.setItem(TOKEN_IAT,token.iatDate);
    localStorage.setItem(TOKEN_EXP,token.expDate);
    // get new refresh token-------------
    if(token.refreshToken !== '') localStorage.setItem(REFRESH_TOKEN_KEY,token.refreshToken);

    return from(this.currentAccessToken);
    // return from(this.storage.set(TOKEN_KEY, accessToken));
  }


  //---- GET data from server  ------
  getData_key(collection:String,data:any){
    const token = localStorage.getItem(TOKEN_KEY);
  let  options = {
    headers : {
      'Accept': 'application/json',
      'content-type' :'application/json',
      'Access-Control-Allow-Headers': 'Content-Type',
      'authorization' : `Bearer ${token}`,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT'
    }
    }

    return this.http.get(this.REST_API_SERVER + collection, options);
  }

 getData(collection:String) {
    const token = localStorage.getItem(TOKEN_KEY);
    let  options = {
      headers :{
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT',
    'Access-Control-Allow-Headers': 'x-requested-with, Content-Type, origin, authorization, accept, client-security-token',
    'Access-Control-Allow-Origin': '*',
    'content-type' : 'application/json',
    'authorization' : `Bearer ${token}`,
    }
    }

    return this.http.get(this.REST_API_SERVER + collection ,options);
  }


//--- POST data to server

 async postData_noToken(collection:String, data:any){
  let  options = {
    headers : {
      'Accept': 'application/json',
      'content-type' :'application/json',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT'
    }
  }

    return new Promise((resolve, reject) => {
      this.http.post(this.REST_API_SERVER + collection , data, options)
      .subscribe(res => {
        resolve(res);
      }, error => {
        reject(error)
      });
    })
  }


  async postData(collection:String,data:any){
    const token = await localStorage.getItem(TOKEN_KEY);
    
    let  options = {
      headers : {
    'content-type' : 'application/json',
    'authorization' : `Bearer ${token}`,
    }
    }

    return new Promise((resolve, reject) => {
      this.http.post(this.REST_API_SERVER + collection , data, options)
      .subscribe(res => {
        resolve(res);
      }, error => {
        reject(error)
      });
    })
  }

  async postDataInfo(collection:String,data:any, params:{}){
    const token = await localStorage.getItem(TOKEN_KEY);
    
    let  options = {
      headers : {
        'content-type' : 'application/json',
        'authorization' : `Bearer ${token}`,
        },
      params: params
    }

    return new Promise((resolve, reject) => {
      this.http.post(this.REST_API_SERVER + collection , data, options)
      .subscribe(res => {
        resolve(res);
      }, error => {
        reject(error)
      });
    })
  }

  async postRegisterData(url:String,data:any){
    const token = localStorage.getItem(TOKEN_KEY);
    
  let  options = {
    headers : {
      'content-type' :'application/json',
      'authorization' : `Bearer ${token}`,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT'
    }
    }

      return new Promise((resolve, reject) => {this.http.post(this.REST_API_SERVER + url , data, options)
      .subscribe(res=> {
        resolve(res)
      
      }, error => {
        reject(error);
      });
    });

  }

 postRegister(url:String,data:any){
  console.log('postRegister ------ ');
  let  options = {
    headers : {
      'Accept': 'application/json',
      'content-type' :'application/json',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT'
    }
    }

    return this.http.post(this.REST_API_SERVER + url , data, options)
  }

  //--- PUT data to server
  async putData(collecion:String,data:any){
    const token = localStorage.getItem(TOKEN_KEY);

  let  options = {
    headers : {
      'content-type' :'application/json',
      'authorization' :  `Bearer ${token}`,
    }
    }

  return new Promise((resolve, reject) => {this.http.put(this.REST_API_SERVER + collecion , data, options)
      .subscribe(data => {
        console.log('http put success --> ',data);
        resolve(data);
      
      }, error => {
        console.log('http put error --> ',error);
        reject(error);
      });
    });
  }

  //--- DELETE data to server
  async deleteData(collection:String){
    const token = await localStorage.getItem(TOKEN_KEY);

  let  options = {
    headers : {
      'Accept': 'application/json',
      'authorization': `Bearer ${token}`
    }
  }
      
  return new Promise((resolve, reject) => {
    this.http.delete(this.REST_API_SERVER + collection , options)
    .subscribe(res => {
      resolve(res);
    }, error => {
      reject(error)
    });
  })


  }
}

