import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../core/config/api.config';

export interface FeedbackPromptStatus {
  eligible: boolean;
  shouldPromptOnLogin: boolean;
  shouldPromptOnLogout: boolean;
  lastSubmittedAt: string | null;
}

export interface UserFeedbackItem {
  id: string;
  userId: string;
  userPhone: string;
  userFullName: string;
  rating: number;
  comment: string | null;
  wouldRecommend: boolean | null;
  createdAt: string;
}

export interface UserFeedbackSubmit {
  rating: number;
  comment?: string;
  wouldRecommend?: boolean | null;
}

@Injectable({ providedIn: 'root' })
export class UserFeedbackService {
  private readonly http = inject(HttpClient);

  getPromptStatus(firstLoginContext: boolean): Promise<FeedbackPromptStatus> {
    return firstValueFrom(
      this.http.get<FeedbackPromptStatus>(`${API_URL}/feedback/prompt-status`, {
        params: { firstLoginContext: String(firstLoginContext) },
      }),
    );
  }

  submit(body: UserFeedbackSubmit): Promise<UserFeedbackItem> {
    return firstValueFrom(this.http.post<UserFeedbackItem>(`${API_URL}/feedback`, body));
  }

  listForAdmin(): Promise<UserFeedbackItem[]> {
    return firstValueFrom(this.http.get<UserFeedbackItem[]>(`${API_URL}/admin/feedback`));
  }

  getAverageForAdmin(): Promise<number> {
    return firstValueFrom(this.http.get<number>(`${API_URL}/admin/feedback/average`));
  }
}
