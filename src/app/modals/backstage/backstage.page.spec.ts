import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackstagePage } from './backstage.page';

describe('BackstagePage', () => {
  let component: BackstagePage;
  let fixture: ComponentFixture<BackstagePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BackstagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
