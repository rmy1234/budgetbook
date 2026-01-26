import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AiParseRequest {
  text: string;
}

export interface AiParseResponse {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  categoryName: string;
  categoryId: number | null;
  memo: string;
  confidence: number;
  success: boolean;
  errorMessage: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private apiUrl = `${environment.apiUrl}/ai`;

  constructor(private http: HttpClient) {}

  parseTransaction(text: string): Observable<AiParseResponse> {
    return this.http.post<{ data: AiParseResponse }>(`${this.apiUrl}/parse-transaction`, { text })
      .pipe(
        map(response => response.data)
      );
  }
}
