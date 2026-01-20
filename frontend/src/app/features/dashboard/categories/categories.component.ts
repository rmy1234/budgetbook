import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CategoryService, Category, CategoryCreateRequest } from '../../../core/services/category.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatTabsModule,
    MatSnackBarModule
  ],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  incomeCategories: Category[] = [];
  expenseCategories: Category[] = [];
  displayedColumns: string[] = ['name', 'actions'];
  categoryForm: FormGroup;
  isEditing = false;
  editingCategoryId: number | null = null;
  selectedTab = 0;

  constructor(
    private categoryService: CategoryService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required]],
      type: ['EXPENSE', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.incomeCategories = categories.filter(c => c.type === 'INCOME');
        this.expenseCategories = categories.filter(c => c.type === 'EXPENSE');
      },
      error: (error) => {
        this.snackBar.open('카테고리 목록을 불러오는데 실패했습니다', '닫기', { duration: 3000 });
      }
    });
  }

  onTabChange(index: number): void {
    this.selectedTab = index;
    const type = index === 0 ? 'EXPENSE' : 'INCOME';
    this.categoryForm.patchValue({ type });
  }

  onSubmit(): void {
    if (this.categoryForm.valid) {
      const formValue = this.categoryForm.value;
      const request: CategoryCreateRequest = {
        name: formValue.name,
        type: formValue.type
      };

      if (this.isEditing && this.editingCategoryId) {
        this.categoryService.updateCategory(this.editingCategoryId, {
          name: request.name
        }).subscribe({
          next: () => {
            this.snackBar.open('카테고리가 수정되었습니다', '닫기', { duration: 3000 });
            this.resetForm();
            this.loadCategories();
          },
          error: (error) => {
            const message = error.error?.error?.message || '카테고리 수정에 실패했습니다';
            this.snackBar.open(message, '닫기', { duration: 3000 });
          }
        });
      } else {
        this.categoryService.createCategory(request).subscribe({
          next: () => {
            this.snackBar.open('카테고리가 생성되었습니다', '닫기', { duration: 3000 });
            this.resetForm();
            this.loadCategories();
          },
          error: (error) => {
            const message = error.error?.error?.message || '카테고리 생성에 실패했습니다';
            this.snackBar.open(message, '닫기', { duration: 3000 });
          }
        });
      }
    }
  }

  editCategory(category: Category): void {
    this.isEditing = true;
    this.editingCategoryId = category.id;
    this.categoryForm.patchValue({
      name: category.name,
      type: category.type
    });
    this.selectedTab = category.type === 'INCOME' ? 1 : 0;
    // 수정 모드에서는 타입 필드를 비활성화
    this.categoryForm.get('type')?.disable();
  }

  deleteCategory(category: Category): void {
    if (confirm(`정말로 "${category.name}" 카테고리를 삭제하시겠습니까?`)) {
      this.categoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.snackBar.open('카테고리가 삭제되었습니다', '닫기', { duration: 3000 });
          this.loadCategories();
        },
        error: (error) => {
          const message = error.error?.error?.message || '카테고리 삭제에 실패했습니다';
          this.snackBar.open(message, '닫기', { duration: 3000 });
        }
      });
    }
  }

  resetForm(): void {
    this.categoryForm.reset({
      name: '',
      type: this.selectedTab === 0 ? 'EXPENSE' : 'INCOME'
    });
    this.isEditing = false;
    this.editingCategoryId = null;
    // 등록 모드에서는 타입 필드를 활성화
    this.categoryForm.get('type')?.enable();
  }

  getCategoriesForTab(): Category[] {
    return this.selectedTab === 0 ? this.expenseCategories : this.incomeCategories;
  }
}
