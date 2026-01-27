import { Component, EventEmitter, Output, ViewChild, ElementRef, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AiService, AiParseResponse, ChatMessage, CategoryData, AccountData, SaveMessageRequest } from '../../../core/services/ai.service';
import { CategoryConfirmDialogComponent } from '../category-confirm-dialog/category-confirm-dialog.component';
import { AccountConfirmDialogComponent } from '../account-confirm-dialog/account-confirm-dialog.component';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.scss']
})
export class AiAssistantComponent implements OnInit, AfterViewChecked {
  @Output() transactionParsed = new EventEmitter<AiParseResponse>();
  @Output() categoryCreated = new EventEmitter<void>();
  @Output() accountCreated = new EventEmitter<void>();
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  isOpen = false;
  isLoading = false;
  isHistoryLoaded = false;
  inputText = '';
  messages: ChatMessage[] = [];
  private shouldScrollToBottom = false;

  constructor(
    private aiService: AiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // 컴포넌트 초기화 시 대화 내역 로드
    this.loadChatHistory();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private loadChatHistory(): void {
    this.aiService.getChatHistory().subscribe({
      next: (history) => {
        this.messages = history;
        this.isHistoryLoaded = true;
        if (this.isOpen) {
          this.shouldScrollToBottom = true;
        }
      },
      error: (err) => {
        console.error('대화 내역 로드 실패:', err);
        this.isHistoryLoaded = true;
      }
    });
  }

  togglePanel(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.messages.length === 0 && this.isHistoryLoaded) {
      // 처음 열 때 환영 메시지 추가 및 저장
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: '안녕하세요! 무엇을 도와드릴까요?\n\n거래 기록, 카테고리 생성, 계좌 등록 등을 도와드릴 수 있어요. "사용법" 또는 "도움말"이라고 말씀해주시면 자세한 안내를 드릴게요!',
        actionType: 'CHAT',
        timestamp: new Date()
      };
      this.messages.push(welcomeMessage);
      this.saveMessageToServer(welcomeMessage);
    }
    this.shouldScrollToBottom = true;
  }

  closePanel(): void {
    this.isOpen = false;
  }

  clearChat(): void {
    // 서버에서 대화 내역 삭제
    this.aiService.clearChatHistory().subscribe({
      next: () => {
        this.messages = [];
        const welcomeMessage: ChatMessage = {
          role: 'assistant',
          content: '안녕하세요! 무엇을 도와드릴까요?\n\n거래 기록, 카테고리 생성, 계좌 등록 등을 도와드릴 수 있어요. "사용법" 또는 "도움말"이라고 말씀해주시면 자세한 안내를 드릴게요!',
          actionType: 'CHAT',
          timestamp: new Date()
        };
        this.messages.push(welcomeMessage);
        this.saveMessageToServer(welcomeMessage);
        this.shouldScrollToBottom = true;
      },
      error: (err) => {
        console.error('대화 내역 삭제 실패:', err);
      }
    });
  }

  sendMessage(): void {
    if (!this.inputText.trim() || this.isLoading) {
      return;
    }

    const userMessage = this.inputText.trim();
    this.inputText = '';

    // 사용자 메시지 추가 및 저장
    const userChatMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    this.messages.push(userChatMessage);
    this.saveMessageToServer(userChatMessage);
    this.shouldScrollToBottom = true;

    this.isLoading = true;

    this.aiService.chat(userMessage).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        // AI 응답 메시지 추가 및 저장
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.message,
          actionType: response.actionType,
          transaction: response.hasTransaction ? response.transaction : null,
          category: response.category,
          account: response.account,
          timestamp: new Date()
        };
        this.messages.push(assistantMessage);
        this.saveMessageToServer(assistantMessage);
        this.shouldScrollToBottom = true;
      },
      error: (err) => {
        this.isLoading = false;
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: '죄송합니다. 응답을 가져오는 중 오류가 발생했습니다. 다시 시도해주세요.',
          actionType: 'CHAT',
          timestamp: new Date()
        };
        this.messages.push(errorMessage);
        this.saveMessageToServer(errorMessage);
        this.shouldScrollToBottom = true;
        console.error('AI 채팅 오류:', err);
      }
    });
  }

  private saveMessageToServer(message: ChatMessage): void {
    const request: SaveMessageRequest = {
      role: message.role.toUpperCase(),
      content: message.content,
      actionType: message.actionType,
      transaction: message.transaction,
      category: message.category,
      account: message.account
    };

    this.aiService.saveMessage(request).subscribe({
      next: (savedMessage) => {
        // 서버에서 ID를 받아서 업데이트
        const index = this.messages.findIndex(m => 
          m.content === message.content && 
          m.role === message.role && 
          !m.id
        );
        if (index !== -1) {
          this.messages[index].id = savedMessage.id;
        }
      },
      error: (err) => {
        console.error('메시지 저장 실패:', err);
      }
    });
  }

  addTransaction(transaction: AiParseResponse): void {
    this.transactionParsed.emit(transaction);
  }

  createCategory(category: CategoryData): void {
    const dialogRef = this.dialog.open(CategoryConfirmDialogComponent, {
      width: '400px',
      data: { category },
      panelClass: 'ai-confirm-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const successMessage: ChatMessage = {
          role: 'assistant',
          content: `'${category.name}' 카테고리가 성공적으로 생성되었습니다! 🎉`,
          actionType: 'CHAT',
          timestamp: new Date()
        };
        this.messages.push(successMessage);
        this.saveMessageToServer(successMessage);
        this.shouldScrollToBottom = true;
        this.categoryCreated.emit();
      }
    });
  }

  createAccount(account: AccountData): void {
    const dialogRef = this.dialog.open(AccountConfirmDialogComponent, {
      width: '400px',
      data: { account },
      panelClass: 'ai-confirm-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const successMessage: ChatMessage = {
          role: 'assistant',
          content: `'${account.bankName} ${account.alias}' 계좌가 성공적으로 등록되었습니다! 🎉`,
          actionType: 'CHAT',
          timestamp: new Date()
        };
        this.messages.push(successMessage);
        this.saveMessageToServer(successMessage);
        this.shouldScrollToBottom = true;
        this.accountCreated.emit();
      }
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
    if (event.key === 'Escape') {
      this.closePanel();
    }
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('ko-KR');
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('스크롤 오류:', err);
    }
  }
}
