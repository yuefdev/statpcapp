// Bağlantı Ayarları
// USB bağlantısı için: 127.0.0.1 (ADB reverse port forwarding ile)
// Wi-Fi için: PC'nin yerel IP adresini girin (örn: 192.168.1.100)

export const CONNECTION_CONFIG = {
  // PC'nin IP adresi
  // USB + ADB reverse için: '127.0.0.1'
  // Wi-Fi için: PC'nin IP adresini yazın (ipconfig ile bulun)
  
  // ⚠️ TEST MODU: Wi-Fi üzerinden bağlanmak için PC IP'si
  // Aynı ağda olmalısınız!
  host: '10.10.34.126',
  
  // Port numarası (PC sunucusuyla aynı olmalı)
  port: 7700,
};

// Wi-Fi kullanmak için:
// 1. PC'de cmd açın ve "ipconfig" yazın
// 2. IPv4 Address'i bulun (örn: 192.168.1.100)
// 3. Yukarıdaki host değerini o IP ile değiştirin
// 4. PC'de Windows Firewall'da 7700 portuna izin verin
