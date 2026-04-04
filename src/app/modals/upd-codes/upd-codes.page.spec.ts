import { ComponentFixture, TestBed } from "@angular/core/testing";
import { UpdCodesPage } from "./upd-codes.page";

describe("UpdCodesPage", () => {
  let component: UpdCodesPage;
  let fixture: ComponentFixture<UpdCodesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdCodesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
