import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;

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
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
    if (control && control.invalid && (control.dirty || control.touched)) {
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
