package com.chefcontrol.mpesa;

import javax.crypto.Cipher;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

/**
 * Encripta a API Key (ou Session Key) com a chave pública RSA do M-Pesa OpenAPI.
 * Resultado: Base64 string para usar no header Authorization: Bearer ...
 */
public final class MpesaCrypto {

    private MpesaCrypto() {}

    public static String encrypt(String keyToEncrypt, String publicKeyBase64) {
        try {
            byte[] publicKeyBytes = Base64.getDecoder().decode(publicKeyBase64);
            X509EncodedKeySpec spec = new X509EncodedKeySpec(publicKeyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            PublicKey publicKey = keyFactory.generatePublic(spec);

            Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
            cipher.init(Cipher.ENCRYPT_MODE, publicKey);

            byte[] encrypted = cipher.doFinal(keyToEncrypt.getBytes("UTF-8"));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            throw new RuntimeException("Falha ao encriptar chave M-Pesa: " + e.getMessage(), e);
        }
    }
}
