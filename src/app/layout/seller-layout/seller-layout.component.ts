import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { SidebarService } from '../../shared/services/sidebar.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-seller-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './seller-layout.component.html',
  styleUrl: './seller-layout.component.css'
})
export class SellerLayoutComponent {
  isCollapsed$: Observable<boolean>;

  constructor(private sidebarService: SidebarService) {
    this.isCollapsed$ = this.sidebarService.isCollapsed$;
  }
}
