
import { Product } from './types';

export const WHATSAPP_NUMBER = "2290144167365"; // Remplacez par votre numéro réel
export const BRAND_NAME = "Marifath's Crochet";
export const ADMIN_PASSWORD = "crochet"; // Mot de passe par défaut

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Haut Bikini Signature Marifath",
    description: "Un haut court aux reflets de l'océan, tissé avec un fil de coton premium pour une douceur absolue.",
    price: 18000,
    image: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=800",
    category: 'Hauts'    //mlyseà445GO
  },
  {
    id: 2,
    name: "Robe Longue Horizon Bleu",
    description: "Une pièce magistrale ajourée évoquant la ligne où le ciel rencontre la mer. Élégance aérienne garantie.",
    price: 45000,
    image: "https://images.unsplash.com/photo-1605289355680-75fb41239154?auto=format&fit=crop&q=80&w=800",
    category: 'Robes'
  },
  {
    id: 3,
    name: "Sac Cabas Nuit Marifath",
    description: "L'alliance du noir profond et des nuances iconiques Marifath dans un sac robuste fait pour vos journées ensoleillées.",
    price: 25000,
    image: "https://images.unsplash.com/photo-1590739225287-bd31519780c3?auto=format&fit=crop&q=80&w=800",
    category: 'Accessoires'
  },
  {
    id: 4,
    name: "Ensemble Duo Rose Poudré",
    description: "Un top et une jupe assortis, sculptés pour épouser vos formes dans un dégradé de rose romantique.",
    price: 55000,
    image: "https://images.unsplash.com/photo-1544441893-675973e31d85?auto=format&fit=crop&q=80&w=800",
    category: 'Ensembles'
  },
  {
    id: 5,
    name: "Top Dos Nu Signature Marifath",
    description: "La signature Marifath dans une coupe moderne à lacets, idéale pour sublimer votre bronzage.",
    price: 15000,
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800",
    category: 'Hauts'
  },
  {
    id: 6,
    name: "Robe Cocktail Rose Passion",
    description: "Une robe courte aux motifs complexes, mariant la finesse du crochet et l'énergie du rose intense.",
    price: 38000,
    image: "https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?auto=format&fit=crop&q=80&w=800",
    category: 'Robes'
  }
];
