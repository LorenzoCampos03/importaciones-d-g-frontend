import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

// Layouts
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { ClientLayoutComponent } from './layout/client-layout/client-layout.component';
import { SellerLayoutComponent } from './layout/seller-layout/seller-layout.component';

// Common Pages
import { DashboardComponent } from './feature/dashboard/dashboard.component';
import { ClientDashboardComponent } from './feature/dashboard/client-dashboard/client-dashboard.component';
import { LoginComponent } from './feature/auth/login/login.component';
import { RegisterComponent } from './feature/auth/register/register.component';
import { RoleRedirectComponent } from './core/helpers/role-redirect/role-redirect.component';

// Feature Components
import { ProductListComponent } from './feature/products/product-list/product-list.component';
import { ProductFormComponent } from './feature/products/product-form/product-form.component';
import { ClientListComponent } from './feature/client/client-list/client-list.component';
import { ClientFormComponent } from './feature/client/client-form/client-form.component';
import { ProfileEditComponent } from './feature/client/profile-edit/profile-edit.component';
import { LocationListComponent } from './feature/locations/location-list/location-list.component';
import { LocationDetailComponent } from './feature/locations/location-detail/location-detail.component';
import { LocationFormComponent } from './feature/locations/location-form/location-form.component';
import { EmployeeListComponent } from './feature/employees/employee-list/employee-list.component';
import { EmployeeFormComponent } from './feature/employees/employee-form/employee-form.component';
import { SaleListComponent } from './feature/sales/sale-list/sale-list.component';
import { SaleDetailComponent } from './feature/sales/sale-detail/sale-detail.component';
import { SaleFormComponent } from './feature/sales/sale-form/sale-form.component';
import { PurchaseListComponent } from './feature/purchases/purchase-list/purchase-list.component';

// Admin Purchase Components
import { AdminPurchaseListComponent } from './feature/purchases/admin/admin-purchase-list/admin-purchase-list.component';
import { AdminPurchaseDetailComponent } from './feature/purchases/admin/admin-purchase-detail/admin-purchase-detail.component';
import { AdminPurchaseFormComponent } from './feature/purchases/admin/admin-purchase-form/admin-purchase-form.component';

// Vendedor Purchase Components
import { VendedorPurchaseListComponent } from './feature/purchases/vendedor/vendedor-purchase-list/vendedor-purchase-list.component';
import { VendedorPurchaseDetailComponent } from './feature/purchases/vendedor/vendedor-purchase-detail/vendedor-purchase-detail.component';
import { VendedorPurchaseFormComponent } from './feature/purchases/vendedor/vendedor-purchase-form/vendedor-purchase-form.component';

// Detail Components
import { ProductDetailComponent } from './feature/products/product-detail/product-detail.component';
import { ClientDetailComponent } from './feature/client/client-detail/client-detail.component';
import { EmployeeDetailComponent } from './feature/employees/employee-detail/employee-detail.component';
import { PurchaseDetailComponent } from './feature/purchases/purchase-detail/purchase-detail.component';

// Seller Components
import { SellerDashboardComponent } from './feature/dashboard/seller-dashboard/seller-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: 'dashboard', component: RoleRedirectComponent, canActivate: [AuthGuard] },

  // Admin Routes
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Administrador'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'products', component: ProductListComponent },
      { path: 'products/new', component: ProductFormComponent },
      { path: 'products/edit/:id', component: ProductFormComponent },
      { path: 'products/:id', component: ProductDetailComponent },
      { path: 'clients', component: ClientListComponent },
      { path: 'clients/:id', component: ClientDetailComponent },
      { path: 'locations', component: LocationListComponent },
      { path: 'locations/create', component: LocationFormComponent },
      { path: 'locations/edit/:id', component: LocationFormComponent },
      { path: 'locations/:id', component: LocationDetailComponent },
      { path: 'employees', component: EmployeeListComponent },
      { path: 'employees/new', component: EmployeeFormComponent },
      { path: 'employees/edit/:id', component: EmployeeFormComponent },
      { path: 'employees/:id', component: EmployeeDetailComponent },
      { path: 'sales', component: SaleListComponent },
      { path: 'sales/:id', component: SaleDetailComponent },
      { path: 'purchases', component: AdminPurchaseListComponent },
      { path: 'purchases/:id', component: AdminPurchaseDetailComponent }
    ]
  }, // Seller Routes
  {
    path: 'seller',
    component: SellerLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Vendedor'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: SellerDashboardComponent },
      { path: 'products', component: ProductListComponent },
      { path: 'products/new', component: ProductFormComponent },
      { path: 'products/edit/:id', component: ProductFormComponent },
      { path: 'products/:id', component: ProductDetailComponent },
      { path: 'sales', component: SaleListComponent },
      { path: 'sales/new', component: SaleFormComponent },
      { path: 'sales/:id', component: SaleDetailComponent },
      { path: 'purchases', component: VendedorPurchaseListComponent },
      { path: 'purchases/new', component: VendedorPurchaseFormComponent },
      { path: 'purchases/edit/:id', component: VendedorPurchaseFormComponent },
      { path: 'purchases/:id', component: VendedorPurchaseDetailComponent }
    ]
  }, // Client Routes
  {
    path: 'client',
    component: ClientLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Cliente'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ClientDashboardComponent },
      { path: 'sales/:id', component: SaleDetailComponent }, // Detalle de venta para editar
      { path: 'purchases', component: PurchaseListComponent },
      { path: 'purchases/:id', component: PurchaseDetailComponent },
      { path: 'profile/edit', component: ProfileEditComponent }
    ]
  },

  { path: '**', redirectTo: '/login' }
];
