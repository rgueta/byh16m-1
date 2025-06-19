import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdUsersPage } from './upd-users.page';

describe('UpdUsersPage', () => {
  let component: UpdUsersPage;
  let fixture: ComponentFixture<UpdUsersPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdUsersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
