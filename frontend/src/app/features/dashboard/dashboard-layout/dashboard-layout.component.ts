import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { AiAssistantComponent } from '../ai-assistant/ai-assistant.component';
import { AiConfirmDialogComponent } from '../ai-confirm-dialog/ai-confirm-dialog.component';
import { AiParseResponse } from '../../../core/services/ai.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    AiAssistantComponent
  ],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss']
})
export class DashboardLayoutComponent {
  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  goToHome(): void {
    this.router.navigate(['/']);
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/auth/login';
  }

  onTransactionParsed(parseResult: AiParseResponse): void {
    const dialogRef = this.dialog.open(AiConfirmDialogComponent, {
      width: '450px',
      data: { parseResult },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('거래가 추가되었습니다!', '확인', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
        // TransactionService에서 자동으로 transactionChanged$ 이벤트를 발생시켜
        // 구독 중인 컴포넌트들이 자동으로 새로고침됩니다.
      }
    });
  }
}
