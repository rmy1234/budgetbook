import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  loading = false;
  checkingEmail = false;
  emailChecked = false;
  emailAvailable: boolean | null = null;
  emailCheckMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      age: ['', [Validators.required, Validators.min(1)]]
    }, { validators: this.passwordMatchValidator });
  }

  getErrorMessage(controlName: string): string {
    const control = this.signupForm.get(controlName);
    if (control && control.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) {
        if (controlName === 'name') return '이름을 입력해주세요.';
        if (controlName === 'email') return '아이디를 입력해주세요.';
        if (controlName === 'password') return '비밀번호를 입력해주세요.';
        if (controlName === 'confirmPassword') return '비밀번호를 다시 입력해주세요.';
        if (controlName === 'age') return '나이를 입력해주세요.';
      }
      if (control.errors?.['minlength']) {
        if (controlName === 'name') return '이름은 최소 2자 이상 입력해주세요.';
        if (controlName === 'password') return '비밀번호는 최소 8자 이상 입력해주세요.';
      }
      if (control.errors?.['email']) {
        return '올바른 이메일 형식을 입력해주세요.';
      }
      if (control.errors?.['min']) {
        return '나이는 1 이상 입력해주세요.';
      }
      if (control.errors?.['passwordMismatch']) {
        return '비밀번호가 일치하지 않습니다.';
      }
    }
    return '';
  }

  passwordMatchValidator(formGroup: AbstractControl): ValidationErrors | null {
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');
    
    if (password && confirmPassword && password.value && confirmPassword.value && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      if (confirmPassword && confirmPassword.hasError('passwordMismatch')) {
        const errors = { ...confirmPassword.errors };
        delete errors['passwordMismatch'];
        const hasOtherErrors = Object.keys(errors).length > 0;
        confirmPassword.setErrors(hasOtherErrors ? errors : null);
      }
      return null;
    }
  }

  ngOnInit(): void {
    // 이메일 입력 시 중복확인 상태 초기화
    this.signupForm.get('email')?.valueChanges.subscribe(() => {
      this.emailChecked = false;
      this.emailAvailable = null;
      this.emailCheckMessage = '';
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  checkEmailDuplicate(): void {
    const email = this.signupForm.get('email')?.value;
    
    if (!email) {
      return;
    }

    // 이메일 형식 검증
    if (this.signupForm.get('email')?.hasError('email')) {
      return;
    }

    this.checkingEmail = true;
    this.emailChecked = false;
    this.emailAvailable = null;
    this.emailCheckMessage = '';

    this.authService.checkEmail(email).subscribe({
      next: (response) => {
        this.checkingEmail = false;
        this.emailChecked = true;
        this.emailAvailable = response.available;
        this.emailCheckMessage = response.available 
          ? '중복되지 않은 이메일 입니다!' 
          : '중복된 이메일 입니다!';
      },
      error: (err) => {
        this.checkingEmail = false;
        this.emailChecked = true;
        this.emailAvailable = false;
        this.emailCheckMessage = '중복된 이메일 입니다!';
        console.error('Email check error', err);
      }
    });
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      this.loading = true;
      const formValue = this.signupForm.value;
      
      this.authService.signup({
        name: formValue.name,
        email: formValue.email,
        password: formValue.password,
        age: formValue.age ? parseInt(formValue.age, 10) : 0
      }).subscribe({
        next: () => {
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          console.error('Signup error', err);
          let errorMessage = '회원가입에 실패했습니다.';
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
