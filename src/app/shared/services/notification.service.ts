import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor() {}

  private showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning', duration: number = 4000) {
    const notification = document.createElement('div');
    notification.className = `
               fixed top-6 right-6 z-[9999]
               w-96 max-w-[90vw]
               bg-gradient-to-br from-white via-gray-50 to-slate-100
               border border-gray-200
               rounded-2xl shadow-xl shadow-gray-200/50
               transform transition-all duration-500 ease-out
               translate-x-full opacity-0 scale-95
               hover:scale-[1.02] hover:shadow-2xl hover:shadow-gray-300/60
               overflow-hidden
          `;

    const typeStyles = {
      success: {
        accent: 'from-emerald-400 via-green-500 to-teal-400',
        bg: 'bg-gradient-to-br from-emerald-100 to-green-50',
        text: 'text-emerald-700',
        icon: 'text-emerald-600',
        glow: 'shadow-emerald-300/40',
        border: 'border-emerald-200'
      },
      error: {
        accent: 'from-rose-400 via-red-500 to-pink-400',
        bg: 'bg-gradient-to-br from-rose-100 to-red-50',
        text: 'text-rose-700',
        icon: 'text-rose-600',
        glow: 'shadow-rose-300/40',
        border: 'border-rose-200'
      },
      warning: {
        accent: 'from-amber-400 via-yellow-500 to-orange-400',
        bg: 'bg-gradient-to-br from-amber-100 to-yellow-50',
        text: 'text-amber-700',
        icon: 'text-amber-600',
        glow: 'shadow-amber-300/40',
        border: 'border-amber-200'
      },
      info: {
        accent: 'from-blue-400 via-sky-500 to-cyan-400',
        bg: 'bg-gradient-to-br from-blue-100 to-sky-50',
        text: 'text-blue-700',
        icon: 'text-blue-600',
        glow: 'shadow-blue-300/40',
        border: 'border-blue-200'
      }
    };

    const currentStyle = typeStyles[type];

    notification.innerHTML = `
               <div class="h-2 bg-gradient-to-r ${currentStyle.accent} shadow-md ${currentStyle.glow}"></div>

               <div class="p-6 bg-white/90">
                    <div class="flex items-start space-x-4">
                         <div class="flex-shrink-0">
                              <div class="relative">
                                   <div class="w-12 h-12 rounded-2xl ${currentStyle.bg} ${currentStyle.border} border-2 flex items-center justify-center transform transition-all duration-300 hover:rotate-6 hover:scale-110 shadow-lg ${currentStyle.glow}">
                                        ${this.getIcon(type)}
                                   </div>
                                   <div class="absolute inset-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${currentStyle.accent} animate-ping opacity-20"></div>
                              </div>
                         </div>

                         <div class="flex-1 min-w-0 pt-2">
                              <div class="text-base font-semibold ${currentStyle.text} leading-relaxed">
                                   ${message}
                              </div>
                         </div>

                         <button type="button" class="
                              flex-shrink-0 w-9 h-9
                              flex items-center justify-center
                              rounded-xl transition-all duration-300
                              text-gray-400 hover:text-gray-600
                              hover:bg-gray-100 focus:bg-gray-100
                              focus:outline-none focus:ring-2 focus:ring-gray-300
                              group hover:scale-110 hover:rotate-90
                         ">
                              <svg class="w-4 h-4 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                                   <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                         </button>
                    </div>
               </div>

               <div class="relative h-2 bg-gray-100 overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-r ${currentStyle.accent} transform origin-left transition-transform duration-linear ease-linear scale-x-100 shadow-md ${currentStyle.glow}"
                         style="animation: shrink ${duration}ms linear forwards;"></div>
               </div>
          `;

    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
                    @keyframes shrink {
                         from { transform: scaleX(1); }
                         to { transform: scaleX(0); }
                    }
                    .shadow-3xl {
                         box-shadow: 0 35px 70px -15px rgba(148, 163, 184, 0.3);
                    }
               `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    const closeButton = notification.querySelector('button');
    closeButton?.addEventListener('click', () => {
      this.removeNotification(notification);
    });

    requestAnimationFrame(() => {
      setTimeout(() => {
        notification.classList.remove('translate-x-full', 'opacity-0', 'scale-95');
        notification.classList.add('translate-x-0', 'opacity-100', 'scale-100');
      }, 50);
    });

    setTimeout(() => {
      this.removeNotification(notification);
    }, duration);

    let isPaused = false;
    const progressBar = notification.querySelector('.bg-gradient-to-r') as HTMLElement;

    notification.addEventListener('mouseenter', () => {
      if (progressBar) {
        progressBar.style.animationPlayState = 'paused';
        isPaused = true;
      }
    });

    notification.addEventListener('mouseleave', () => {
      if (progressBar && isPaused) {
        progressBar.style.animationPlayState = 'running';
        isPaused = false;
      }
    });
  }

  private removeNotification(notification: HTMLElement) {
    notification.classList.add('translate-x-full', 'opacity-0', 'scale-95');
    setTimeout(() => {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
    }, 500);
  }

  private getIcon(type: 'success' | 'error' | 'info' | 'warning'): string {
    switch (type) {
      case 'success':
        return `
                         <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                         </svg>
                    `;
      case 'error':
        return `
                         <svg class="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                         </svg>
                    `;
      case 'warning':
        return `
                         <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                         </svg>
                    `;
      case 'info':
        return `
                         <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                         </svg>
                    `;
      default:
        return '';
    }
  }

  success(message: string, duration: number = 4000) {
    this.showNotification(message, 'success', duration);
  }

  error(message: string, duration: number = 6000) {
    this.showNotification(message, 'error', duration);
  }

  warning(message: string, duration: number = 5000) {
    this.showNotification(message, 'warning', duration);
  }

  info(message: string, duration: number = 4000) {
    this.showNotification(message, 'info', duration);
  }

  custom(message: string, type: 'success' | 'error' | 'info' | 'warning', duration: number = 4000) {
    this.showNotification(message, type, duration);
  }
}
