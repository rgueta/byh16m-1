import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdCoresPage } from './upd-cores.page';

describe('UpdCoresPage', () => {
  let component: UpdCoresPage;
  let fixture: ComponentFixture<UpdCoresPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdCoresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
