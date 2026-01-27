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

export interface CategoryData {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
}

export interface AccountData {
  bankName: string;
  alias: string;
  balance: number;
}

export type ActionType = 'CHAT' | 'TRANSACTION' | 'CATEGORY' | 'ACCOUNT' | 'HELP';

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  actionType?: ActionType;
  transaction?: AiParseResponse | null;
  category?: CategoryData | null;
  account?: AccountData | null;
  timestamp: Date;
}

export interface SaveMessageRequest {
  role: string;
  content: string;
  actionType?: string;
  transaction?: AiParseResponse | null;
  category?: CategoryData | null;
  account?: AccountData | null;
}

export interface ChatResponse {
  message: string;
  actionType: ActionType;
  hasTransaction: boolean;
  transaction: AiParseResponse | null;
  category: CategoryData | null;
  account: AccountData | null;
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

  chat(message: string): Observable<ChatResponse> {
    return this.http.post<{ data: ChatResponse }>(`${this.apiUrl}/chat`, { message })
      .pipe(
        map(response => response.data)
      );
  }

  getChatHistory(): Observable<ChatMessage[]> {
    return this.http.get<{ data: ChatMessage[] }>(`${this.apiUrl}/chat/history`)
      .pipe(
        map(response => response.data.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })))
      );
  }

  saveMessage(request: SaveMessageRequest): Observable<ChatMessage> {
    return this.http.post<{ data: ChatMessage }>(`${this.apiUrl}/chat/history`, request)
      .pipe(
        map(response => ({
          ...response.data,
          timestamp: new Date(response.data.timestamp)
        }))
      );
  }

  clearChatHistory(): Observable<void> {
    return this.http.delete<{ data: void }>(`${this.apiUrl}/chat/history`)
      .pipe(
        map(() => void 0)
      );
  }
}
