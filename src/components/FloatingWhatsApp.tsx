import { MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/products";

export function FloatingWhatsApp() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá Pandex Store! Tenho interesse em um produto.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[var(--whatsapp)] text-[var(--whatsapp-foreground)] shadow-[0_10px_30px_-5px_rgba(37,211,102,0.6)] transition hover:scale-110 md:bottom-7 md:right-7 md:h-16 md:w-16"
    >
      <MessageCircle className="h-6 w-6 md:h-7 md:w-7" />
      <span className="pointer-events-none absolute -inset-1 animate-ping rounded-full bg-[var(--whatsapp)]/30" />
    </a>
  );
}
