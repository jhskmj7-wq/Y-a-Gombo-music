// Unified support client configuration for AFRIGOMBO
export const supportConfig = {
  phoneNumber: "+225 0503222712",
  name: "Support AFRIGOMBO",
  rawLink: "https://wa.me/2250503222712",
  defaultMessage: "Bonjour 👋\n\nJe contacte le Support AFRIGOMBO concernant : ",
  
  /**
   * Generates a pre-filled WhatsApp link based on the reason/context
   */
  getLink: (reason?: string) => {
    const text = reason 
      ? `Bonjour 👋\n\nJe contacte le Support AFRIGOMBO concernant : ${reason}`
      : "Bonjour 👋\n\nJe contacte le Support AFRIGOMBO concernant : ";
    return `https://wa.me/2250503222712?text=${encodeURIComponent(text)}`;
  },

  /**
   * Automatically opens the WhatsApp link.
   * If on desktop/non-mobile, it can fallback or directly offer WhatsApp Web options or open web.whatsapp.com
   */
  openSupport: (reason?: string) => {
    const text = reason 
      ? `Bonjour 👋\n\nJe contacte le Support AFRIGOMBO concernant : ${reason}`
      : "Bonjour 👋\n\nJe contacte le Support AFRIGOMBO concernant : ";
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // On desktop, to bypass native app requirement and open WhatsApp Web directly, we can use web.whatsapp.com
    // Otherwise, use wa.me which handles mobile redirection flawlessly.
    const url = isMobile 
      ? `https://wa.me/2250503222712?text=${encodeURIComponent(text)}`
      : `https://web.whatsapp.com/send?phone=2250503222712&text=${encodeURIComponent(text)}`;
    
    window.open(url, "_blank", "noopener,noreferrer");
  }
};
