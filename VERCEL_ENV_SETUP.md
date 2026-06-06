# Vercel Environment Variables Setup

This document lists all required and optional environment variables for deploying Glamora to Vercel.

## Required Environment Variables

### Authentication
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key for client-side authentication
- `CLERK_SECRET_KEY` - Clerk secret key for server-side authentication

### Database
- `MONGODB_URI` - MongoDB connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/glamora`)

### AI Services (Choose at least one)
- `GEMINI_API_KEY` - Google AI Studio API key for Gemini models (starts with `AIza`)
  - Used for: Chatbot, BeautyAI, Hairstyle Preview, Dashboard AI insights
  - Get it from: https://makersuite.google.com/app/apikey
  
- `GROQ_API_KEY` - Groq API key for fast LLM inference
  - Used as: Fallback for text generation
  - Get it from: https://console.groq.com/keys

## Optional Environment Variables

### AI Model Configuration
- `GEMINI_AGENT_MODEL` - Model name for agent chatbot (default: `gemini-2.0-flash`)
- `GEMINI_VISION_MODEL` - Model name for vision tasks (default: `gemini-2.0-flash`)
- `GEMINI_MARKETING_MODEL` - Model name for marketing copy (default: `gemini-2.0-flash`)
- `GROQ_MODEL` - Groq model for text (default: `llama-3.3-70b-versatile`)
- `GROQ_VISION_MODEL` - Groq model for vision (default: `meta-llama/Llama-4-Scout-17B-16E-Instruct`)

### Feature Flags
- `AGENT_USE_LLM` - Enable/disable AI agent (default: `true`, set to `false` to disable)
- `ENABLE_SEED` - Enable database seed endpoint (default: `false`)
- `SEED_SECRET` - Secret key for seed endpoint protection (required if ENABLE_SEED=true)

### Image Storage
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name for image uploads
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

## Deployment Steps

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add all required variables from the list above
4. For production deployment, add variables to "Production" environment
5. For preview deployments, add variables to "Preview" environment
6. Redeploy your application after adding variables

## Important Notes

- **AI Services**: The app requires at least one AI service (Gemini or Groq) to function properly. Without them, AI features will fall back to basic keyword matching.
- **Gemini API Key**: Must start with `AIza` prefix. If you get "ACCESS_TOKEN_TYPE_UNSUPPORTED" error, check that your key is correctly formatted.
- **MongoDB**: Ensure your MongoDB URI allows connections from Vercel's IP addresses (whitelist 0.0.0.0/0 for development).
- **Clerk**: You need to create a Clerk application at https://dashboard.clerk.com/ to get the keys.

## Troubleshooting

### Chatbot giving same responses
- Check that `GEMINI_API_KEY` or `GROQ_API_KEY` is set correctly
- Verify the API key is valid and not expired
- Check Vercel logs for authentication errors

### BeautyAI/Hairstyle Preview not working
- Ensure vision model is configured (Gemini or Groq)
- Check that the API key has vision capabilities enabled

### Database connection errors
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas whitelist settings
- Ensure database user has correct permissions

### Booking functionality issues
- Verify MongoDB connection is working
- Check that salon data is seeded in the database
- Review booking API logs in Vercel
