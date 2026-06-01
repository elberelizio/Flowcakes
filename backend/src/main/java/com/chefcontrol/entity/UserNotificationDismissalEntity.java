package com.chefcontrol.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "user_notification_dismissals")
@IdClass(UserNotificationDismissalEntity.Pk.class)
public class UserNotificationDismissalEntity {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Id
    @Column(name = "notification_id", nullable = false)
    private UUID notificationId;

    @Column(name = "dismissed_at", nullable = false)
    private Instant dismissedAt;

    @PrePersist
    protected void onCreate() {
        if (dismissedAt == null) dismissedAt = Instant.now();
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getNotificationId() { return notificationId; }
    public void setNotificationId(UUID notificationId) { this.notificationId = notificationId; }
    public Instant getDismissedAt() { return dismissedAt; }
    public void setDismissedAt(Instant dismissedAt) { this.dismissedAt = dismissedAt; }

    public static class Pk implements Serializable {
        private UUID userId;
        private UUID notificationId;

        public Pk() {}

        public Pk(UUID userId, UUID notificationId) {
            this.userId = userId;
            this.notificationId = notificationId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            Pk pk = (Pk) o;
            return Objects.equals(userId, pk.userId) && Objects.equals(notificationId, pk.notificationId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, notificationId);
        }
    }
}
