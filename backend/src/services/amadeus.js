import Amadeus from 'amadeus';
import dotenv from 'dotenv';

dotenv.config();

// Check if the required environment variables are set
if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET) {
  throw new Error('Amadeus API credentials are not defined in your .env file');
}

// Create and export the Amadeus client instance
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET,
});

export default amadeus;