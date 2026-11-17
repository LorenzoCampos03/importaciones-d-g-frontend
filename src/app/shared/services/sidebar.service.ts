import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private isCollapsedSubject = new BehaviorSubject<boolean>(false);
  private isMobileOpenSubject = new BehaviorSubject<boolean>(false);

  isCollapsed$ = this.isCollapsedSubject.asObservable();
  isMobileOpen$ = this.isMobileOpenSubject.asObservable();

  constructor() {
    fromEvent(document, 'click')
      .pipe(filter(() => window.innerWidth < 768 && this.isMobileOpen))
      .subscribe((event: any) => {
        const clickedElement = event.target;
        const sidebar = document.querySelector('.sidebar-container');
        const mobileButton = document.querySelector('[data-mobile-toggle]');

        if (sidebar && !sidebar.contains(clickedElement) && mobileButton && !mobileButton.contains(clickedElement)) {
          this.closeMobileMenu();
        }
      });
  }

  toggleCollapse(): void {
    this.isCollapsedSubject.next(!this.isCollapsedSubject.value);
  }

  toggleMobileMenu(): void {
    this.isMobileOpenSubject.next(!this.isMobileOpenSubject.value);
  }

  closeMobileMenu(): void {
    this.isMobileOpenSubject.next(false);
  }

  setCollapsed(isCollapsed: boolean): void {
    this.isCollapsedSubject.next(isCollapsed);
  }

  get isCollapsed(): boolean {
    return this.isCollapsedSubject.value;
  }

  get isMobileOpen(): boolean {
    return this.isMobileOpenSubject.value;
  }
}
