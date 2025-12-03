# HonestInvoice - Vercel Deployment Guide

This guide will help you deploy HonestInvoice to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

## Deployment Options

### Option 1: Vercel CLI (Recommended)

1. **Login to Vercel**:
   ```bash
   vercel login
   ```

2. **Deploy the project**:
   ```bash
   # From the honestinvoice directory
   npm run build:prod
   vercel --prod
   ```

3. **Follow the prompts**:
   - Set up and deploy: `Y`
   - Which scope: Select your account
   - Link to existing project: `N`
   - Project name: `honestinvoice` (or your preference)
   - In which directory: `./` (current directory)
   - Override settings: `N`

### Option 2: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from Git repository (GitHub, GitLab, etc.)
4. Select your HonestInvoice repository
5. Configure project:
   - Framework Preset: **Vite**
   - Build Command: `npm run build:prod`
   - Output Directory: `dist`
6. Click "Deploy"

### Option 3: Deploy Script

1. Make the script executable:
   ```bash
   chmod +x deploy-vercel.sh
   ```

2. Run the deploy script:
   ```bash
   ./deploy-vercel.sh
   ```

## Configuration Details

The project includes the following Vercel configuration:

- **vercel.json**: Configures build and routing
- **.vercelignore**: Excludes unnecessary files from deployment
- **Build script**: Uses `build:prod` for production build

## After Deployment

Once deployed, your site will be available at:
- Production URL: `https://your-project-name.vercel.app`
- Custom domain (if configured): Your custom domain

## Environment Variables (If Needed)

If your application requires environment variables:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add your variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - Other environment variables as needed

## Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check Node.js version compatibility (recommended: Node.js 18+)

### Runtime Errors
- Verify environment variables are set correctly
- Check Supabase configuration
- Review Vercel Function Logs for detailed errors

## Support

For Vercel-specific issues, visit:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

---

**HonestInvoice** - Transparent Invoicing Platform