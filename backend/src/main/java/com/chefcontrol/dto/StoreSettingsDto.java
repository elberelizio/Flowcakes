package com.chefcontrol.dto;

/**
 * Definições da loja pública do utilizador (Meu site).
 */
public class StoreSettingsDto {

    private String storeName;
    private String storeTagline;
    private String storeDescription;
    private String storePhone;
    private String storeWhatsapp;
    private String storeInstagram;
    private String storeSlug;
    private String storeUrl; // URL público para partilhar
    private String storeAddress;
    private String storeEmail;
    private String storeHours;
    private String storeFooterTagline;

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
    public String getStoreUrl() { return storeUrl; }
    public void setStoreUrl(String storeUrl) { this.storeUrl = storeUrl; }
    public String getStoreAddress() { return storeAddress; }
    public void setStoreAddress(String storeAddress) { this.storeAddress = storeAddress; }
    public String getStoreEmail() { return storeEmail; }
    public void setStoreEmail(String storeEmail) { this.storeEmail = storeEmail; }
    public String getStoreHours() { return storeHours; }
    public void setStoreHours(String storeHours) { this.storeHours = storeHours; }
    public String getStoreFooterTagline() { return storeFooterTagline; }
    public void setStoreFooterTagline(String storeFooterTagline) { this.storeFooterTagline = storeFooterTagline; }
}
