export interface Destination {
    id: string;
    title: string;
    image: string;
    location: string;
    description?: string;
  }
  
  // Single array of all top picks destinations
  export const topPicksDestinations: Destination[] = [
    {
      id: "paris",
      title: "Paris",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      location: "Paris, France",
      description: "The City of Light, known for its art, fashion, cuisine, and iconic landmarks like the Eiffel Tower"
    },
    {
      id: "mumbai",
      title: "Mumbai",
      image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      location: "Mumbai, India",
      description: "India's financial capital, famous for Bollywood, street food, and the Gateway of India"
    },
    {
      id: "goa",
      title: "Goa",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      location: "Goa, India",
      description: "Tropical paradise with pristine beaches, Portuguese heritage, and vibrant nightlife"
    },
    {
      id: "delhi",
      title: "Delhi",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      location: "Delhi, India",
      description: "India's capital city, rich in history with monuments like Red Fort and Qutub Minar"
    },
    {
      id: "london",
      title: "London",
      image: "https://images.unsplash.com/photo-1513635269975-59663e0ae1c2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      location: "London, UK",
      description: "Historic city with royal palaces, world-class museums, and the iconic Big Ben"
    },
    {
      id: "tokyo",
      title: "Tokyo",
      image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      location: "Tokyo, Japan",
      description: "Modern metropolis blending traditional culture with cutting-edge technology"
    },
    {
      id: "dubai",
      title: "Dubai",
      image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      location: "Dubai, UAE",
      description: "Ultra-modern city with luxury shopping, skyscrapers, and desert adventures"
    },
    {
      id: "bangkok",
      title: "Bangkok",
      image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      location: "Bangkok, Thailand",
      description: "Vibrant city known for street food, temples, floating markets, and nightlife"
    }
  ];
  
  export const getAllDestinations = (): Destination[] => {
    return topPicksDestinations;
  };
  