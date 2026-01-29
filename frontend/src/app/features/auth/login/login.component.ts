import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  showPassword = false;
  floatingCards: Array<{ delay: number; left: number; top: number; icon: string }> = [];
  
  // 예산 관리 관련 아이콘 목록
  private budgetIcons = [
    'savings',
    'account_balance',
    'attach_money',
    'trending_up',
    'pie_chart',
    'account_balance_wallet',
    'receipt_long',
    'analytics',
    'insights',
    'calculate',
    'monetization_on',
    'credit_card',
    'payments',
    'wallet',
    'bar_chart'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // 배경 애니메이션용 카드 생성
    this.generateFloatingCards();
  }

  generateFloatingCards(): void {
    // 15개의 떠다니는 카드 생성 (아이콘 포함)
    for (let i = 0; i < 15; i++) {
      const randomIcon = this.budgetIcons[Math.floor(Math.random() * this.budgetIcons.length)];
      this.floatingCards.push({
        delay: Math.random() * 5,
        left: Math.random() * 100,
        top: Math.random() * 100,
        icon: randomIcon
      });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
    if (control && control.invalid && (control.dirty || control.touched) && control.value) {
      if (control.errors?.['required']) {
        if (controlName === 'email') return '아이디를 입력해주세요.';
        if (controlName === 'password') return '비밀번호를 입력해주세요.';
      }
      if (control.errors?.['email']) {
        return '올바른 이메일 형식을 입력해주세요.';
      }
    }
    return '';
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
