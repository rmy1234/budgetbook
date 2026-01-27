import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryData } from '../../../core/services/ai.service';

export interface CategoryConfirmDialogData {
  category: CategoryData;
}

@Component({
  selector: 'app-category-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './category-confirm-dialog.component.html',
  styleUrls: ['./category-confirm-dialog.component.scss']
})
export class CategoryConfirmDialogComponent {
  categoryForm: FormGroup;
  loading = false;

  iconOptions = [
    { value: 'restaurant', label: '음식' },
    { value: 'local_cafe', label: '카페' },
    { value: 'fastfood', label: '패스트푸드' },
    { value: 'directions_car', label: '자동차' },
    { value: 'directions_bus', label: '대중교통' },
    { value: 'local_taxi', label: '택시' },
    { value: 'shopping_cart', label: '쇼핑' },
    { value: 'shopping_bag', label: '쇼핑백' },
    { value: 'movie', label: '영화' },
    { value: 'sports_esports', label: '게임' },
    { value: 'music_note', label: '음악' },
    { value: 'local_hospital', label: '병원' },
    { value: 'medical_services', label: '의료' },
    { value: 'school', label: '교육' },
    { value: 'menu_book', label: '책' },
    { value: 'payments', label: '결제' },
    { value: 'account_balance', label: '은행' },
    { value: 'home', label: '집' },
    { value: 'flight', label: '여행' },
    { value: 'fitness_center', label: '운동' },
    { value: 'category', label: '기타' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CategoryConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CategoryConfirmDialogData,
    private categoryService: CategoryService
  ) {
    this.categoryForm = this.fb.group({
      name: [data.category.name, [Validators.required, Validators.minLength(1)]],
      type: [data.category.type, Validators.required],
      icon: [data.category.icon || 'category', Validators.required]
    });
  }

  onSave(): void {
    if (this.categoryForm.valid && !this.loading) {
      this.loading = true;
      const formValue = this.categoryForm.value;

      this.categoryService.createCategory({
        name: formValue.name,
        type: formValue.type,
        icon: formValue.icon
      }).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('카테고리 생성 실패:', err);
          alert(err.error?.message || '카테고리 생성에 실패했습니다.');
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
