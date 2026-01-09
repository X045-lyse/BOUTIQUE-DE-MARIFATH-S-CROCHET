
// Variables publiques et configurables via Vite (préfixées par VITE_)
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? "2290144167365";
export const BRAND_NAME = import.meta.env.VITE_BRAND_NAME ?? "Marifath's Crochet";
// ADMIN_PASSWORD peut être défini via la variable d'environnement VITE_ADMIN_PASSWORD.
// Par compatibilité locale, on utilise 'crochet' comme valeur par défaut si la variable n'est pas fournie.
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "crochet";

