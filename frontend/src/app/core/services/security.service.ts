import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private readonly SECURE_CONNECTION_KEY = 'secureConnection';

  constructor() {}

  /**
   * 보안접속 설정을 가져옵니다.
   */
  isSecureConnectionEnabled(): boolean {
    const stored = localStorage.getItem(this.SECURE_CONNECTION_KEY);
    return stored === 'true';
  }

  /**
   * 보안접속 설정을 저장합니다.
   */
  setSecureConnection(enabled: boolean): void {
    localStorage.setItem(this.SECURE_CONNECTION_KEY, enabled.toString());
    
    if (enabled) {
      this.enforceHttps();
    }
  }

  /**
   * 현재 프로토콜이 HTTPS인지 확인합니다.
   */
  isHttps(): boolean {
    return window.location.protocol === 'https:';
  }

  /**
   * HTTPS를 강제합니다.
   */
  enforceHttps(): void {
    if (!this.isHttps()) {
      // HTTPS로 리다이렉트 시도
      const httpsUrl = window.location.href.replace('http://', 'https://');
      window.location.href = httpsUrl;
    }
  }

  /**
   * 보안접속이 활성화되어 있고 HTTPS가 아닌 경우 경고를 표시합니다.
   */
  checkSecureConnection(): boolean {
    if (this.isSecureConnectionEnabled() && !this.isHttps()) {
      console.warn('보안접속이 활성화되어 있지만 HTTPS를 사용하지 않고 있습니다.');
      return false;
    }
    return true;
  }

  /**
   * API URL을 보안접속 설정에 따라 반환합니다.
   */
  getSecureApiUrl(baseUrl: string): string {
    if (this.isSecureConnectionEnabled() && !baseUrl.startsWith('https://')) {
      return baseUrl.replace('http://', 'https://');
    }
    return baseUrl;
  }
}
