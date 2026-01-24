import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-recent-messages',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recent-messages.component.html',
})
export class RecentMessagesComponent implements OnInit {
  chatService = inject(ChatService);
  authService = inject(AuthService);

  ngOnInit() {
    this.chatService.getRecentMessages().subscribe();
  }
}
