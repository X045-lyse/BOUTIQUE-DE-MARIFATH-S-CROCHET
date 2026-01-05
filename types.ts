
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'Hauts' | 'Robes' | 'Accessoires' | 'Ensembles';
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Review {
  id: number;
  firstName: string;
  lastName: string;
  comment: string;
  rating: number;
  image?: string; // Base64 or URL
  date: string;
}
