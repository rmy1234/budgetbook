import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
}

export interface CategoryCreateRequest {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon?: string;
}

export interface CategoryUpdateRequest {
  name?: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getCategories(type?: 'INCOME' | 'EXPENSE'): Observable<Category[]> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }

    return this.http.get<{ data: Category[] }>(this.apiUrl, { params })
      .pipe(
        map(response => response.data)
      );
  }

  createCategory(request: CategoryCreateRequest): Observable<Category> {
    return this.http.post<{ data: Category }>(this.apiUrl, request)
      .pipe(
        map(response => response.data)
      );
  }

  updateCategory(id: number, request: CategoryUpdateRequest): Observable<Category> {
    return this.http.put<{ data: Category }>(`${this.apiUrl}/${id}`, request)
      .pipe(
        map(response => response.data)
      );
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
