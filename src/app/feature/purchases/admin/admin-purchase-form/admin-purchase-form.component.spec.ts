import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPurchaseFormComponent } from './admin-purchase-form.component';

describe('AdminPurchaseFormComponent', () => {
     let component: AdminPurchaseFormComponent;
     let fixture: ComponentFixture<AdminPurchaseFormComponent>;

     beforeEach(async () => {
          await TestBed.configureTestingModule({
               imports: [AdminPurchaseFormComponent]
          })
               .compileComponents();

          fixture = TestBed.createComponent(AdminPurchaseFormComponent);
          component = fixture.componentInstance;
          fixture.detectChanges();
     });

     it('should create', () => {
          expect(component).toBeTruthy();
     });
});
