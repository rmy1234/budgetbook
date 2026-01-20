import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SecurityService } from '../../../core/services/security.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  secureConnection = false;
  isHttps = false;
  isLocalhost = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private securityService: SecurityService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // 저장된 보안접속 설정 불러오기
    this.secureConnection = this.securityService.isSecureConnectionEnabled();
    this.isHttps = this.securityService.isHttps();
    this.isLocalhost = window.location.hostname === 'localhost';
    this.checkSecureConnectionStatus();
  }

  checkSecureConnectionStatus(): void {
    if (this.secureConnection && !this.isHttps) {
      console.warn('보안접속이 활성화되어 있지만 HTTPS를 사용하지 않고 있습니다.');
    }
  }

  onSecureConnectionChange(enabled: boolean): void {
    this.secureConnection = enabled;
    this.securityService.setSecureConnection(enabled);
    
    if (enabled && !this.isHttps) {
      // HTTPS로 리다이렉트 (서버가 HTTPS를 지원하는 경우)
      this.securityService.enforceHttps();
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      const { email, password } = this.loginForm.value;
      
      this.authService.login({ email, password }).subscribe({
        next: (response) => {
          console.log('로그인 성공:', response);
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Login error', err);
          let errorMessage = '로그인에 실패했습니다.';
          if (err.error?.error?.message) {
            errorMessage = err.error.error.message;
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          }
          alert(errorMessage);
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }
}
