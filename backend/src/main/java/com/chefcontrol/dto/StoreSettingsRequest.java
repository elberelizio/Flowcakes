package com.chefcontrol.dto;

import jakarta.validation.constraints.Size;

/**
 * Request para actualizar definições da loja.
 */
public class StoreSettingsRequest {

    @Size(max = 200)
    private String storeName;

    @Size(max = 300)
    private String storeTagline;

    @Size(max = 2000)
    private String storeDescription;

    @Size(max = 50)
    private String storePhone;

    @Size(max = 50)
    private String storeWhatsapp;

    @Size(max = 100)
    private String storeInstagram;

    @Size(max = 100)
    private String storeSlug;

    @Size(max = 500)
    private String storeAddress;

    @Size(max = 255)
    private String storeEmail;

    @Size(max = 300)
    private String storeHours;

    @Size(max = 400)
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
    public String getStoreAddress() { return storeAddress; }
    public void setStoreAddress(String storeAddress) { this.storeAddress = storeAddress; }
    public String getStoreEmail() { return storeEmail; }
    public void setStoreEmail(String storeEmail) { this.storeEmail = storeEmail; }
    public String getStoreHours() { return storeHours; }
    public void setStoreHours(String storeHours) { this.storeHours = storeHours; }
    public String getStoreFooterTagline() { return storeFooterTagline; }
    public void setStoreFooterTagline(String storeFooterTagline) { this.storeFooterTagline = storeFooterTagline; }
}
