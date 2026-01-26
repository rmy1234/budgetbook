import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AiService, AiParseResponse } from '../../../core/services/ai.service';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.scss']
})
export class AiAssistantComponent {
  @Output() transactionParsed = new EventEmitter<AiParseResponse>();

  isOpen = false;
  isLoading = false;
  inputText = '';
  errorMessage = '';

  constructor(private aiService: AiService) {}

  togglePanel(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.errorMessage = '';
    }
  }

  closePanel(): void {
    this.isOpen = false;
    this.inputText = '';
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (!this.inputText.trim() || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.aiService.parseTransaction(this.inputText).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.transactionParsed.emit(response);
          this.inputText = '';
          this.isOpen = false;
        } else {
          this.errorMessage = response.errorMessage || '파싱에 실패했습니다.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = '서버 연결에 실패했습니다.';
        console.error('AI 파싱 오류:', err);
      }
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
    if (event.key === 'Escape') {
      this.closePanel();
    }
  }
}
