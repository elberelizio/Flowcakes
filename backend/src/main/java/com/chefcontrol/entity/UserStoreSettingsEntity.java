package com.chefcontrol.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_store_settings")
public class UserStoreSettingsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "store_name", nullable = false, length = 200)
    private String storeName = "Minha Loja";

    @Column(name = "store_tagline", length = 300)
    private String storeTagline;

    @Column(name = "store_description", columnDefinition = "TEXT")
    private String storeDescription;

    @Column(name = "store_phone", length = 50)
    private String storePhone;

    @Column(name = "store_whatsapp", length = 50)
    private String storeWhatsapp;

    @Column(name = "store_instagram", length = 100)
    private String storeInstagram;

    @Column(name = "store_slug", length = 100, unique = true)
    private String storeSlug;

    @Column(name = "store_address", length = 500)
    private String storeAddress;

    @Column(name = "store_email", length = 255)
    private String storeEmail;

    @Column(name = "store_hours", length = 300)
    private String storeHours;

    @Column(name = "store_footer_tagline", length = 400)
    private String storeFooterTagline;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getStoreName() { return storeName; }
    public void setStoreName(String storeName) { this.storeName = storeName; }
    public String getStoreTagline() { return storeTagline; }
    public void setStoreTagline(String storeTagline) { this.storeTagline = storeTagline; }
    public String getStoreDescription() { return storeDescription; }
    public void setStoreDescription(String storeDescription) { this.storeDescription = storeDescription; }
    public String getStorePhone() { return storePhone; }
    public void setStorePhone(String storePhone) { this.storePhone = storePhone; }
    public String getStoreWhatsapp() { return storeWhatsapp; }
    public void setStoreWhatsapp(String storeWhatsapp) { this.storeWhatsapp = storeWhatsapp; }
    public String getStoreInstagram() { return storeInstagram; }
    public void setStoreInstagram(String storeInstagram) { this.storeInstagram = storeInstagram; }
    public String getStoreSlug() { return storeSlug; }
    public void setStoreSlug(String storeSlug) { this.storeSlug = storeSlug; }
    public String getStoreAddress() { return storeAddress; }
    public void setStoreAddress(String storeAddress) { this.storeAddress = storeAddress; }
    public String getStoreEmail() { return storeEmail; }
    public void setStoreEmail(String storeEmail) { this.storeEmail = storeEmail; }
    public String getStoreHours() { return storeHours; }
    public void setStoreHours(String storeHours) { this.storeHours = storeHours; }
    public String getStoreFooterTagline() { return storeFooterTagline; }
    public void setStoreFooterTagline(String storeFooterTagline) { this.storeFooterTagline = storeFooterTagline; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
